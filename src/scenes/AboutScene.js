// src/scenes/AboutScene.js
import Phaser from 'phaser';
import { getAudioManager } from '../utils/AudioManager';
import { createFittedText, createGlassPanel, createNeonButton, createResponsiveBackground, createScrollableTextBox, getResponsiveFont, getResponsiveFontSize, safeLoadImage, setResponsiveLogoDisplaySize } from '../utils/UIHelpers';

export default class AboutScene extends Phaser.Scene {
  constructor() {
    super('AboutScene');
  }

  preload() {
    safeLoadImage(this, 'landingBg', '/assets/backgrounds/landing-bg.png');
    safeLoadImage(this, 'logo', '/assets/ui/logo.png');
  }

  create() {
    const { width, height } = this.scale;
    const isMobile = width < 768;

    createResponsiveBackground(this, 'landingBg', { mobileFocalX: 0.6, overlayAlpha: 0.72 });

    createGlassPanel(this, width / 2, height / 2, width * 0.9, height * 0.86, {
      fillAlpha: 0.45,
      strokeColor: 0x77d6ff,
      strokeAlpha: 0.6,
    });

    const logo = this.add.image(width / 2, height * 0.12, 'logo');
    setResponsiveLogoDisplaySize(this, logo, {
      desktopWidth: width * 0.18,
      tabletWidth: width * 0.24,
      mobileWidth: width * 0.32,
      desktopX: width / 2,
      desktopY: height * 0.13,
      mobileY: height * 0.13,
    });

    createFittedText(
      this,
      width / 2,
      height * 0.28,
      'Game Edukasi Interaktif Pencegahan\nSelf-Harm pada Remaja Korban Bullying',
      {
        fontSize: getResponsiveFont(width, 26, { min: 14 }),
        color: '#cdefff',
        align: 'center',
      },
      { maxWidth: width * 0.82, maxHeight: height * 0.12, minFontSize: 12 },
    );

    const creditText =
      '\n\nDikembangkan oleh:\nAhmad Najmi\nArfa Khalifano Fatizio\n\n' +
      'Peserta Lomba OPSI\nSMP Negeri 8 Yogyakarta\n\n' +
      'Dibimbing oleh:\nMuhammad Abdul Aziz, S.Pd.\n\n' +
      'Tujuan Pengembangan:\nMeningkatkan kesadaran remaja terhadap pentingnya kesehatan mental digital serta memberikan edukasi preventif terkait:\n\n' +
      '- Cyberbullying\n- Body Shaming\n- Cyber Grooming\n- Pencegahan Self-Harm\n\n';

    createScrollableTextBox(
      this,
      width / 2,
      height * 0.57,
      width * (isMobile ? 0.78 : 0.66),
      height * (isMobile ? 0.38 : 0.42),
      creditText.trim(),
      {
        fontSize: getResponsiveFont(width, 22, { min: 13 }),
        color: '#ffffff',
        align: 'center',
        lineSpacing: isMobile ? 5 : 8,
      },
      { padding: isMobile ? 10 : 18 },
    );

    createFittedText(
      this,
      width / 2,
      height * 0.83,
      'Berani Bicara. Ambil Kendali.\nKamu Tidak Sendirian.',
      {
        fontSize: getResponsiveFont(width, 28, { min: 15 }),
        color: '#8be9ff',
        fontStyle: 'bold',
        align: 'center',
      },
      { maxWidth: width * 0.82, maxHeight: height * 0.1, minFontSize: 13 },
    );

    this.createButton(isMobile ? width / 2 : 120, isMobile ? height * 0.93 : height * 0.93, isMobile ? width * 0.46 : 160, 52, 'BACK', () => {
      getAudioManager(this.game).playSFX('sfx-back');
      this.scene.start('MenuScene');
    });
  }

  createButton(x, y, w, h, label, callback) {
    return createNeonButton(this, x, y, w, h, label, callback, {
      fontSize: getResponsiveFontSize(this.scale.width, 20, { min: 12 }),
    });
  }
}

export function showAboutPopup(scene) {
  scene.scene.start('AboutScene');
}
