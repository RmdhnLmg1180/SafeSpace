import Phaser from 'phaser';
import { SaveManager } from '../utils/SaveManager';
import { createResponsiveBackground, setResponsiveLogoDisplaySize } from '../utils/UIHelpers';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  preload() {
    this.load.image('landingBg', '/assets/backgrounds/landing-bg.png');
    this.load.image('logo', '/assets/ui/logo.png');
    this.load.image('ray', '/assets/characters/ray/neutral.png');
  }

  create() {
    const { width, height } = this.scale;
    const isMobile = width < 768;

    createResponsiveBackground(this, 'landingBg', { mobileFocalX: 0.62, overlayAlpha: 0.75 });

    if (isMobile) {
      this.createMobileMenu(width, height);
    } else {
      this.createDesktopMenu(width, height);
    }
  }

  createMobileMenu(width, height) {
    // Logo
    const logo = this.add.image(width / 2, 120, 'logo');
    setResponsiveLogoDisplaySize(this, logo, { mobileWidth: width * 0.38, mobileY: 88 });

    // Gear
    this.createGearButton(width - 60, 70);

    // Ray
    const ray = this.add.image(width / 2, height * 0.34, 'ray');
    ray.setScale(0.16);

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
    this.createButton(width / 2, height * 0.56, width * 0.75, 60, 'GAME BARU', () => this.scene.start('ChapterSelectionScene'));
    this.createButton(
      width / 2,
      height * 0.66,
      width * 0.75,
      60,
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
    this.createButton(width / 2, height * 0.76, width * 0.75, 60, 'LOAD GAME', hasSave ? () => this.scene.start('LoadGameScene') : null, !hasSave);
    this.createButton(width / 2, height * 0.86, width * 0.75, 60, 'TUTORIAL', () => this.scene.start('TutorialScene'));
    this.createButton(width / 2, height * 0.96, width * 0.75, 60, 'TENTANG KITA', () => this.scene.start('AboutScene'));
  }

  createDesktopMenu(width, height) {
    const logo = this.add.image(width * 0.2, height * 0.18, 'logo');
    setResponsiveLogoDisplaySize(this, logo, {
      desktopWidth: width * 0.24,
      tabletWidth: width * 0.26,
      desktopX: width * 0.2,
      desktopY: height * 0.18,
    });

    this.createGearButton(width - 80, 70);

    const ray = this.add.image(width * 0.72, height * 0.57, 'ray');
    ray.setScale(0.18);

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
    const glow = this.add.rectangle(x, y, w + 14, h + 14, 0x4fc3f7, 0.08);
    const btn = this.add
      .rectangle(x, y, w, h, disabled ? 0x444444 : 0x102040, disabled ? 0.5 : 0.82)
      .setStrokeStyle(2, 0x4fc3f7)
      .setInteractive({ useHandCursor: !disabled });
    this.add.rectangle(x, y - h * 0.22, w * 0.88, h * 0.22, 0xffffff, 0.05);
    const text = this.add
      .text(x, y, label, {
        fontSize: '22px',
        color: disabled ? '#888888' : '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    if (!disabled) {
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
      if (callback) {
        btn.on('pointerdown', callback);
      }
    } else {
      btn.setAlpha(0.5);
      text.setAlpha(0.5);
    }
  }

  createGearButton(x, y) {
    const glow = this.add.circle(x, y, 42, 0x4fc3f7, 0.1);
    const btn = this.add.circle(x, y, 34, 0x102040, 0.88).setStrokeStyle(2, 0x4fc3f7).setInteractive();
    const icon = this.add
      .text(x, y, '⚙', {
        fontSize: '34px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
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
    btn.on('pointerdown', () => this.scene.start('SettingsScene'));
  }
}
