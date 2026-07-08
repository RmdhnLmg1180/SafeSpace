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
    this.musicCache = {};
    this.sfxPools = {};
    this.sfxCursor = {};
    this.pendingMusic = null;
    this.unlockHandlerRegistered = false;
    this.audioUnlocked = false;
    this.userGestureSeen = false;
    this.poolSize = 5;
    this.prefetchAudio();
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
      const settings = { ...defaults, ...JSON.parse(localStorage.getItem('safe_space_audio') || '{}') };
      return {
        master: this.clampVolume(settings.master),
        music: this.clampVolume(settings.music),
        sfx: this.clampVolume(settings.sfx),
        mute: !!settings.mute,
      };
    } catch {
      localStorage.removeItem('safe_space_audio');
      return defaults;
    }
  }

  clampVolume(value) {
    return Math.max(0, Math.min(1, Number.isFinite(Number(value)) ? Number(value) : 1));
  }

  saveSettings() {
    localStorage.setItem('safe_space_audio', JSON.stringify(this.settings));
  }

  setMasterVolume(val) {
    this.settings.master = this.clampVolume(val);
    this.updateVolumes();
    this.saveSettings();
  }

  setMusicVolume(val) {
    this.settings.music = this.clampVolume(val);
    this.updateVolumes();
    this.saveSettings();
  }

  setSFXVolume(val) {
    this.settings.sfx = this.clampVolume(val);
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

  createAudio(path) {
    if (!path || typeof Audio === 'undefined') return null;
    const audio = new Audio(path);
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    audio.load();
    return audio;
  }

  prefetchAudio() {
    if (typeof Audio === 'undefined') return;

    AUDIO_ASSETS.sfx.forEach((asset) => {
      if (!this.sfxPools[asset.key]) {
        this.sfxPools[asset.key] = Array.from({ length: this.poolSize }, () => this.createAudio(asset.path)).filter(Boolean);
        this.sfxCursor[asset.key] = 0;
      }
    });

    AUDIO_ASSETS.music.forEach((asset) => {
      if (!this.musicCache[asset.key]) {
        const audio = this.createAudio(asset.path);
        if (audio) this.musicCache[asset.key] = audio;
      }
    });
  }

  registerUnlockHandler() {
    if (this.unlockHandlerRegistered) return;
    this.unlockHandlerRegistered = true;

    if (typeof document === 'undefined') return;

    const unlock = () => {
      this.userGestureSeen = true;
      this.unlockAudio();
      this.resumePendingMusic();
    };

    document.addEventListener('pointerdown', unlock, { passive: true });
    document.addEventListener('keydown', unlock);
  }

  unlockAudio() {
    try {
      const context = this.game.sound?.context;
      if (context?.state === 'suspended') {
        context.resume();
      }

      if (this.userGestureSeen && !this.audioUnlocked) {
        this.primeSfxPools();
        this.audioUnlocked = true;
      }
    } catch {
      // Browser audio unlock is best-effort; the game UI should never depend on it.
    }
  }

  primeSfxPools() {
    Object.values(this.sfxPools).forEach((pool) => {
      pool.forEach((audio) => {
        try {
          audio.muted = true;
          audio.currentTime = 0;
          const playPromise = audio.play();
          if (playPromise) {
            playPromise
              .then(() => {
                audio.pause();
                audio.currentTime = 0;
                audio.muted = false;
              })
              .catch(() => {
                audio.muted = false;
              });
          } else {
            audio.pause();
            audio.currentTime = 0;
            audio.muted = false;
          }
        } catch {
          audio.muted = false;
        }
      });
    });
  }

  getMusicAudio(key) {
    this.prefetchAudio();
    const path = AUDIO_PATHS[key];
    if (!path || typeof Audio === 'undefined') return null;

    if (!this.musicCache[key]) {
      const audio = this.createAudio(path);
      if (audio) this.musicCache[key] = audio;
    }

    return this.musicCache[key];
  }

  playMusic(key, config = {}) {
    try {
      this.registerUnlockHandler();
      const nextMusic = this.getMusicAudio(key);
      if (!nextMusic) return;

      if (this.musicKey === key && this.music && !this.music.paused) {
        this.updateVolumes();
        return;
      }

      if (this.music && this.music !== nextMusic) {
        this.music.pause();
        this.music.currentTime = 0;
      }

      this.unlockAudio();
      this.musicKey = key;
      this.music = nextMusic;
      this.music.loop = config.loop ?? true;
      this.music.volume = this.settings.music * this.settings.master * (this.settings.mute ? 0 : 1);
      this.music.currentTime = 0;

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

      this.prefetchAudio();
      const pool = this.sfxPools[key];
      if (!pool?.length) return;

      this.unlockAudio();
      const cursor = this.sfxCursor[key] ?? 0;
      const sfx = pool.find((audio) => audio.paused || audio.ended) || pool[cursor % pool.length];
      this.sfxCursor[key] = (cursor + 1) % pool.length;

      sfx.pause();
      sfx.currentTime = 0;
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
