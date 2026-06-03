import Phaser from 'phaser';

export default class ChapterSelectionScene extends Phaser.Scene {
  constructor() {
    super('ChapterSelectionScene');
  }

  preload() {
    this.load.image('landingBg', '/assets/backgrounds/landing-bg.png');
  }

  create() {
    const { width, height } = this.scale;

    const isMobile = width < 768;

    // Background sama seperti landing
    const bg = this.add.image(width / 2, height / 2, 'landingBg');

    const scaleX = width / bg.width;
    const scaleY = height / bg.height;
    const scale = Math.max(scaleX, scaleY);

    bg.setScale(scale);

    if (isMobile) {
      bg.setX(width * 0.62);
    }

    // Dark overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x081426, 0.72);

    // Title
    this.add
      .text(width / 2, height * 0.12, 'CHOOSE YOUR STORY', {
        fontSize: isMobile ? '24px' : '46px',
        color: '#4FC3F7',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.2, 'Pilih alur lengkap atau langsung masuk ke cerita yang ingin kamu mainkan.', {
        fontSize: isMobile ? '13px' : '18px',
        color: '#d9e9f2',
        align: 'center',
        wordWrap: { width: isMobile ? width * 0.82 : width * 0.62 },
      })
      .setOrigin(0.5);

    this.createMainButton(
      width / 2,
      isMobile ? height * 0.29 : height * 0.31,
      isMobile ? width * 0.82 : 420,
      isMobile ? 58 : 64,
      'IKUTI ALUR CERITA 1-3',
      () => this.scene.start('GameScene', { chapter: 1, storyMode: 'linear' }),
    );

    const scenarios = [
      {
        title: 'Cyberbullying',
        subtitle: 'Opini Berujung Petaka',
        color: 0x4fc3f7,
      },
      {
        title: 'Body Shaming',
        subtitle: 'Cermin yang Menyakitkan',
        color: 0x81c784,
      },
      {
        title: 'Cyber Grooming',
        subtitle: 'Jebakan di Balik Layar',
        color: 0xffb74d,
      },
    ];

    scenarios.forEach((scenario, index) => {
      const x = isMobile ? width / 2 : width * (0.22 + index * 0.28);
      const y = isMobile ? height * (0.43 + index * 0.16) : height * 0.6;
      const card = this.add
        .rectangle(x, y, isMobile ? width * 0.8 : width * 0.24, isMobile ? 105 : 205, scenario.color, 0.15)
        .setStrokeStyle(2, scenario.color)
        .setInteractive({ useHandCursor: true });
      this.add
        .text(x, y - (isMobile ? 18 : 30), scenario.title, {
          fontSize: isMobile ? '20px' : '26px',
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      this.add
        .text(x, y + (isMobile ? 16 : 18), scenario.subtitle, {
          fontSize: isMobile ? '14px' : '18px',
          color: '#d9d9d9',
          align: 'center',
        })
        .setOrigin(0.5);

      card.on('pointerover', () => card.setScale(1.05));
      card.on('pointerout', () => card.setScale(1));
      card.on('pointerdown', () => {
        if (index === 0) this.scene.start('GameScene', { chapter: 1, storyMode: 'single' });
        if (index === 1) this.scene.start('BodyShamingScene', { chapter: 2, storyMode: 'single' });
        if (index === 2) this.scene.start('CyberGroomingScene', { chapter: 3, storyMode: 'single' });
      });
    });

    this.createMainButton(isMobile ? width / 2 : 120, isMobile ? height * 0.92 : height * 0.9, isMobile ? width * 0.46 : 160, 52, 'BACK', () => this.scene.start('MenuScene'));
  }

  createMainButton(x, y, w, h, label, callback) {
    const glow = this.add.rectangle(x, y, w + 14, h + 14, 0x4fc3f7, 0.08);
    const btn = this.add.rectangle(x, y, w, h, 0x102040, 0.82).setStrokeStyle(2, 0x4fc3f7).setInteractive({ useHandCursor: true });
    this.add.rectangle(x, y - h * 0.22, w * 0.88, h * 0.22, 0xffffff, 0.05);
    const text = this.add
      .text(x, y, label, {
        fontSize: w < 200 ? '20px' : '22px',
        color: '#ffffff',
        fontStyle: 'bold',
        align: 'center',
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
    btn.on('pointerdown', callback);
  }
}
