// src/scenes/ReflectionScene.js
import Phaser from 'phaser';
import { getCounselorReflection } from '../utils/ReflectionAI';
import { getAudioManager } from '../utils/AudioManager';
import { SaveManager, getReflectionId } from '../utils/SaveManager';
import {
  cleanChoiceList,
  cleanDisplayText,
  bindResponsiveScene,
  createDomScrollPanel,
  createFittedText,
  createGlassPanel,
  createNeonButton,
  createResponsiveBackground,
  getResponsiveFont,
  getResponsiveFontSize,
  sanitizePlainText,
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
    bindResponsiveScene(this, () => this.getSceneState());

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

    const ray = this.add.image(isMobile ? width * 0.5 : width * 0.17, isMobile ? height * 0.2 : height * 0.56, 'ray-relief');
    const rayTargetHeight = isMobile ? Math.min(height * 0.12, 92) : Math.min(height * 0.42, 280);
    ray.setScale(rayTargetHeight / ray.height);

    const panelX = isMobile ? width / 2 : width * 0.62;
    const panelY = isMobile ? height * 0.56 : height * 0.5;
    const panelWidth = isMobile ? width * 0.88 : width * 0.58;
    const panelHeight = isMobile ? height * 0.58 : height * 0.62;

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

      reflection = sanitizePlainText(reflection);
      this.reflectionRecord = this.persistReflection(reflection);
    }

    reflection = sanitizePlainText(reflection);

    loadingText.destroy();

    const scopeText = createFittedText(
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
    scopeText.setDepth(32);

    const boxWidth = Math.round(panelWidth * (isMobile ? 0.82 : 0.86));
    const boxHeight = Math.round(panelHeight * (isMobile ? 0.56 : 0.6));
    const boxY = panelY + panelHeight * 0.035;
    this.createReflectionScrollBox(panelX, boxY, boxWidth, boxHeight, reflection, isMobile);

    if (this.reflectionRecord?.savedAt) {
      const savedDate = new Date(this.reflectionRecord.savedAt).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      const expiryDate = this.reflectionRecord.expiresAt
        ? new Date(this.reflectionRecord.expiresAt).toLocaleDateString('id-ID')
        : '-';
      const expiryText = createFittedText(
        this,
        panelX,
        panelY + panelHeight * 0.42,
        `Disimpan ${savedDate}  •  Berlaku sampai ${expiryDate}`,
        {
          fontSize: getResponsiveFont(width, 14, { min: 10 }),
          color: '#a9c7d8',
          align: 'center',
        },
        { maxWidth: panelWidth * 0.82, maxHeight: 22, minFontSize: 9 },
      );
      expiryText.setDepth(32);
    }

    const buttonY = isMobile ? height * 0.92 : height * 0.9;
    const replayX = isMobile ? width * 0.28 : width * 0.18;
    const menuX = isMobile ? width * 0.72 : width * 0.36;
    createNeonButton(this, replayX, buttonY, isMobile ? width * 0.4 : 180, 52, 'MAIN ULANG', () => {
      audio.playSFX('sfx-click');
      this.replayStory();
    }, { fontSize: getResponsiveFontSize(width, 18, { min: 12 }), strokeColor: 0xffb74d, depth: 50 });

    createNeonButton(this, menuX, buttonY, isMobile ? width * 0.4 : 180, 52, 'KEMBALI MENU', () => {
      audio.playSFX('sfx-back');
      if (!this.reflectionRecord) this.reflectionRecord = this.persistReflection(reflection);
      this.scene.start('MenuScene');
    }, { fontSize: getResponsiveFontSize(width, 18, { min: 11 }), depth: 50 });
  }

  persistReflection(reflection) {
    return SaveManager.saveReflection(this.reflectionId, {
      ...this.dataForReflection,
      reflectionId: this.reflectionId,
      reflection: sanitizePlainText(reflection),
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
      reflection: data.reflection ? sanitizePlainText(data.reflection) : undefined,
      choices: cleanChoiceList(data.choices || []),
      storyResults,
    };
  }

  createReflectionScrollBox(panelX, panelY, boxWidth, boxHeight, reflection, isMobile) {
    return createDomScrollPanel(this, panelX, panelY, boxWidth, boxHeight, this.cleanReflectionText(reflection), {
      fontSize: isMobile ? 14 : 17,
      fontWeight: 600,
      lineHeight: 1.6,
      paddingX: isMobile ? 13 : 18,
      paddingY: isMobile ? 12 : 16,
    });
  }

  cleanReflectionText(value = '') {
    return sanitizePlainText(value);
  }

  getReflectionScopeLabel() {
    if (this.dataForReflection.storyMode === 'linear' || this.dataForReflection.chapter === 'linear') {
      return cleanDisplayText('Analisis gabungan: Cyberbullying, Body Shaming, dan Cyber Grooming');
    }

    if (this.dataForReflection.chapter === 2) return cleanDisplayText('Analisis cerita: Body Shaming');
    if (this.dataForReflection.chapter === 3) return cleanDisplayText('Analisis cerita: Cyber Grooming');
    return cleanDisplayText('Analisis cerita: Cyberbullying');
  }

  replayStory() {
    SaveManager.deleteReflection(this.reflectionId);
    SaveManager.deleteSave(this.dataForReflection.storyMode === 'linear' ? 'linear' : this.dataForReflection.chapter || 1);
    this.scene.start('ChapterSelectionScene');
  }

  getSceneState() {
    return {
      ...this.dataForReflection,
      reflectionId: this.reflectionId,
      reflection: this.reflectionRecord?.reflection,
      savedAt: this.reflectionRecord?.savedAt,
      expiresAt: this.reflectionRecord?.expiresAt,
      fromSaved: Boolean(this.reflectionRecord),
    };
  }
}
