import Phaser from 'phaser';
import { getAudioManager } from '../utils/AudioManager';
import { createFittedText, createNeonButton, createResponsiveBackground, safeLoadImage, setResponsiveLogoDisplaySize, getResponsiveFont, getResponsiveFontSize } from '../utils/UIHelpers';

export default class LandingScene extends Phaser.Scene {
  constructor() {
    super('LandingScene');
  }

  preload() {
    safeLoadImage(this, 'ray', '/assets/characters/ray/neutral.png');
    safeLoadImage(this, 'logo', '/assets/ui/logo.png');
    safeLoadImage(this, 'landingBg', '/assets/backgrounds/landing-bg.png');
  }

  create() {
    this.renderScene();
    getAudioManager(this.game).playMusic('music-main-theme');

    let resizeTimer;

    this.scale.on('resize', () => {
      clearTimeout(resizeTimer);

      resizeTimer = setTimeout(() => {
        this.scene.restart();
      }, 100);
    });
  }

  renderScene() {
    const { width, height } = this.scale;

    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;

    createResponsiveBackground(this, 'landingBg', { mobileFocalX: 0.62, overlayAlpha: 0.45 });

    // Logo
    const logo = this.add.image(width * 0.22, height * 0.18, 'logo');
    setResponsiveLogoDisplaySize(this, logo, {
      desktopWidth: width * 0.26,
      tabletWidth: width * 0.28,
      mobileWidth: width * 0.35,
      desktopX: width * 0.22,
      desktopY: height * 0.18,
      mobileY: height * 0.13,
    });

    // Subtitle
    createFittedText(
      this,
      isMobile ? width * 0.5 : width * 0.1,
      isMobile ? height * 0.29 : height * 0.34,
      'Ruang Aman Digital\nuntuk Bertahan dari\nTekanan Dunia Online',
      {
        fontSize: getResponsiveFont(width, 28),
        color: '#ffffff',
        lineSpacing: isMobile ? 6 : 10,
        align: isMobile ? 'center' : 'left',
      },
      {
        origin: isMobile ? 0.5 : [0, 0],
        maxWidth: isMobile ? width * 0.82 : width * 0.42,
        maxHeight: isMobile ? height * 0.2 : height * 0.26,
        minFontSize: 14,
      },
    );

    // Ray
    const ray = this.add.image(isMobile ? width * 0.5 : width * 0.75, isMobile ? height * 0.62 : height * 0.58, 'ray');

    const targetHeight = isMobile ? height * 0.24 : isTablet ? height * 0.32 : height * 0.5;

    ray.setScale(targetHeight / ray.height);

    // Floating animation
    this.tweens.add({
      targets: ray,
      y: ray.y - 10,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Modern Button
    this.createStartButton(isMobile ? width * 0.5 : width * 0.18, isMobile ? height * 0.82 : height * 0.65, isMobile ? width * 0.65 : 280, 70);
  }

  createStartButton(x, y, w, h) {
    createNeonButton(this, x, y, w, h, 'BEGIN JOURNEY', () => {
      getAudioManager(this.game).playSFX('sfx-click');
      this.scene.start('IntroScene');
    }, { fontSize: getResponsiveFontSize(this.scale.width, 22, { min: 14 }) });
  }
}
