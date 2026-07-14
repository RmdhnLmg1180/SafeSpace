import Phaser from 'phaser';
import { SaveManager } from '../utils/SaveManager';
import { getAudioManager } from '../utils/AudioManager';
import { bindResponsiveScene, CRISP_FONT, createNeonButton, createResponsiveBackground, getResponsiveFontSize, safeLoadImage, setResponsiveLogoDisplaySize } from '../utils/UIHelpers';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  preload() {
    safeLoadImage(this, 'landingBg', '/assets/backgrounds/landing-bg.png');
    safeLoadImage(this, 'logo', '/assets/ui/logo.png');
    safeLoadImage(this, 'ray', '/assets/characters/ray/neutral.png');
  }

  create() {
    const { width, height } = this.scale;
    const isMobile = width < 768;
    bindResponsiveScene(this);

    createResponsiveBackground(this, 'landingBg', { mobileFocalX: 0.62, overlayAlpha: 0.75 });

    if (isMobile) {
      this.createMobileMenu(width, height);
    } else {
      this.createDesktopMenu(width, height);
    }
  }

  createMobileMenu(width, height) {
    // Logo
    const logo = this.add.image(width / 2, Math.max(50, height * 0.09), 'logo').setDepth(30);
    setResponsiveLogoDisplaySize(this, logo, { mobileWidth: width * 0.7, mobileY: Math.max(56, height * 0.1) });

    // Gear
    this.createGearButton(width - 42, 42);

    // Ray
    const ray = this.add.image(width / 2, height * 0.31, 'ray').setDepth(5);
    ray.setScale(Math.min(height * 0.22, 150) / ray.height);

    this.tweens.add({
      targets: ray,
      y: ray.y - 10,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const hasSave = !!SaveManager.continueLastGame();

    // Buttons
    this.createButton(width / 2, height * 0.54, width * 0.75, 56, 'GAME BARU', () => this.scene.start('ChapterSelectionScene'));
    this.createButton(
      width / 2,
      height * 0.635,
      width * 0.75,
      56,
      'MELANJUTKAN',
      hasSave
        ? () => {
            const last = SaveManager.continueLastGame();
            if (last) {
              const { slot, data } = last;
              let scene = 'GameScene';
              if (data.currentChapter === 2) scene = 'BodyShamingScene';
              if (data.currentChapter === 3) scene = 'CyberGroomingScene';
              this.scene.start(scene, { ...data, slot });
            }
          }
        : null,
      !hasSave,
    );
    this.createButton(width / 2, height * 0.73, width * 0.75, 56, 'LOAD GAME', hasSave ? () => this.scene.start('LoadGameScene') : null, !hasSave);
    this.createButton(width / 2, height * 0.825, width * 0.75, 56, 'TUTORIAL', () => this.scene.start('TutorialScene'));
    this.createButton(width / 2, height * 0.92, width * 0.75, 56, 'TENTANG KITA', () => this.scene.start('AboutScene'));
  }

  createDesktopMenu(width, height) {
    const logo = this.add.image(width * 0.2, height * 0.18, 'logo').setDepth(20);
    setResponsiveLogoDisplaySize(this, logo, {
      desktopWidth: width * 0.24,
      tabletWidth: width * 0.26,
      desktopX: width * 0.2,
      desktopY: height * 0.18,
    });

    this.createGearButton(width - 80, 70);

    const ray = this.add.image(width * 0.72, height * 0.57, 'ray').setDepth(5);
    ray.setScale(Math.min(height * 0.56, 440) / ray.height);

    this.tweens.add({
      targets: ray,
      y: ray.y - 10,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const hasSave = !!SaveManager.continueLastGame();
    const x = width * 0.24;
    const buttonWidth = Math.min(320, width * 0.32);

    this.createButton(x, height * 0.38, buttonWidth, 62, 'GAME BARU', () => this.scene.start('ChapterSelectionScene'));
    this.createButton(
      x,
      height * 0.5,
      buttonWidth,
      62,
      'MELANJUTKAN',
      hasSave
        ? () => {
            const last = SaveManager.continueLastGame();
            if (last) {
              const { slot, data } = last;
              this.scene.start(this.getSceneForChapter(data.currentChapter), { ...data, slot });
            }
          }
        : null,
      !hasSave,
    );
    this.createButton(x, height * 0.62, buttonWidth, 62, 'LOAD GAME', hasSave ? () => this.scene.start('LoadGameScene') : null, !hasSave);
    this.createButton(x, height * 0.74, buttonWidth, 62, 'TUTORIAL', () => this.scene.start('TutorialScene'));
    this.createButton(x, height * 0.86, buttonWidth, 62, 'TENTANG KITA', () => this.scene.start('AboutScene'));
  }

  getSceneForChapter(chapter) {
    if (chapter === 2) return 'BodyShamingScene';
    if (chapter === 3) return 'CyberGroomingScene';
    return 'GameScene';
  }

  createButton(x, y, w, h, label, callback = null, disabled = false) {
    return createNeonButton(
      this,
      x,
      y,
      w,
      h,
      label,
      () => {
        getAudioManager(this.game).playSFX('sfx-click');
        if (callback) callback();
      },
      {
        disabled,
        fontSize: getResponsiveFontSize(this.scale.width, 22, { min: 13 }),
        depth: 30,
      },
    );
  }

  createGearButton(x, y) {
    const glow = this.add.circle(x, y, 42, 0x4fc3f7, 0.1).setDepth(21);
    const btn = this.add.circle(x, y, 34, 0x102040, 0.88).setStrokeStyle(2, 0x4fc3f7).setInteractive().setDepth(22);
    const icon = this.add
      .text(x, y, '⚙', {
        fontSize: '34px',
        color: '#ffffff',
        fontFamily: CRISP_FONT,
      })
      .setOrigin(0.5)
      .setDepth(23);
    btn.on('pointerover', () => {
      btn.setFillStyle(0x16325f);
      glow.setAlpha(0.22);
      this.tweens.add({
        targets: icon,
        angle: 90,
        duration: 250,
      });
    });
    btn.on('pointerout', () => {
      btn.setFillStyle(0x102040);
      glow.setAlpha(0.1);
      this.tweens.add({
        targets: icon,
        angle: 0,
        duration: 250,
      });
    });
    btn.on('pointerdown', () => {
      getAudioManager(this.game).playSFX('sfx-click');
      this.scene.start('SettingsScene');
    });
  }
}
