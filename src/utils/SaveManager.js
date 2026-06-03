// src/utils/SaveManager.js
const SAVE_KEY = 'safe_space_saves';

function readSaves() {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
  } catch {
    localStorage.removeItem(SAVE_KEY);
    return {};
  }
}

export const SaveManager = {
  saveGame(slot, data) {
    const saves = this.getAllSaves();
    saves[slot] = {
      ...data,
      timestamp: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saves));
  },
  loadGame(slot) {
    const saves = this.getAllSaves();
    return saves[slot] || null;
  },
  deleteSave(slot) {
    const saves = this.getAllSaves();
    delete saves[slot];
    localStorage.setItem(SAVE_KEY, JSON.stringify(saves));
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
  resetAll() {
    localStorage.removeItem(SAVE_KEY);
  },
};
