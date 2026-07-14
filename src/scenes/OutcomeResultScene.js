// src/scenes/OutcomeResultScene.js
import Phaser from 'phaser';
import { getAudioManager } from '../utils/AudioManager';
import { bindResponsiveScene, cleanChoiceLabel, createFittedText, createNeonButton, getResponsiveFontSize, safeLoadImage } from '../utils/UIHelpers';

export default class OutcomeResultScene extends Phaser.Scene {
  constructor() {
    super('OutcomeResultScene');
  }

  init(data = {}) {
    this.ending = data.ending || 'Reflection';
    this.chapter = data.chapter || 1;
    this.choices = data.choices || [];
    this.mentalShield = data.mentalShield ?? 0;
    this.anxiety = data.anxiety ?? 0;
  }

  preload() {
    safeLoadImage(this, 'landingBg', '/assets/backgrounds/landing-bg.png');
    safeLoadImage(this, 'ray-relief', '/assets/characters/ray/relief.png');
    safeLoadImage(this, 'ray-sad', '/assets/characters/ray/sad.png');
  }

  create() {
    const { width, height } = this.scale;
    const isMobile = width < 768;
    const audio = getAudioManager(this.game);
    bindResponsiveScene(this, () => this.getSceneState());
    audio.playSFX('sfx-success');

    this.createBackground(width, height, isMobile);

    const isGood = this.ending === 'Good';
    const titleColor = isGood ? '#81c784' : this.ending === 'Bad' ? '#ff8a80' : '#4FC3F7';
    const panelStrokeColor = isGood ? 0x81c784 : this.ending === 'Bad' ? 0xff8a80 : 0x4fc3f7;
    const ray = this.add.image(isMobile ? width / 2 : width * 0.18, isMobile ? height * 0.72 : height * 0.58, isGood ? 'ray-relief' : 'ray-sad');
    ray.setScale(isMobile ? 0.09 : 0.15);

    this.add
      .text(width / 2, height * 0.12, `${this.ending.toUpperCase()} ENDING`, {
        fontSize: isMobile ? '28px' : '44px',
        color: titleColor,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const panelX = isMobile ? width / 2 : width * 0.62;
    const panelY = isMobile ? height * 0.46 : height * 0.5;
    const panelWidth = isMobile ? width * 0.86 : width * 0.58;
    const panelHeight = isMobile ? height * 0.48 : height * 0.56;

    this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x102040, 0.9).setStrokeStyle(2, panelStrokeColor);

    this.add
      .text(panelX, panelY - panelHeight * 0.32, `Chapter ${this.chapter} selesai`, {
        fontSize: isMobile ? '18px' : '24px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(panelX, panelY - panelHeight * 0.2, `Mental Shield ${this.mentalShield} | Anxiety ${this.anxiety}`, {
        fontSize: isMobile ? '14px' : '20px',
        color: '#d9e9f2',
      })
      .setOrigin(0.5);

    const choiceText = this.choices.length ? this.choices.slice(-5).map((choice) => `- ${cleanChoiceLabel(choice)}`).join('\n') : '- Belum ada pilihan tersimpan';
    createFittedText(
      this,
      panelX - panelWidth * 0.4,
      panelY - panelHeight * 0.05,
      `Pilihan terakhir:\n${choiceText}`,
      {
        fontSize: isMobile ? '12px' : '16px',
        color: '#ffffff',
        lineSpacing: 6,
      },
      { origin: [0, 0], maxWidth: panelWidth * 0.8, maxHeight: panelHeight * 0.3, minFontSize: 9 },
    );

    this.createButton(panelX - panelWidth * 0.24, panelY + panelHeight * 0.34, panelWidth * 0.28, 52, 'REFLECT', () => {
      audio.playSFX('sfx-click');
      this.scene.start('ReflectionScene', {
        chapter: this.chapter,
        choices: this.choices,
        mentalShield: this.mentalShield,
        anxiety: this.anxiety,
      });
    });

    this.createButton(panelX + panelWidth * 0.06, panelY + panelHeight * 0.34, panelWidth * 0.24, 52, 'REPLAY', () => {
      audio.playSFX('sfx-click');
      this.scene.start('ChapterSelectionScene');
    });

    this.createButton(panelX + panelWidth * 0.34, panelY + panelHeight * 0.34, panelWidth * 0.22, 52, 'MENU', () => {
      audio.playSFX('sfx-back');
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
    return createNeonButton(this, x, y, w, h, label, callback, {
      fontSize: getResponsiveFontSize(this.scale.width, w < 110 ? 14 : 18, { min: 10 }),
    });
  }

  getSceneState() {
    return {
      ending: this.ending,
      chapter: this.chapter,
      choices: this.choices,
      mentalShield: this.mentalShield,
      anxiety: this.anxiety,
    };
  }
}
