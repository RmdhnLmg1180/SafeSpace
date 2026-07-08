import Phaser from 'phaser';
import { AUDIO_ASSETS } from '../utils/AudioAssets';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    const { width, height } = this.scale;
    const panelWidth = Math.min(width * 0.72, 460);
    const barWidth = panelWidth * 0.82;
    const barHeight = 14;
    const centerX = width / 2;
    const centerY = height / 2;
    const textResolution = Math.min(window.devicePixelRatio || 1, 2);

    this.add.rectangle(centerX, centerY, panelWidth, 150, 0x102040, 0.88).setStrokeStyle(2, 0x4fc3f7, 0.78);
    this.add.rectangle(centerX, centerY + 24, barWidth, barHeight, 0x071326, 0.95).setStrokeStyle(1, 0x8be9ff, 0.6);

    const fill = this.add.rectangle(centerX - barWidth / 2, centerY + 24, 0, barHeight, 0x4fc3f7, 0.92).setOrigin(0, 0.5);
    const title = this.add
      .text(centerX, centerY - 36, 'SAFE-SPACE', {
        fontSize: width < 768 ? '24px' : '30px',
        color: '#e7f8ff',
        fontStyle: 'bold',
        resolution: textResolution,
      })
      .setOrigin(0.5);
    if (typeof title.setResolution === 'function') title.setResolution(textResolution);

    const status = this.add
      .text(centerX, centerY + 58, 'Memuat ruang aman...', {
        fontSize: width < 768 ? '13px' : '15px',
        color: '#a9c7d8',
        resolution: textResolution,
      })
      .setOrigin(0.5);
    if (typeof status.setResolution === 'function') status.setResolution(textResolution);

    this.load.on('progress', (value) => {
      fill.width = barWidth * value;
      status.setText(`Memuat aset ${Math.round(value * 100)}%`);
    });

    this.load.on('complete', () => {
      this.scene.start('LandingScene');
    });

    this.load.image('landingBg', '/assets/backgrounds/landing-bg.png');
    this.load.image('logo', '/assets/ui/logo.png');
    this.load.image('ray', '/assets/characters/ray/neutral.png');
    this.load.image('ray-neutral', '/assets/characters/ray/neutral.png');
    this.load.image('ray-sad', '/assets/characters/ray/sad.png');
    this.load.image('ray-panic', '/assets/characters/ray/panic.png');
    this.load.image('ray-relief', '/assets/characters/ray/relief.png');

    for (let i = 1; i <= 7; i++) {
      this.load.image(`day${i}`, `/assets/backgrounds/day${i}.png`);
    }

    [1, 2, 4, 7].forEach((day) => {
      this.load.image(`body-day${day}`, `/assets/backgrounds/body-day${day}.png`);
    });

    [...AUDIO_ASSETS.music, ...AUDIO_ASSETS.sfx].forEach((asset) => {
      this.load.audio(asset.key, asset.path);
    });
  }
}
