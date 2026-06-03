import Phaser from 'phaser';

export default class IntroScene extends Phaser.Scene {
  constructor() {
    super('IntroScene');
  }

  preload() {
    this.load.image('logo', '/assets/ui/logo.png');
    this.load.image('landingBg', '/assets/backgrounds/landing-bg.png');
  }

  create() {
    const { width, height } = this.scale;
    const isMobile = width < 768;

    // Background
    const bg = this.add.image(width / 2, height / 2, 'landingBg');

    const scale = Math.max(width / bg.width, height / bg.height);

    bg.setScale(scale);

    if (isMobile) {
      bg.setX(width * 0.62);
    }

    // Dark overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75);

    // Popup container
    const popup = this.add.rectangle(width / 2, height / 2, isMobile ? width * 0.88 : width * 0.62, isMobile ? height * 0.48 : height * 0.52, 0x102040, 0.88).setStrokeStyle(2, 0x4fc3f7);

    // Highlight
    this.add.rectangle(width / 2, height * 0.28, popup.width * 0.85, 26, 0xffffff, 0.04);

    // Title
    const title = this.add
      .text(width / 2, height * 0.28, 'WELCOME TO SAFE-SPACE', {
        fontSize: isMobile ? '22px' : '38px',
        color: '#4FC3F7',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Message
    const message = this.add
      .text(width / 2, height * 0.45, 'Di dunia digital,\nkata-kata bisa menjadi tempat aman...\natau luka yang tak terlihat.', {
        fontSize: isMobile ? '16px' : '24px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 12,
      })
      .setOrigin(0.5);

    // Continue button
    this.createContinueButton(width / 2, height * 0.7, isMobile ? width * 0.55 : 260, 65, popup, title, message);
  }

  createContinueButton(x, y, w, h, popup, title, message) {
    const glow = this.add.rectangle(x, y, w + 14, h + 14, 0x4fc3f7, 0.08);

    const btn = this.add.rectangle(x, y, w, h, 0x102040, 0.82).setStrokeStyle(2, 0x4fc3f7).setInteractive();

    this.add.rectangle(x, y - h * 0.22, w * 0.88, h * 0.22, 0xffffff, 0.05);

    const text = this.add
      .text(x, y, 'CONTINUE', {
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
      this.tweens.add({
        targets: [popup, title, message, btn, glow, text],
        alpha: 0,
        duration: 700,
        onComplete: () => {
          this.showLogoTransition();
        },
      });
    });
  }

  showLogoTransition() {
    const { width, height } = this.scale;

    const logo = this.add.image(width / 2, height / 2, 'logo');

    logo.setScale(0.25);
    logo.setAlpha(0);

    this.tweens.add({
      targets: logo,
      alpha: 1,
      duration: 1200,
    });

    this.time.delayedCall(3000, () => {
      this.scene.start('MenuScene');
    });
  }
}
