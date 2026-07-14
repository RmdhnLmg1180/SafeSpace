// src/utils/SaveManager.js
const SAVE_KEY = 'safe_space_saves';
const REFLECTION_KEY = 'safe_space_reflections';
const REFLECTION_TTL_MS = 90 * 24 * 60 * 60 * 1000;
const SAVE_VERSION = 2;

function readStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}');
  } catch {
    localStorage.removeItem(key);
    return {};
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`SAFE-SPACE gagal menyimpan ${key}:`, error);
    return false;
  }
}

function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function normalizeSlot(slot, chapter = 1) {
  if (slot === 'linear') return 'linear';
  const numeric = clampNumber(slot ?? chapter, chapter, 1, 3);
  return String(Math.round(numeric));
}

function cloneSerializable(value, fallback) {
  try {
    return JSON.parse(JSON.stringify(value ?? fallback));
  } catch {
    return fallback;
  }
}

function normalizeSave(data = {}, existing = {}) {
  const currentChapter = Math.round(clampNumber(data.currentChapter, 1, 1, 3));
  const now = Date.now();
  return {
    version: SAVE_VERSION,
    currentChapter,
    currentDay: Math.round(clampNumber(data.currentDay, 1, 1, 7)),
    mentalShield: Math.round(clampNumber(data.mentalShield, 0, 0, 100)),
    mentalState: Math.round(clampNumber(data.mentalState, 100, 0, 100)),
    playerChoices: cloneSerializable(data.playerChoices, []),
    storyMode: data.storyMode === 'linear' ? 'linear' : 'single',
    flowResults: cloneSerializable(data.flowResults, {}),
    createdAt: existing.createdAt || data.createdAt || now,
    timestamp: now,
  };
}

function readSaves() {
  return readStorage(SAVE_KEY);
}

function readReflections() {
  return purgeExpiredReflections(readStorage(REFLECTION_KEY));
}

function purgeExpiredReflections(reflections) {
  const now = Date.now();
  let changed = false;
  const valid = {};

  Object.entries(reflections).forEach(([id, data]) => {
    if (!data?.expiresAt || data.expiresAt <= now) {
      changed = true;
      return;
    }

    valid[id] = data;
  });

  if (changed) {
    writeStorage(REFLECTION_KEY, valid);
  }

  return valid;
}

export const SaveManager = {
  saveGame(slot, data) {
    const saves = this.getAllSaves();
    const normalizedSlot = normalizeSlot(slot, data?.currentChapter);
    saves[normalizedSlot] = normalizeSave(data, saves[normalizedSlot]);
    return writeStorage(SAVE_KEY, saves) ? saves[normalizedSlot] : null;
  },
  loadGame(slot) {
    const saves = this.getAllSaves();
    return saves[normalizeSlot(slot)] || null;
  },
  deleteSave(slot) {
    const saves = this.getAllSaves();
    delete saves[normalizeSlot(slot)];
    return writeStorage(SAVE_KEY, saves);
  },
  getAllSaves() {
    const stored = readSaves();
    return Object.fromEntries(
      Object.entries(stored)
        .filter(([, data]) => data && typeof data === 'object')
        .map(([slot, data]) => [normalizeSlot(slot, data.currentChapter), { ...normalizeSave(data, data), timestamp: Number(data.timestamp) || Date.now() }]),
    );
  },
  continueLastGame() {
    const saves = this.getAllSaves();
    let lastSlot = null;
    let lastTime = 0;
    Object.entries(saves).forEach(([slot, data]) => {
      const savedTime = Number(data.timestamp) || 0;
      if (savedTime > lastTime) {
        lastTime = savedTime;
        lastSlot = slot;
      }
    });
    return lastSlot ? { slot: lastSlot, data: saves[lastSlot] } : null;
  },
  saveReflection(id, data) {
    const reflections = this.getAllReflections();
    const savedAt = Date.now();

    reflections[id] = {
      ...data,
      id,
      savedAt,
      expiresAt: savedAt + REFLECTION_TTL_MS,
    };

    return writeStorage(REFLECTION_KEY, reflections) ? reflections[id] : null;
  },
  loadReflection(id) {
    const reflections = this.getAllReflections();
    return reflections[id] || null;
  },
  deleteReflection(id) {
    const reflections = this.getAllReflections();
    delete reflections[id];
    writeStorage(REFLECTION_KEY, reflections);
  },
  getAllReflections() {
    return readReflections();
  },
  resetAll() {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(REFLECTION_KEY);
    localStorage.removeItem('safe_space_results_v1');
  },
};

export function getReflectionId({ storyMode = 'single', chapter = 1 } = {}) {
  if (storyMode === 'linear' || chapter === 'linear') return 'linear';
  return `chapter-${chapter}`;
}

export const REFLECTION_TTL_DAYS = Math.round(REFLECTION_TTL_MS / (24 * 60 * 60 * 1000));
