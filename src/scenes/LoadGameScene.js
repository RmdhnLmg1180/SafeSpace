// src/scenes/LoadGameScene.js
import Phaser from 'phaser';
import { SaveManager } from '../utils/SaveManager';
import { getAudioManager } from '../utils/AudioManager';

export default class LoadGameScene extends Phaser.Scene {
  constructor() {
    super('LoadGameScene');
  }

  preload() {
    this.load.image('landingBg', '/assets/backgrounds/landing-bg.png');
  }

  create() {
    const { width, height } = this.scale;
    const isMobile = width < 768;
    const audio = getAudioManager(this.game);

    this.createBackground(width, height, isMobile);

    this.add
      .text(width / 2, height * 0.12, 'LOAD GAME', {
        fontSize: isMobile ? '30px' : '46px',
        color: '#4FC3F7',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const saves = SaveManager.getAllSaves();
    const slots = [1, 2, 3];
    const cardWidth = isMobile ? width * 0.86 : width * 0.62;
    const cardHeight = isMobile ? 112 : 122;
    const startY = isMobile ? height * 0.28 : height * 0.3;

    slots.forEach((slot, index) => {
      const data = saves[slot];
      const y = startY + index * (cardHeight + 20);
      this.createSlotCard(width / 2, y, cardWidth, cardHeight, slot, data, audio, isMobile);
    });

    this.createButton(isMobile ? width / 2 : 120, isMobile ? height * 0.92 : height * 0.9, isMobile ? width * 0.46 : 160, 52, 'BACK', () => {
      audio.playSFX('sfx-back');
      this.scene.start('MenuScene');
    });
  }

  createBackground(width, height, isMobile) {
    const bg = this.add.image(width / 2, height / 2, 'landingBg');
    bg.setScale(Math.max(width / bg.width, height / bg.height));
    if (isMobile) bg.setX(width * 0.62);
    this.add.rectangle(width / 2, height / 2, width, height, 0x081426, 0.76);
  }

  createSlotCard(x, y, w, h, slot, data, audio, isMobile) {
    this.add.rectangle(x, y, w, h, 0x102040, 0.9).setStrokeStyle(2, data ? 0x4fc3f7 : 0x446176);

    this.add.text(x - w * 0.43, y - h * 0.32, `SLOT ${slot}`, {
      fontSize: isMobile ? '18px' : '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    });

    const detail = data
      ? `Chapter ${data.currentChapter || 1} | Day ${data.currentDay || 1} | Shield ${data.mentalShield ?? 0} | Anxiety ${data.mentalState ?? 0}\n${new Date(data.timestamp).toLocaleString()}`
      : 'Kosong';

    this.add.text(x - w * 0.43, y - h * 0.02, detail, {
      fontSize: isMobile ? '12px' : '16px',
      color: data ? '#d9e9f2' : '#8fa6b8',
      lineSpacing: 6,
      wordWrap: { width: w * 0.54 },
    });

    if (!data) return;

    this.createButton(x + w * 0.28, y - 24, isMobile ? 92 : 110, 42, 'LOAD', () => {
      audio.playSFX('sfx-click');
      this.scene.start(this.getSceneForChapter(data.currentChapter), { ...data, slot });
    });

    this.createButton(x + w * 0.28, y + 28, isMobile ? 92 : 110, 42, 'DELETE', () => {
      audio.playSFX('sfx-back');
      SaveManager.deleteSave(slot);
      this.scene.restart();
    }, 0xff5252);
  }

  createButton(x, y, w, h, label, callback, strokeColor = 0x4fc3f7) {
    const glow = this.add.rectangle(x, y, w + 12, h + 12, strokeColor, 0.08);
    const btn = this.add.rectangle(x, y, w, h, 0x102040, 0.82).setStrokeStyle(2, strokeColor).setInteractive({ useHandCursor: true });
    this.add.rectangle(x, y - h * 0.22, w * 0.88, h * 0.22, 0xffffff, 0.05);
    this.add
      .text(x, y, label, {
        fontSize: w < 120 ? '15px' : '20px',
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

  getSceneForChapter(chapter) {
    if (chapter === 2) return 'BodyShamingScene';
    if (chapter === 3) return 'CyberGroomingScene';
    return 'GameScene';
  }
}
