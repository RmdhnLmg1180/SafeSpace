// src/scenes/BodyShamingScene.js
import Phaser from 'phaser';
import { SaveManager } from '../utils/SaveManager';
import { getAudioManager } from '../utils/AudioManager';
import { createResponsiveBackground, getResponsiveFont, getDeviceType, scaleCharacterByScreenHeight, getChapterBackgroundKey } from '../utils/UIHelpers';

export default class BodyShamingScene extends Phaser.Scene {
  constructor() {
    super('BodyShamingScene');
  }

  init(data = {}) {
    this.currentDay = data.currentDay || 1;
    this.mentalShield = data.mentalShield || 45;
    this.mentalState = data.mentalState || 65;
    this.playerChoices = data.playerChoices || [];
    this.slot = data.slot;
    this.storyMode = data.storyMode || 'single';
  }

  preload() {
    for (let i = 1; i <= 7; i++) {
      this.load.image(`day${i}`, `/assets/backgrounds/day${i}.png`);
      this.load.image(`body-day${i}`, `/assets/backgrounds/body-day${i}.png`);
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
      resizeTimer = setTimeout(() => this.scene.restart(this.getSceneState()), 100);
    });
  }

  renderScene() {
    const { width, height } = this.scale;
    const device = getDeviceType(width);

    const preferred = getChapterBackgroundKey('body', this.currentDay);
    createResponsiveBackground(this, this.textures.exists(preferred) ? preferred : `day${this.currentDay}`, { mobileFocalX: 0.62 });

    this.createTopPanel(width, height, device);
    this.createCharacter(width, height, device);
    this.createStoryPanel(width, height);
    this.createChoicePanel(width, height);
  }

  createTopPanel(width, height, device) {
    const isMobile = device === 'mobile';
    const panelWidth = isMobile ? width * 0.84 : width * 0.32;
    const panelHeight = isMobile ? 108 : 118;
    const panelX = isMobile ? width * 0.5 : width * 0.2;

    this.add.rectangle(panelX, height * 0.095, panelWidth, panelHeight, 0x102040, 0.52).setStrokeStyle(2, 0x81c784);
    this.add.text(panelX - panelWidth * 0.42, height * 0.05, 'STATUS MENTAL', {
      fontSize: getResponsiveFont(width, 20),
      color: '#ffffff',
      fontStyle: 'bold',
    });

    const barWidth = panelWidth * 0.86;
    const barHeight = isMobile ? 20 : 24;
    const safeMental = Phaser.Math.Clamp(this.mentalState, 0, 100);

    this.add.rectangle(panelX, height * 0.09, barWidth, barHeight, 0x1a2838, 0.9).setStrokeStyle(1, 0xb8e6bd, 0.5);

    const fillWidth = (safeMental / 100) * barWidth;
    const fillBar = this.add.rectangle(panelX - barWidth / 2 + fillWidth / 2, height * 0.09, fillWidth, barHeight, this.getMentalColor());
    this.tweens.add({ targets: fillBar, width: fillWidth, duration: 450, ease: 'Sine.easeOut' });

    this.add.text(panelX - panelWidth * 0.42, height * 0.12, `Netral | Anxiety ${100 - safeMental} | Shield ${this.mentalShield}%`, {
      fontSize: getResponsiveFont(width, 18),
      color: '#ffffff',
    });

    this.add.text(width * 0.82, height * 0.05, `Body Shaming\nHari ke-${this.currentDay}`, {
      fontSize: getResponsiveFont(width, 24),
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'right',
    });
  }

  createCharacter(width, height, device) {
    const isMobile = device === 'mobile';
    const ray = this.add.image(isMobile ? width * 0.22 : width * 0.1, isMobile ? height * 0.62 : height * 0.63, this.getCharacterExpression());
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
    this.add.rectangle(width * 0.6, height * 0.42, width * 0.58, height * 0.25, 0x102040, 0.88).setStrokeStyle(2, 0x81c784);
    this.add
      .text(width * 0.6, height * 0.42, this.getStoryText(), {
        fontSize: getResponsiveFont(width, 26),
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: width * 0.48 },
      })
      .setOrigin(0.5);
  }

  createChoicePanel(width, height) {
    this.getChoices().forEach((choice, index) => {
      const y = height * (0.7 + index * 0.09);
      const btn = this.add.rectangle(width * 0.6, y, width * 0.45, 55, 0x102040, 0.88).setStrokeStyle(2, 0x81c784).setInteractive();
      this.add
        .text(width * 0.6, y, choice.text, {
          fontSize: getResponsiveFont(width, 22),
          color: '#ffffff',
          align: 'center',
          wordWrap: { width: width * 0.4 },
        })
        .setOrigin(0.5);

      btn.on('pointerover', () => btn.setFillStyle(0x1b3a32));
      btn.on('pointerout', () => btn.setFillStyle(0x102040));
      btn.on('pointerdown', () => {
        getAudioManager(this.game).playSFX('sfx-choice');
        this.handleChoice(choice);
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
      1: 'Foto Ray diunggah ulang tanpa izin.\nKomentar tentang tubuhnya mulai bermunculan.',
      2: 'Ray mencoba tertawa, tapi setiap komentar terasa menempel di kepala.',
      3: 'Teman sekelas ikut membahas unggahan itu.\nRay merasa ingin menghilang dari sekolah.',
      4: 'Ray mulai membandingkan diri dengan orang lain dan takut bercermin.',
      5: 'Komentar baru muncul lagi.\nKali ini Ray hampir membalas semuanya dengan marah.',
      6: 'Seorang teman mengajak Ray bicara dan menawarkan dukungan.',
      7: 'Ray belajar bahwa tubuhnya bukan bahan lelucon.\nSekarang waktunya memilih langkah pemulihan.',
    };

    return stories[this.currentDay];
  }

  getChoices() {
    const choices = {
      1: [
        { text: 'Tutup komentar dan tarik napas', shield: 12, anxiety: 5 },
        { text: 'Terus membaca komentar', shield: -8, anxiety: -12 },
      ],
      2: [
        { text: 'Cerita ke teman yang dipercaya', shield: 16, anxiety: 6 },
        { text: 'Pura-pura baik-baik saja', shield: -6, anxiety: -10 },
      ],
      3: [
        { text: 'Minta bantuan wali kelas', shield: 18, anxiety: 8 },
        { text: 'Menghindari semua orang', shield: -10, anxiety: -12 },
      ],
      4: [
        { text: 'Tulis hal baik tentang diri sendiri', shield: 14, anxiety: 6 },
        { text: 'Membandingkan diri lagi', shield: -8, anxiety: -10 },
      ],
      5: [
        { text: 'Laporkan komentar menyakitkan', shield: 18, anxiety: 8 },
        { text: 'Balas dengan emosi', shield: -12, anxiety: -14 },
      ],
      6: [
        { text: 'Terima dukungan teman', shield: 20, anxiety: 10 },
        { text: 'Menolak bicara', shield: -8, anxiety: -8 },
      ],
      7: [{ text: 'Lihat hasil refleksi', shield: 0, anxiety: 0 }],
    };

    return choices[this.currentDay];
  }

  handleChoice(choice) {
    this.mentalShield = Phaser.Math.Clamp(this.mentalShield + choice.shield, 0, 100);
    this.mentalState = Phaser.Math.Clamp(this.mentalState + choice.anxiety, 0, 100);
    this.playerChoices.push(choice.text);

    if (this.currentDay < 7) {
      this.currentDay++;
      SaveManager.saveGame(this.slot || 2, {
        currentChapter: 2,
        currentDay: this.currentDay,
        mentalShield: this.mentalShield,
        mentalState: this.mentalState,
        playerChoices: this.playerChoices,
        storyMode: this.storyMode,
      });
      this.scene.restart(this.getSceneState());
      return;
    }

    if (this.storyMode === 'linear') {
      SaveManager.saveGame(this.slot || 2, {
        currentChapter: 3,
        currentDay: 1,
        mentalShield: 45,
        mentalState: 65,
        playerChoices: [],
        storyMode: 'linear',
      });
      this.scene.start('CyberGroomingScene', { storyMode: 'linear' });
      return;
    }

    this.scene.start('OutcomeResultScene', {
      ending: this.mentalShield >= this.mentalState ? 'Good' : 'Bad',
      chapter: 2,
      choices: this.playerChoices,
      mentalShield: this.mentalShield,
      anxiety: 100 - this.mentalState,
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
