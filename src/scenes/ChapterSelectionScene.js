import Phaser from 'phaser';
import { getAudioManager } from '../utils/AudioManager';
import { SaveManager, getReflectionId } from '../utils/SaveManager';
import { createFittedText, createGlassPanel, createNeonButton, createResponsiveBackground, getResponsiveFont, getResponsiveFontSize } from '../utils/UIHelpers';

export default class ChapterSelectionScene extends Phaser.Scene {
  constructor() {
    super('ChapterSelectionScene');
  }

  preload() {
    this.load.image('landingBg', '/assets/backgrounds/landing-bg.png');
  }

  create() {
    const { width, height } = this.scale;
    const isMobile = width < 768;
    const audio = getAudioManager(this.game);

    createResponsiveBackground(this, 'landingBg', { mobileFocalX: 0.62, overlayAlpha: 0.72 });

    createFittedText(
      this,
      width / 2,
      height * 0.12,
      'CHOOSE YOUR STORY',
      {
        fontSize: getResponsiveFont(width, 46, { min: 24 }),
        color: '#4FC3F7',
        fontStyle: 'bold',
      },
      { maxWidth: width * 0.86, maxHeight: 56, minFontSize: 22 },
    );

    createFittedText(
      this,
      width / 2,
      height * 0.2,
      'Pilih alur lengkap atau langsung masuk ke cerita yang ingin kamu mainkan.',
      {
        fontSize: getResponsiveFont(width, 18, { min: 13 }),
        color: '#d9e9f2',
        align: 'center',
      },
      { maxWidth: isMobile ? width * 0.82 : width * 0.62, maxHeight: 46, minFontSize: 12 },
    );

    createNeonButton(
      this,
      width / 2,
      isMobile ? height * 0.29 : height * 0.31,
      isMobile ? width * 0.82 : 420,
      isMobile ? 58 : 64,
      'IKUTI ALUR CERITA 1-3',
      () => {
        audio.playSFX('sfx-click');
        this.startLinearFlow();
      },
      { fontSize: getResponsiveFontSize(width, 22, { min: 14 }) },
    );

    const scenarios = [
      {
        title: 'Cyberbullying',
        subtitle: 'Opini Berujung Petaka',
        color: 0x4fc3f7,
      },
      {
        title: 'Body Shaming',
        subtitle: 'Cermin yang Menyakitkan',
        color: 0x81c784,
      },
      {
        title: 'Cyber Grooming',
        subtitle: 'Jebakan di Balik Layar',
        color: 0xffb74d,
      },
    ];

    scenarios.forEach((scenario, index) => {
      const x = isMobile ? width / 2 : width * (0.22 + index * 0.28);
      const y = isMobile ? height * (0.43 + index * 0.16) : height * 0.6;
      const cardWidth = isMobile ? width * 0.8 : width * 0.24;
      const cardHeight = isMobile ? 105 : 205;
      const { panel: card } = createGlassPanel(this, x, y, cardWidth, cardHeight, {
        fillColor: scenario.color,
        fillAlpha: 0.13,
        strokeColor: scenario.color,
        highlightAlpha: 0.035,
      });
      card.setInteractive({ useHandCursor: true });

      createFittedText(
        this,
        x,
        y - (isMobile ? 18 : 30),
        scenario.title,
        {
          fontSize: getResponsiveFont(width, 26, { min: 18 }),
          color: '#ffffff',
          fontStyle: 'bold',
          align: 'center',
        },
        { maxWidth: cardWidth * 0.8, maxHeight: isMobile ? 30 : 42, minFontSize: 14 },
      );

      createFittedText(
        this,
        x,
        y + (isMobile ? 16 : 18),
        scenario.subtitle,
        {
          fontSize: getResponsiveFont(width, 18, { min: 13 }),
          color: '#d9d9d9',
          align: 'center',
        },
        { maxWidth: cardWidth * 0.8, maxHeight: isMobile ? 34 : 54, minFontSize: 11 },
      );

      card.on('pointerover', () => {
        card.setFillStyle(scenario.color, 0.22);
      });
      card.on('pointerout', () => {
        card.setFillStyle(scenario.color, 0.13);
      });
      card.on('pointerdown', () => {
        audio.playSFX('sfx-click');
        if (index === 0) this.startSingleStory(1, 'GameScene');
        if (index === 1) this.startSingleStory(2, 'BodyShamingScene');
        if (index === 2) this.startSingleStory(3, 'CyberGroomingScene');
      });
    });

    createNeonButton(this, isMobile ? width / 2 : 120, isMobile ? height * 0.92 : height * 0.9, isMobile ? width * 0.46 : 160, 52, 'BACK', () => {
      audio.playSFX('sfx-back');
      this.scene.start('MenuScene');
    });
  }

  startSingleStory(chapter, sceneKey) {
    const reflection = SaveManager.loadReflection(getReflectionId({ chapter }));
    if (reflection) {
      this.scene.start('ReflectionScene', { ...reflection, fromSaved: true });
      return;
    }

    this.scene.start(sceneKey, { chapter, storyMode: 'single' });
  }

  startLinearFlow() {
    const reflection = SaveManager.loadReflection(getReflectionId({ storyMode: 'linear' }));
    if (reflection) {
      this.scene.start('ReflectionScene', { ...reflection, fromSaved: true });
      return;
    }

    this.scene.start('GameScene', { chapter: 1, storyMode: 'linear', slot: 'linear' });
  }
}
