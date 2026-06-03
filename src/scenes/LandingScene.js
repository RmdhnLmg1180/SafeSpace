import Phaser from 'phaser';
import { getAudioManager } from '../utils/AudioManager';
import { createResponsiveBackground, setResponsiveLogoDisplaySize, getResponsiveFont } from '../utils/UIHelpers';

export default class LandingScene extends Phaser.Scene {
  constructor() {
    super('LandingScene');
  }

  preload() {
    this.load.image('ray', '/assets/characters/ray/neutral.png');
    this.load.image('logo', '/assets/ui/logo.png');
    this.load.image('landingBg', '/assets/backgrounds/landing-bg.png');
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
    this.add.text(isMobile ? width * 0.15 : width * 0.1, isMobile ? height * 0.28 : height * 0.34, 'Ruang Aman Digital\nuntuk Bertahan dari\nTekanan Dunia Online', {
      fontSize: getResponsiveFont(width, 28),
      color: '#ffffff',
      lineSpacing: 10,
    });

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
    const glow = this.add.rectangle(x, y, w + 14, h + 14, 0x4fc3f7, 0.08);

    const btn = this.add.rectangle(x, y, w, h, 0x102040, 0.82).setStrokeStyle(2, 0x4fc3f7).setInteractive();

    this.add.rectangle(x, y - h * 0.22, w * 0.88, h * 0.22, 0xffffff, 0.05);

    const text = this.add
      .text(x, y, 'BEGIN JOURNEY', {
        fontSize: '22px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    btn.on('pointerover', () => {
      btn.setFillStyle(0x16325f);
      glow.setAlpha(0.22);
      btn.setScale(1.04);
      text.setScale(1.03);
    });

    btn.on('pointerout', () => {
      btn.setFillStyle(0x102040);
      glow.setAlpha(0.08);
      btn.setScale(1);
      text.setScale(1);
    });

    btn.on('pointerdown', () => {
      getAudioManager(this.game).playSFX('sfx-click');
      this.scene.start('IntroScene');
    });
  }
}
