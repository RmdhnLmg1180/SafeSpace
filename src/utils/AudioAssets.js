export const AUDIO_ASSETS = {
  music: [
    { key: 'music-main-theme', path: '/assets/audio/music/main-theme.mp3' },
    { key: 'music-story-theme', path: '/assets/audio/music/story-theme.mp3' },
    { key: 'music-reflection-theme', path: '/assets/audio/music/reflection-theme.mp3' },
  ],
  sfx: [
    { key: 'sfx-click', path: '/assets/audio/sfx/click.mp3' },
    { key: 'sfx-choice', path: '/assets/audio/sfx/choice.mp3' },
    { key: 'sfx-back', path: '/assets/audio/sfx/back.mp3' },
    { key: 'sfx-success', path: '/assets/audio/sfx/success.mp3' },
  ],
};

export function preloadAudioAssets(scene) {
  [...AUDIO_ASSETS.music, ...AUDIO_ASSETS.sfx].forEach((asset) => {
    if (!scene.cache.audio.exists(asset.key)) {
      scene.load.audio(asset.key, asset.path);
    }
  });
}
