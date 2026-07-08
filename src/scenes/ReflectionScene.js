// src/scenes/ReflectionScene.js
import Phaser from 'phaser';
import { getCounselorReflection } from '../utils/ReflectionAI';
import { getAudioManager } from '../utils/AudioManager';
import { SaveManager, getReflectionId } from '../utils/SaveManager';
import {
  cleanChoiceList,
  cleanDisplayText,
  CRISP_FONT,
  createFittedText,
  createGlassPanel,
  createNeonButton,
  createResponsiveBackground,
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
    const boxHeight = Math.round(panelHeight * (isMobile ? 0.54 : 0.58));
    const boxY = panelY + panelHeight * (isMobile ? 0.03 : 0.04);
    this.createReflectionScrollBox(panelX, boxY, boxWidth, boxHeight, reflection, isMobile);

    if (this.reflectionRecord?.expiresAt) {
      const expiryText = createFittedText(
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

  createReflectionScrollBox(panelX, panelY, boxWidth, boxHeight, reflection, isMobile) {
    const safeText = this.escapeHtml(this.cleanReflectionText(reflection));
    const fontSize = isMobile ? 14 : 17;
    const outerStyle = [
      `width:${boxWidth}px`,
      `height:${boxHeight}px`,
      'overflow:hidden',
      'box-sizing:border-box',
      'border-radius:12px',
      'background:rgba(4, 13, 29, 0.43)',
      'contain:paint',
      'pointer-events:auto',
    ].join(';');

    const innerStyle = [
      'width:100%',
      'height:100%',
      'overflow-y:auto',
      'overflow-x:hidden',
      'box-sizing:border-box',
      'padding:11px 13px 14px',
      `font-family:${CRISP_FONT}`,
      `font-size:${fontSize}px`,
      'font-weight:650',
      'line-height:1.55',
      'color:#ffffff',
      'text-align:left',
      'white-space:pre-wrap',
      'overflow-wrap:anywhere',
      '-webkit-font-smoothing:antialiased',
      'text-rendering:geometricPrecision',
    ].join(';');

    this.add
      .dom(panelX, panelY, 'div', outerStyle, `<div style="${innerStyle}">${safeText}</div>`)
      .setOrigin(0.5)
      .setDepth(30);
  }

  cleanReflectionText(value = '') {
    return String(value)
      .replace(/\s*\(\s*game\s*over\s*\)\s*/gi, '')
      .trim();
  }

  escapeHtml(value = '') {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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
}
