import Phaser from 'phaser';
import { getAudioManager } from '../utils/AudioManager';
import { createFittedText, createGlassPanel, createNeonButton, createResponsiveBackground, getResponsiveFont, getResponsiveFontSize, safeLoadImage } from '../utils/UIHelpers';

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

    // Title
    const title = createFittedText(
      this,
      popupX,
      popupY - popupHeight * 0.28,
      'WELCOME TO SAFE-SPACE',
      {
        fontSize: getResponsiveFont(width, 38, { min: 20 }),
        color: '#4FC3F7',
        fontStyle: 'bold',
        align: 'center',
      },
      { maxWidth: popupWidth * 0.82, maxHeight: popupHeight * 0.16, minFontSize: 16 },
    );

    // Message
    const message = createFittedText(
      this,
      popupX,
      popupY - popupHeight * 0.02,
      'Di dunia digital,\nkata-kata bisa menjadi tempat aman...\natau luka yang tak terlihat.',
      {
        fontSize: getResponsiveFont(width, 24, { min: 15 }),
        color: '#ffffff',
        align: 'center',
        lineSpacing: isMobile ? 8 : 12,
      },
      { maxWidth: popupWidth * 0.78, maxHeight: popupHeight * 0.34, minFontSize: 12 },
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
