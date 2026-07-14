import Phaser from 'phaser';
import { getAudioManager } from '../utils/AudioManager';
import { bindResponsiveScene, CRISP_FONT, createGlassPanel, createNeonButton, createResponsiveBackground, getResponsiveFontSize, safeLoadImage } from '../utils/UIHelpers';

export default class IntroScene extends Phaser.Scene {
  constructor() {
    super('IntroScene');
  }

  preload() {
    safeLoadImage(this, 'logo', '/assets/ui/logo.png');
    safeLoadImage(this, 'landingBg', '/assets/backgrounds/landing-bg.png');
  }

  create() {
    const { width, height } = this.scale;
    const isMobile = width < 768;
    bindResponsiveScene(this);

    createResponsiveBackground(this, 'landingBg', { mobileFocalX: 0.62, overlayColor: 0x000000, overlayAlpha: 0.75 });

    // Popup container
    const popupWidth = isMobile ? width * 0.86 : width * 0.58;
    const popupHeight = isMobile ? Math.min(height * 0.42, 320) : Math.min(height * 0.48, 390);
    const popupX = width / 2;
    const popupY = height / 2;
    const { panel: popup, highlight } = createGlassPanel(this, popupX, popupY, popupWidth, popupHeight, {
      fillAlpha: 0.88,
      strokeColor: 0x4fc3f7,
    });

    const title = this.createIntroDomText(
      popupX,
      popupY - popupHeight * 0.28,
      popupWidth * 0.82,
      popupHeight * 0.16,
      'WELCOME TO SAFE-SPACE',
      {
        size: isMobile ? 21 : 36,
        color: '#4FC3F7',
        weight: 800,
        lineHeight: 1.12,
      },
    );

    const message = this.createIntroDomText(
      popupX,
      popupY - popupHeight * 0.01,
      popupWidth * 0.8,
      popupHeight * 0.36,
      'Di dunia digital,\nkata-kata bisa menjadi tempat aman...\natau luka yang tak terlihat.',
      {
        size: isMobile ? 15 : 23,
        color: '#ffffff',
        weight: 600,
        lineHeight: isMobile ? 1.45 : 1.5,
      },
    );

    // Continue button
    this.createContinueButton(popupX, popupY + popupHeight * 0.31, isMobile ? popupWidth * 0.58 : 260, isMobile ? 54 : 62, [popup, highlight, title, message]);
  }

  createContinueButton(x, y, w, h, fadeTargets) {
    const button = createNeonButton(this, x, y, w, h, 'CONTINUE', () => {
      getAudioManager(this.game).playSFX('sfx-click');
      this.tweens.add({
        targets: [...fadeTargets, button.button, button.glow, button.highlight, button.label],
        alpha: 0,
        duration: 700,
        onComplete: () => {
          this.showLogoTransition();
        },
      });
    }, { fontSize: getResponsiveFontSize(this.scale.width, 22, { min: 14 }) });
  }

  createIntroDomText(x, y, w, h, text, options = {}) {
    const style = [
      `width:${Math.round(w)}px`,
      `height:${Math.round(h)}px`,
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'box-sizing:border-box',
      `font-family:${CRISP_FONT}`,
      `font-size:${options.size}px`,
      `font-weight:${options.weight ?? 650}`,
      `line-height:${options.lineHeight ?? 1.4}`,
      `color:${options.color ?? '#ffffff'}`,
      'text-align:center',
      'white-space:pre-line',
      'overflow:hidden',
      'overflow-wrap:anywhere',
      '-webkit-font-smoothing:antialiased',
      'text-rendering:geometricPrecision',
      'pointer-events:none',
    ].join(';');

    return this.add.dom(x, y, 'div', style, this.escapeHtml(text)).setOrigin(0.5).setDepth(20);
  }

  escapeHtml(value = '') {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  showLogoTransition() {
    const { width, height } = this.scale;

    const logo = this.add.image(width / 2, height / 2, 'logo');

    logo.setScale(0.25);
    logo.setAlpha(0);

    this.tweens.add({
      targets: logo,
      alpha: 1,
      duration: 450,
    });

    this.time.delayedCall(1000, () => {
      this.scene.start('MenuScene');
    });
  }
}
