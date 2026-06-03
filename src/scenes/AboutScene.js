// src/scenes/AboutScene.js
import Phaser from 'phaser';
import { getAudioManager } from '../utils/AudioManager';
import { createResponsiveBackground, getResponsiveFont, setResponsiveLogoDisplaySize } from '../utils/UIHelpers';

export default class AboutScene extends Phaser.Scene {
  constructor() {
    super('AboutScene');
  }

  preload() {
    this.load.image('landingBg', '/assets/backgrounds/landing-bg.png');
    this.load.image('logo', '/assets/ui/logo.png');
  }

  create() {
    const { width, height } = this.scale;
    const isMobile = width < 768;

    createResponsiveBackground(this, 'landingBg', { mobileFocalX: 0.6, overlayAlpha: 0.72 });

    this.add.rectangle(width / 2, height / 2, width * 0.9, height * 0.86, 0x102040, 0.45).setStrokeStyle(2, 0x77d6ff, 0.6);
    this.add.rectangle(width / 2, height * 0.16, width * 0.78, height * 0.18, 0xffffff, 0.05);

    const logo = this.add.image(width / 2, height * 0.12, 'logo');
    setResponsiveLogoDisplaySize(this, logo, {
      desktopWidth: width * 0.18,
      tabletWidth: width * 0.24,
      mobileWidth: width * 0.32,
      desktopX: width / 2,
      desktopY: height * 0.13,
      mobileY: height * 0.13,
    });

    this.add
      .text(width / 2, height * 0.29, 'Game Edukasi Interaktif Pencegahan\nSelf-Harm pada Remaja Korban Bullying\n\n', {
        fontSize: getResponsiveFont(width, 26),
        color: '#cdefff',
      })
      .setOrigin(0.5);

    const creditText =
      'Dikembangkan oleh:\nAhmad Najmi\nArfa Khalifano Fatizio\n\n' +
      'Peserta Lomba OPSI\nSMP Negeri 8 Yogyakarta\n\n' +
      'Dibimbing oleh:\nMuhammad Abdul Aziz, S.Pd.\n\n' +
      'Tujuan Pengembangan:\nMeningkatkan kesadaran remaja terhadap pentingnya kesehatan mental digital serta memberikan edukasi preventif terkait:\n\n' +
      '- Cyberbullying\n- Body Shaming\n- Cyber Grooming\n- Pencegahan Self-Harm\n\n';

    this.add
      .text(width / 2, height * 0.56, creditText, {
        fontSize: getResponsiveFont(width, 24),
        color: '#ffffff',
        align: 'center',
        lineSpacing: 8,
        wordWrap: { width: width * (isMobile ? 0.78 : 0.7) },
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.9, 'Berani Bicara. Ambil Kendali.\nKamu Tidak Sendirian.', {
        fontSize: getResponsiveFont(width, 28),
        color: '#8be9ff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.createButton(isMobile ? width / 2 : 120, isMobile ? height * 0.96 : height * 0.93, isMobile ? width * 0.46 : 160, 52, 'BACK', () => {
      getAudioManager(this.game).playSFX('sfx-back');
      this.scene.start('MenuScene');
    });
  }

  createButton(x, y, w, h, label, callback) {
    const glow = this.add.rectangle(x, y, w + 14, h + 14, 0x4fc3f7, 0.08);
    const btn = this.add.rectangle(x, y, w, h, 0x102040, 0.82).setStrokeStyle(2, 0x4fc3f7).setInteractive({ useHandCursor: true });
    this.add.rectangle(x, y - h * 0.22, w * 0.88, h * 0.22, 0xffffff, 0.05);
    this.add
      .text(x, y, label, {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    btn.on('pointerover', () => {
      btn.setFillStyle(0x16325f);
      glow.setAlpha(0.22);
    });
    btn.on('pointerout', () => {
      btn.setFillStyle(0x102040);
      glow.setAlpha(0.08);
    });
    btn.on('pointerdown', callback);
  }
}

export function showAboutPopup(scene) {
  scene.scene.start('AboutScene');
}
