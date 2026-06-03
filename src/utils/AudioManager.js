// src/utils/AudioManager.js
import { AUDIO_ASSETS } from './AudioAssets';

const AUDIO_PATHS = [...AUDIO_ASSETS.music, ...AUDIO_ASSETS.sfx].reduce((paths, asset) => {
  paths[asset.key] = asset.path;
  return paths;
}, {});

class AudioManager {
  constructor(game) {
    this.game = game;
    this.settings = this.loadSettings();
    this.music = null;
    this.musicKey = null;
    this.sfx = {};
    this.pendingMusic = null;
    this.unlockHandlerRegistered = false;
    this.registerUnlockHandler();
  }

  loadSettings() {
    const defaults = {
      master: 1,
      music: 1,
      sfx: 1,
      mute: false,
    };

    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem('safe_space_audio') || '{}') };
    } catch {
      localStorage.removeItem('safe_space_audio');
      return defaults;
    }
  }

  saveSettings() {
    localStorage.setItem('safe_space_audio', JSON.stringify(this.settings));
  }

  setMasterVolume(val) {
    this.settings.master = val;
    this.updateVolumes();
    this.saveSettings();
  }

  setMusicVolume(val) {
    this.settings.music = val;
    this.updateVolumes();
    this.saveSettings();
  }

  setSFXVolume(val) {
    this.settings.sfx = val;
    this.saveSettings();
  }

  setMute(mute) {
    this.settings.mute = mute;
    this.updateVolumes();
    this.saveSettings();
  }

  updateVolumes() {
    if (this.music) {
      this.music.volume = this.settings.music * this.settings.master * (this.settings.mute ? 0 : 1);
    }
  }

  registerUnlockHandler() {
    if (this.unlockHandlerRegistered) return;
    this.unlockHandlerRegistered = true;

    if (typeof document === 'undefined') return;

    document.addEventListener('pointerdown', () => {
      this.unlockAudio();
      this.resumePendingMusic();
    });
  }

  unlockAudio() {
    try {
      const context = this.game.sound?.context;
      if (context?.state === 'suspended') {
        context.resume();
      }
    } catch {
      // Browser audio unlock is best-effort; the game UI should never depend on it.
    }
  }

  playMusic(key, config = {}) {
    try {
      this.registerUnlockHandler();
      const path = AUDIO_PATHS[key];
      if (!path || typeof Audio === 'undefined') return;

      if (this.musicKey === key && this.music && !this.music.paused) {
        this.updateVolumes();
        return;
      }

      if (this.music) {
        this.music.pause();
        this.music.currentTime = 0;
      }

      this.unlockAudio();
      this.musicKey = key;
      this.music = new Audio(path);
      this.music.loop = config.loop ?? true;
      this.music.volume = this.settings.music * this.settings.master * (this.settings.mute ? 0 : 1);

      const playPromise = this.music.play();
      if (playPromise) {
        playPromise.catch(() => {
          this.pendingMusic = { key, config };
        });
      }
    } catch {
      this.pendingMusic = { key, config };
    }
  }

  resumePendingMusic() {
    if (this.pendingMusic) {
      const { key, config } = this.pendingMusic;
      this.pendingMusic = null;
      this.playMusic(key, config);
    } else if (this.music?.paused) {
      this.music.play().catch(() => {
        if (this.musicKey) {
          this.pendingMusic = { key: this.musicKey, config: { loop: this.music.loop } };
        }
      });
    }
  }

  stopMusic() {
    if (this.music) {
      this.music.pause();
      this.music.currentTime = 0;
      this.music = null;
      this.musicKey = null;
    }
  }

  playSFX(key, config = {}) {
    try {
      this.registerUnlockHandler();
      if (this.settings.mute) return;

      const path = AUDIO_PATHS[key];
      if (!path || typeof Audio === 'undefined') return;

      this.unlockAudio();
      const sfx = new Audio(path);
      sfx.volume = (config.volume ?? 1) * this.settings.sfx * this.settings.master;
      sfx.play().catch(() => {});
    } catch {
      // Ignore audio failures so gameplay remains responsive.
    }
  }
}

let instance = null;
export function getAudioManager(game) {
  if (!instance) instance = new AudioManager(game);
  return instance;
}
