// src/scenes/ReflectionScene.js
import Phaser from 'phaser';
import { getCounselorReflection } from '../utils/ReflectionAI';
import { getAudioManager } from '../utils/AudioManager';

export default class ReflectionScene extends Phaser.Scene {
  constructor() {
    super('ReflectionScene');
  }

  init(data = {}) {
    this.dataForReflection = data;
  }

  preload() {
    this.load.image('landingBg', '/assets/backgrounds/landing-bg.png');
    this.load.image('ray-relief', '/assets/characters/ray/relief.png');
  }

  async create() {
    const { width, height } = this.scale;
    const isMobile = width < 768;
    const audio = getAudioManager(this.game);
    audio.playMusic('music-reflection-theme');

    this.createBackground(width, height, isMobile);

    this.add
      .text(width / 2, height * 0.12, 'REFLEKSI KONSELOR', {
        fontSize: isMobile ? '26px' : '42px',
        color: '#4FC3F7',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const ray = this.add.image(isMobile ? width * 0.5 : width * 0.17, isMobile ? height * 0.28 : height * 0.56, 'ray-relief');
    ray.setScale(isMobile ? 0.1 : 0.16);

    const panelX = isMobile ? width / 2 : width * 0.62;
    const panelY = isMobile ? height * 0.58 : height * 0.5;
    const panelWidth = isMobile ? width * 0.86 : width * 0.58;
    const panelHeight = isMobile ? height * 0.5 : height * 0.56;

    this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x102040, 0.9).setStrokeStyle(2, 0x4fc3f7);

    const loadingText = this.add
      .text(panelX, panelY, 'Menganalisis keputusanmu...', {
        fontSize: isMobile ? '16px' : '22px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5);

    let reflection = 'Kamu sudah melewati situasi yang berat. Ambil jeda, kenali emosimu, dan cari dukungan dari orang yang kamu percaya.';

    try {
      reflection = await getCounselorReflection(this.dataForReflection);
    } catch {
      reflection = 'Refleksi otomatis belum tersedia, tapi pilihanmu tetap penting. Perhatikan tanda bahaya, jaga batas aman, dan minta bantuan saat tekanan terasa terlalu besar.';
    }

    loadingText.destroy();

    this.add
      .text(panelX, panelY - panelHeight * 0.08, reflection, {
        fontSize: isMobile ? '15px' : '21px',
        color: '#ffffff',
        align: 'left',
        lineSpacing: 8,
        wordWrap: { width: panelWidth * 0.82 },
      })
      .setOrigin(0.5);

    this.createButton(isMobile ? width / 2 : 120, isMobile ? height * 0.92 : height * 0.9, isMobile ? width * 0.46 : 160, 52, 'BACK', () => {
      audio.playSFX('sfx-back');
      this.scene.start('MenuScene');
    });
  }

  createBackground(width, height, isMobile) {
    const bg = this.add.image(width / 2, height / 2, 'landingBg');
    bg.setScale(Math.max(width / bg.width, height / bg.height));
    if (isMobile) bg.setX(width * 0.62);
    this.add.rectangle(width / 2, height / 2, width, height, 0x081426, 0.72);
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
