// src/scenes/ReflectionScene.js
import Phaser from 'phaser';
import { getCounselorReflection } from '../utils/ReflectionAI';
import { getAudioManager } from '../utils/AudioManager';
import { SaveManager, getReflectionId } from '../utils/SaveManager';
import {
  cleanChoiceList,
  createFittedText,
  createGlassPanel,
  createNeonButton,
  createResponsiveBackground,
  createScrollableTextBox,
  getResponsiveFont,
  getResponsiveFontSize,
  safeLoadImage,
} from '../utils/UIHelpers';

export default class ReflectionScene extends Phaser.Scene {
  constructor() {
    super('ReflectionScene');
  }

  init(data = {}) {
    this.dataForReflection = this.cleanReflectionData(data);
    this.reflectionId = data.reflectionId || getReflectionId(data);
    const savedRecord = SaveManager.loadReflection(this.reflectionId);
    this.reflectionRecord = data.reflection ? this.cleanReflectionData(data) : savedRecord ? this.cleanReflectionData(savedRecord) : null;
  }

  preload() {
    safeLoadImage(this, 'landingBg', '/assets/backgrounds/landing-bg.png');
    safeLoadImage(this, 'ray-relief', '/assets/characters/ray/relief.png');
  }

  async create() {
    const { width, height } = this.scale;
    const isMobile = width < 768;
    const audio = getAudioManager(this.game);
    audio.playMusic('music-reflection-theme');

    createResponsiveBackground(this, 'landingBg', { mobileFocalX: 0.62, overlayAlpha: 0.72 });

    createFittedText(
      this,
      width / 2,
      isMobile ? height * 0.085 : height * 0.11,
      this.dataForReflection.fromSaved ? 'REFLEKSI TERSIMPAN' : 'REFLEKSI KONSELOR',
      {
        fontSize: getResponsiveFont(width, 42, { min: 24 }),
        color: '#4FC3F7',
        fontStyle: 'bold',
        align: 'center',
      },
      { maxWidth: width * 0.88, maxHeight: 54, minFontSize: 20 },
    );

    const ray = this.add.image(isMobile ? width * 0.5 : width * 0.17, isMobile ? height * 0.23 : height * 0.56, 'ray-relief');
    const rayTargetHeight = isMobile ? Math.min(height * 0.15, 120) : Math.min(height * 0.42, 280);
    ray.setScale(rayTargetHeight / ray.height);

    const panelX = isMobile ? width / 2 : width * 0.62;
    const panelY = isMobile ? height * 0.6 : height * 0.5;
    const panelWidth = isMobile ? width * 0.88 : width * 0.58;
    const panelHeight = isMobile ? height * 0.5 : height * 0.56;

    createGlassPanel(this, panelX, panelY, panelWidth, panelHeight, { fillAlpha: 0.9, strokeColor: 0x4fc3f7 });

    const loadingText = createFittedText(
      this,
      panelX,
      panelY,
      'Menganalisis keputusanmu...',
      {
        fontSize: isMobile ? '15px' : '22px',
        color: '#ffffff',
        align: 'center',
      },
      { maxWidth: panelWidth * 0.78, maxHeight: 38, minFontSize: 11 },
    );

    let reflection = this.reflectionRecord?.reflection;

    if (!reflection) {
      try {
        reflection = await getCounselorReflection(this.dataForReflection);
      } catch {
        reflection = 'Refleksi otomatis belum tersedia, tapi pilihanmu tetap penting. Perhatikan tanda bahaya, jaga batas aman, dan minta bantuan saat tekanan terasa terlalu besar.';
      }

      this.reflectionRecord = this.persistReflection(reflection);
    }

    loadingText.destroy();

    createFittedText(
      this,
      panelX,
      panelY - panelHeight * 0.38,
      this.getReflectionScopeLabel(),
      {
        fontSize: getResponsiveFont(width, 20, { min: 13 }),
        color: '#8be9ff',
        fontStyle: 'bold',
        align: 'center',
      },
      { maxWidth: panelWidth * 0.82, maxHeight: 34, minFontSize: 12 },
    );

    createScrollableTextBox(
      this,
      panelX,
      panelY + panelHeight * 0.04,
      panelWidth * 0.88,
      panelHeight * 0.72,
      reflection,
      {
        fontSize: isMobile ? '13px' : getResponsiveFont(width, 20, { min: 14 }),
        color: '#ffffff',
        align: 'left',
        lineSpacing: isMobile ? 5 : 8,
      },
      { padding: isMobile ? 14 : 20 },
    );

    if (this.reflectionRecord?.expiresAt) {
      createFittedText(
        this,
        panelX,
        panelY + panelHeight * 0.42,
        `Tersimpan sampai ${new Date(this.reflectionRecord.expiresAt).toLocaleDateString('id-ID')}`,
        {
          fontSize: getResponsiveFont(width, 14, { min: 10 }),
          color: '#a9c7d8',
          align: 'center',
        },
        { maxWidth: panelWidth * 0.82, maxHeight: 22, minFontSize: 9 },
      );
    }

    const buttonY = isMobile ? height * 0.92 : height * 0.9;
    const replayX = isMobile ? width * 0.28 : width * 0.18;
    const menuX = isMobile ? width * 0.72 : width * 0.36;
    createNeonButton(this, replayX, buttonY, isMobile ? width * 0.4 : 180, 52, 'MAIN ULANG', () => {
      audio.playSFX('sfx-click');
      this.replayStory();
    }, { fontSize: getResponsiveFontSize(width, 18, { min: 12 }), strokeColor: 0xffb74d });

    createNeonButton(this, menuX, buttonY, isMobile ? width * 0.4 : 180, 52, 'KEMBALI MENU', () => {
      audio.playSFX('sfx-back');
      if (!this.reflectionRecord) this.reflectionRecord = this.persistReflection(reflection);
      this.scene.start('MenuScene');
    }, { fontSize: getResponsiveFontSize(width, 18, { min: 11 }) });
  }

  persistReflection(reflection) {
    return SaveManager.saveReflection(this.reflectionId, {
      ...this.dataForReflection,
      reflectionId: this.reflectionId,
      reflection,
    });
  }

  cleanReflectionData(data = {}) {
    const storyResults = Object.fromEntries(
      Object.entries(data.storyResults || {}).map(([key, value]) => [
        key,
        {
          ...value,
          choices: cleanChoiceList(value?.choices || []),
        },
      ]),
    );

    return {
      ...data,
      choices: cleanChoiceList(data.choices || []),
      storyResults,
    };
  }

  getReflectionScopeLabel() {
    if (this.dataForReflection.storyMode === 'linear' || this.dataForReflection.chapter === 'linear') {
      return 'Analisis gabungan: Cyberbullying, Body Shaming, dan Cyber Grooming';
    }

    if (this.dataForReflection.chapter === 2) return 'Analisis cerita: Body Shaming';
    if (this.dataForReflection.chapter === 3) return 'Analisis cerita: Cyber Grooming';
    return 'Analisis cerita: Cyberbullying';
  }

  replayStory() {
    SaveManager.deleteReflection(this.reflectionId);
    SaveManager.deleteSave(this.dataForReflection.storyMode === 'linear' ? 'linear' : this.dataForReflection.chapter || 1);
    this.scene.start('ChapterSelectionScene');
  }
}
