import Phaser from 'phaser';
import { SaveManager } from '../utils/SaveManager';
import { getAudioManager } from '../utils/AudioManager';
import { createResponsiveBackground, getResponsiveFont, getDeviceType, scaleCharacterByScreenHeight, getChapterBackgroundKey } from '../utils/UIHelpers';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');

    this.currentDay = 1;
    this.mentalState = 80;
    this.mentalShield = 40;
  }

  init(data = {}) {
    this.currentDay = data.currentDay || 1;
    this.mentalState = data.mentalState || 80;
    this.mentalShield = data.mentalShield || 40;
    this.playerChoices = data.playerChoices || [];
    this.slot = data.slot;
    this.storyMode = data.storyMode || 'single';
  }

  preload() {
    for (let i = 1; i <= 7; i++) {
      this.load.image(`day${i}`, `/assets/backgrounds/day${i}.png`);
    }

    this.load.image('ray-neutral', '/assets/characters/ray/neutral.png');
    this.load.image('ray-sad', '/assets/characters/ray/sad.png');
    this.load.image('ray-panic', '/assets/characters/ray/panic.png');
    this.load.image('ray-relief', '/assets/characters/ray/relief.png');
  }

  create() {
    getAudioManager(this.game).playMusic('music-story-theme');
    this.renderScene();

    let resizeTimer;

    this.scale.on('resize', () => {
      clearTimeout(resizeTimer);

      resizeTimer = setTimeout(() => {
        this.scene.restart(this.getSceneState());
      }, 100);
    });
  }

  renderScene() {
    const { width, height } = this.scale;
    const device = getDeviceType(width);

    createResponsiveBackground(this, getChapterBackgroundKey('cyber', this.currentDay), { mobileFocalX: 0.62 });
    this.createTopPanel(width, height, device);
    this.createCharacter(width, height, device);
    this.createStoryPanel(width, height, device);
    this.createChoicePanel(width, height, device);
  }

  createTopPanel(width, height, device) {
    const isMobile = device === 'mobile';
    const panelWidth = isMobile ? width * 0.84 : width * 0.32;
    const panelHeight = isMobile ? 108 : 118;
    const panelX = isMobile ? width * 0.5 : width * 0.2;

    this.add.rectangle(panelX, height * 0.095, panelWidth, panelHeight, 0x0e1f3d, 0.52).setStrokeStyle(2, 0x66d9ff, 0.8);

    this.add.text(panelX - panelWidth * 0.42, height * 0.05, 'STATUS MENTAL', {
      fontSize: getResponsiveFont(width, 20),
      color: '#e7f8ff',
      fontStyle: 'bold',
    });

    const barWidth = panelWidth * 0.86;
    const barHeight = isMobile ? 20 : 24;
    const barX = panelX;
    const barY = height * 0.09;

    this.add.rectangle(barX, barY, barWidth, barHeight, 0x0a172d, 0.9).setStrokeStyle(1, 0x8be9ff, 0.5);

    const safeMental = Phaser.Math.Clamp(this.mentalState, 0, 100);
    const fillWidth = (safeMental / 100) * barWidth;
    const fillBar = this.add.rectangle(barX - barWidth / 2 + fillWidth / 2, barY, fillWidth, barHeight, this.getMentalColor());

    this.tweens.add({
      targets: fillBar,
      width: fillWidth,
      duration: 450,
      ease: 'Sine.easeOut',
    });

    this.add.text(panelX - panelWidth * 0.42, height * 0.12, `Netral | Anxiety ${100 - safeMental} | Shield ${this.mentalShield}%`, {
      fontSize: getResponsiveFont(width, 18),
      color: '#ffffff',
    });

    this.add.text(width * 0.88, height * 0.05, `Hari ke-${this.currentDay}`, {
      fontSize: getResponsiveFont(width, 30),
      color: '#ffffff',
      fontStyle: 'bold',
    });
  }

  createCharacter(width, height, device) {
    const isMobile = device === 'mobile';
    const expression = this.getCharacterExpression();
    const ray = this.add.image(isMobile ? width * 0.22 : width * 0.1, isMobile ? height * 0.62 : height * 0.63, expression);

    scaleCharacterByScreenHeight(this, ray, { desktopPercent: 0.5, tabletPercent: 0.38, mobilePercent: 0.25 });

    this.tweens.add({
      targets: ray,
      y: ray.y - 8,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  createStoryPanel(width, height) {
    this.add.rectangle(width * 0.6, height * 0.42, width * 0.58, height * 0.25, 0x102040, 0.88).setStrokeStyle(2, 0x4fc3f7);

    this.add
      .text(width * 0.6, height * 0.42, this.getStoryText(), {
        fontSize: getResponsiveFont(width, 26),
        color: '#ffffff',
        align: 'center',
        wordWrap: {
          width: width * 0.48,
        },
      })
      .setOrigin(0.5);
  }

  createChoicePanel(width, height) {
    const choices = this.getChoices();

    choices.forEach((choice, index) => {
      const y = height * (0.7 + index * 0.09);

      const btn = this.add.rectangle(width * 0.6, y, width * 0.45, 55, 0x102040, 0.88).setStrokeStyle(2, 0x4fc3f7).setInteractive();

      this.add
        .text(width * 0.6, y, choice, {
          fontSize: getResponsiveFont(width, 22),
          color: '#ffffff',
        })
        .setOrigin(0.5);

      btn.on('pointerover', () => {
        btn.setFillStyle(0x16325f);
      });

      btn.on('pointerout', () => {
        btn.setFillStyle(0x102040);
      });

      btn.on('pointerdown', () => {
        getAudioManager(this.game).playSFX('sfx-choice');
        this.nextDay(index);
      });
    });
  }

  getCharacterExpression() {
    if (this.currentDay <= 2) return 'ray-neutral';
    if (this.currentDay <= 4) return 'ray-sad';
    if (this.currentDay <= 5) return 'ray-panic';
    return 'ray-relief';
  }

  getMentalColor() {
    if (this.mentalState > 70) return 0x4fc3f7;
    if (this.mentalState > 40) return 0xffc107;
    return 0xff5252;
  }

  getStoryText() {
    const stories = {
      1: 'Kamu memposting opini jujur tentang film idol viral.\nLalu pergi tidur tanpa berpikir banyak.',

      2: 'Ponselmu hang oleh ratusan notifikasi.\nPostinganmu direpost fanbase besar.\nKolom komentar dipenuhi serangan.',

      3: 'Mereka mulai melacak jejak digitalmu.\nFoto seragam sekolahmu ditemukan dan disebarluaskan.',

      4: 'Nomor WhatsApp-mu bocor.\nPesan ancaman terus berdatangan.\nDadamu terasa sesak.',

      5: 'Di depan cermin, kata-kata mereka terus terngiang.\nKamu mulai meragukan nilai dirimu sendiri.',

      6: 'Guru BK memanggilmu.\nBeliau berkata lembut:\n"Kamu aman di sini. Mau cerita?"',

      7: 'Satu minggu berat telah berlalu.\nKini waktunya refleksi dan pemulihan.',
    };

    return stories[this.currentDay];
  }

  getChoices() {
    const choices = {
      1: ['Biarkan saja', 'Hapus postingan'],

      2: ['Balas dengan emosi', 'Matikan data dan menghindar', 'Private akun dan log out'],

      3: ['Mengurung diri', 'Membuat video permintaan maaf', 'Mencari dukungan'],

      4: ['Panik dan kehilangan kontrol', 'Tenangkan diri & ganti nomor'],

      5: ['Melukai diri (Game Over)', 'Gunakan teknik grounding'],

      6: ['Menyangkal', 'Jujur dan meminta bantuan'],

      7: ['Lihat hasil refleksi'],
    };

    return choices[this.currentDay];
  }

  nextDay(choiceIndex = 0) {
    const selectedChoice = this.getChoices()[choiceIndex] || this.getChoices()[0];
    this.playerChoices.push(selectedChoice);

    switch (this.currentDay) {
      case 1:
        if (choiceIndex === 1) this.mentalShield += 5;
        break;

      case 2:
        if (choiceIndex === 0) this.mentalState -= 20;
        if (choiceIndex === 1) this.mentalState -= 10;
        if (choiceIndex === 2) this.mentalShield += 15;
        break;

      case 3:
        if (choiceIndex === 0) {
          this.mentalState -= 20;
          this.mentalShield -= 10;
        }
        if (choiceIndex === 1) this.mentalState -= 15;
        if (choiceIndex === 2) this.mentalShield += 20;
        break;

      case 4:
        if (choiceIndex === 0) this.mentalState -= 30;
        if (choiceIndex === 1) this.mentalShield += 20;
        break;

      case 5:
        if (choiceIndex === 0) {
          this.scene.start('OutcomeResultScene', {
            ending: 'Bad',
            chapter: 1,
            choices: this.playerChoices,
            mentalShield: this.mentalShield,
            anxiety: 100 - this.mentalState,
          });
          return;
        }

        if (choiceIndex === 1) this.mentalShield += 30;
        break;

      case 6:
        if (choiceIndex === 0) this.mentalState -= 10;
        if (choiceIndex === 1) this.mentalShield += 25;
        break;

      case 7:
        SaveManager.saveGame(this.slot || 1, {
          currentChapter: this.storyMode === 'linear' ? 2 : 1,
          currentDay: this.storyMode === 'linear' ? 1 : 7,
          mentalShield: this.storyMode === 'linear' ? 45 : this.mentalShield,
          mentalState: this.storyMode === 'linear' ? 65 : this.mentalState,
          playerChoices: [],
          storyMode: this.storyMode,
        });

        if (this.storyMode === 'linear') {
          this.scene.start('BodyShamingScene', { storyMode: 'linear' });
          return;
        }

        this.scene.start('OutcomeResultScene', {
          ending: this.mentalShield > this.mentalState ? 'Good' : 'Reflection',
          chapter: 1,
          choices: this.playerChoices,
          mentalShield: this.mentalShield,
          anxiety: 100 - this.mentalState,
        });
        return;
    }

    this.currentDay++;
    SaveManager.saveGame(this.slot || 1, {
      currentChapter: 1,
      currentDay: this.currentDay,
      mentalShield: this.mentalShield,
      mentalState: this.mentalState,
      playerChoices: this.playerChoices,
      storyMode: this.storyMode,
    });
    this.scene.restart({
      currentDay: this.currentDay,
      mentalShield: this.mentalShield,
      mentalState: this.mentalState,
      playerChoices: this.playerChoices,
      slot: this.slot,
      storyMode: this.storyMode,
    });
  }

  getSceneState() {
    return {
      currentDay: this.currentDay,
      mentalShield: this.mentalShield,
      mentalState: this.mentalState,
      playerChoices: this.playerChoices,
      slot: this.slot,
      storyMode: this.storyMode,
    };
  }
}
