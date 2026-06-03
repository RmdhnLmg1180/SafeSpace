// src/scenes/TutorialScene.js
import Phaser from 'phaser';
import { getAudioManager } from '../utils/AudioManager';

export default class TutorialScene extends Phaser.Scene {
  constructor() {
    super('TutorialScene');
  }

  preload() {
    this.load.image('landingBg', '/assets/backgrounds/landing-bg.png');
    this.load.image('ray-neutral', '/assets/characters/ray/neutral.png');
  }

  create() {
    const { width, height } = this.scale;
    const isMobile = width < 768;

    this.createBackground(width, height, isMobile);

    this.add
      .text(width / 2, height * 0.12, 'TUTORIAL', {
        fontSize: isMobile ? '30px' : '46px',
        color: '#4FC3F7',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const ray = this.add.image(isMobile ? width / 2 : width * 0.18, isMobile ? height * 0.74 : height * 0.6, 'ray-neutral');
    ray.setScale(isMobile ? 0.09 : 0.15);

    this.tweens.add({
      targets: ray,
      y: ray.y - 8,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const panelX = isMobile ? width / 2 : width * 0.62;
    const panelY = isMobile ? height * 0.48 : height * 0.5;
    const panelWidth = isMobile ? width * 0.86 : width * 0.58;
    const panelHeight = isMobile ? height * 0.52 : height * 0.58;

    this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x102040, 0.9).setStrokeStyle(2, 0x4fc3f7);

    const items = [
      ['Mental Shield', 'Pelindung mental. Makin tinggi nilainya, makin kuat Ray menghadapi tekanan.'],
      ['Anxiety', 'Tekanan batin. Saat pilihan kurang sehat diambil, kondisi Ray bisa makin rentan.'],
      ['Pilihan Aksi', 'Setiap hari punya pilihan yang memengaruhi status dan ending cerita.'],
      ['Alur Cerita', 'Kamu bisa mengikuti cerita 1-3 secara berurutan atau memilih chapter sendiri.'],
      ['Save / Load', 'Progress tersimpan otomatis setelah pilihan penting dan bisa dilanjutkan dari menu.'],
    ];

    const startY = panelY - panelHeight * 0.34;
    items.forEach((item, index) => {
      const y = startY + index * (isMobile ? 58 : 70);
      this.add.circle(panelX - panelWidth * 0.38, y + 6, 7, 0x4fc3f7, 1);
      this.add.text(panelX - panelWidth * 0.34, y - 8, item[0], {
        fontSize: isMobile ? '15px' : '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      });
      this.add.text(panelX - panelWidth * 0.34, y + 16, item[1], {
        fontSize: isMobile ? '12px' : '16px',
        color: '#d9e9f2',
        wordWrap: { width: panelWidth * 0.68 },
      });
    });

    this.createButton(isMobile ? width / 2 : 120, isMobile ? height * 0.92 : height * 0.9, isMobile ? width * 0.46 : 160, 52, 'BACK', () => {
      getAudioManager(this.game).playSFX('sfx-back');
      this.scene.start('MenuScene');
    });
  }

  createBackground(width, height, isMobile) {
    const bg = this.add.image(width / 2, height / 2, 'landingBg');
    bg.setScale(Math.max(width / bg.width, height / bg.height));
    if (isMobile) bg.setX(width * 0.62);
    this.add.rectangle(width / 2, height / 2, width, height, 0x081426, 0.74);
  }

  createButton(x, y, w, h, label, callback) {
    const glow = this.add.rectangle(x, y, w + 14, h + 14, 0x4fc3f7, 0.08);
    const btn = this.add.rectangle(x, y, w, h, 0x102040, 0.82).setStrokeStyle(2, 0x4fc3f7).setInteractive({ useHandCursor: true });
    this.add.rectangle(x, y - h * 0.22, w * 0.88, h * 0.22, 0xffffff, 0.05);
    this.add
      .text(x, y, label, {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    btn.on('pointerover', () => {
      btn.setFillStyle(0x16325f);
      glow.setAlpha(0.22);
    });
    btn.on('pointerout', () => {
      btn.setFillStyle(0x102040);
      glow.setAlpha(0.08);
    });
    btn.on('pointerdown', callback);
  }
}

export function showTutorialPopup(scene) {
  scene.scene.start('TutorialScene');
}
