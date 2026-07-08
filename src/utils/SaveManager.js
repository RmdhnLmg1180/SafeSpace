// src/utils/SaveManager.js
const SAVE_KEY = 'safe_space_saves';
const REFLECTION_KEY = 'safe_space_reflections';
const REFLECTION_TTL_MS = 90 * 24 * 60 * 60 * 1000;

function readStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}');
  } catch {
    localStorage.removeItem(key);
    return {};
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
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
    saves[slot] = {
      ...data,
      timestamp: Date.now(),
    };
    writeStorage(SAVE_KEY, saves);
  },
  loadGame(slot) {
    const saves = this.getAllSaves();
    return saves[slot] || null;
  },
  deleteSave(slot) {
    const saves = this.getAllSaves();
    delete saves[slot];
    writeStorage(SAVE_KEY, saves);
  },
  getAllSaves() {
    return readSaves();
  },
  continueLastGame() {
    const saves = this.getAllSaves();
    let lastSlot = null;
    let lastTime = 0;
    Object.entries(saves).forEach(([slot, data]) => {
      if (data.timestamp > lastTime) {
        lastTime = data.timestamp;
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

    writeStorage(REFLECTION_KEY, reflections);
    return reflections[id];
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
