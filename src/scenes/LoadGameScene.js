// src/scenes/LoadGameScene.js
import Phaser from 'phaser';
import { SaveManager } from '../utils/SaveManager';
import { getAudioManager } from '../utils/AudioManager';
import { createFittedText, createNeonButton, getResponsiveFontSize } from '../utils/UIHelpers';

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
    const slots = saves.linear ? ['linear', 1, 2, 3] : [1, 2, 3];
    const cardWidth = isMobile ? width * 0.86 : width * 0.62;
    const cardHeight = isMobile ? (saves.linear ? 88 : 112) : saves.linear ? 104 : 122;
    const startY = isMobile ? (saves.linear ? height * 0.24 : height * 0.28) : height * 0.3;
    const gap = isMobile ? 12 : 20;

    slots.forEach((slot, index) => {
      const data = saves[slot];
      const y = startY + index * (cardHeight + gap);
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

    createFittedText(
      this,
      x - w * 0.43,
      y - h * 0.32,
      slot === 'linear' ? 'ALUR 1-3' : `SLOT ${slot}`,
      {
        fontSize: isMobile ? '17px' : '22px',
        color: '#ffffff',
        fontStyle: 'bold',
      },
      { origin: [0, 0.5], maxWidth: w * 0.5, maxHeight: 28, minFontSize: 11 },
    );

    const detail = data
      ? `Chapter ${data.currentChapter || 1} | Day ${data.currentDay || 1} | Shield ${data.mentalShield ?? 0} | Anxiety ${data.mentalState ?? 0}\n${new Date(data.timestamp).toLocaleString()}`
      : 'Kosong';

    createFittedText(
      this,
      x - w * 0.43,
      y - h * 0.02,
      detail,
      {
        fontSize: isMobile ? '12px' : '16px',
        color: data ? '#d9e9f2' : '#8fa6b8',
        lineSpacing: isMobile ? 3 : 6,
      },
      { origin: [0, 0.5], maxWidth: w * 0.54, maxHeight: h * 0.48, minFontSize: 9 },
    );

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
    return createNeonButton(this, x, y, w, h, label, callback, {
      strokeColor,
      fontSize: getResponsiveFontSize(this.scale.width, w < 120 ? 15 : 20, { min: 10 }),
    });
  }

  getSceneForChapter(chapter) {
    if (chapter === 2) return 'BodyShamingScene';
    if (chapter === 3) return 'CyberGroomingScene';
    return 'GameScene';
  }
}
