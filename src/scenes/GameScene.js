import Phaser from 'phaser';
import { SaveManager, getReflectionId } from '../utils/SaveManager';
import { getAudioManager } from '../utils/AudioManager';
import {
  createFittedText,
  createGlassPanel,
  createNeonButton,
  createResponsiveBackground,
  getDeviceType,
  getResponsiveFont,
  getResponsiveFontSize,
  scaleCharacterByScreenHeight,
  getChapterBackgroundKey,
} from '../utils/UIHelpers';

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
    this.storyMode = data.storyMode || 'single';
    this.slot = data.slot || (this.storyMode === 'linear' ? 'linear' : 1);
    this.flowResults = data.flowResults || {};
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

    createGlassPanel(this, panelX, height * 0.095, panelWidth, panelHeight, {
      fillColor: 0x0e1f3d,
      fillAlpha: 0.52,
      strokeColor: 0x66d9ff,
      highlightAlpha: 0.025,
    });

    createFittedText(
      this,
      panelX - panelWidth * 0.42,
      height * 0.05,
      'STATUS MENTAL',
      {
        fontSize: getResponsiveFont(width, 20),
        color: '#e7f8ff',
        fontStyle: 'bold',
      },
      { origin: [0, 0.5], maxWidth: panelWidth * 0.82, maxHeight: 28, minFontSize: 11 },
    );

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

    createFittedText(
      this,
      panelX - panelWidth * 0.42,
      height * 0.12,
      `Netral | Anxiety ${100 - safeMental} | Shield ${this.mentalShield}%`,
      {
        fontSize: getResponsiveFont(width, 18),
        color: '#ffffff',
      },
      { origin: [0, 0.5], maxWidth: panelWidth * 0.84, maxHeight: 28, minFontSize: 10 },
    );

    createFittedText(
      this,
      isMobile ? width * 0.5 : width * 0.88,
      isMobile ? height * 0.19 : height * 0.05,
      `Hari ke-${this.currentDay}`,
      {
        fontSize: getResponsiveFont(width, 30),
        color: '#ffffff',
        fontStyle: 'bold',
        align: 'center',
      },
      { maxWidth: isMobile ? width * 0.45 : width * 0.22, maxHeight: 42, minFontSize: 14 },
    );
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

  createStoryPanel(width, height, device) {
    const isMobile = device === 'mobile';
    const panelX = isMobile ? width * 0.5 : width * 0.6;
    const panelY = isMobile ? height * 0.38 : height * 0.42;
    const panelWidth = isMobile ? width * 0.86 : width * 0.58;
    const panelHeight = isMobile ? height * 0.22 : height * 0.25;

    createGlassPanel(this, panelX, panelY, panelWidth, panelHeight, { strokeColor: 0x4fc3f7 });

    createFittedText(
      this,
      panelX,
      panelY,
      this.getStoryText(),
      {
        fontSize: getResponsiveFont(width, 26, { min: 16 }),
        color: '#ffffff',
        align: 'center',
        lineSpacing: isMobile ? 5 : 8,
      },
      {
        maxWidth: panelWidth * 0.84,
        maxHeight: panelHeight * 0.72,
        minFontSize: isMobile ? 12 : 15,
      },
    );
  }

  createChoicePanel(width, height, device) {
    const choices = this.getChoices();
    const isMobile = device === 'mobile';
    const buttonX = isMobile ? width * 0.5 : width * 0.6;
    const buttonWidth = isMobile ? width * 0.84 : width * 0.45;
    const buttonHeight = isMobile ? 50 : 55;
    const startY = isMobile ? height * 0.67 : height * 0.7;
    const gap = isMobile ? 0.095 : 0.09;

    choices.forEach((choice, index) => {
      const y = startY + height * gap * index;

      createNeonButton(this, buttonX, y, buttonWidth, buttonHeight, choice, () => {
        getAudioManager(this.game).playSFX('sfx-choice');
        this.nextDay(index);
      }, {
        fontSize: getResponsiveFontSize(width, 22, { min: 13 }),
        strokeColor: 0x4fc3f7,
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
    if (this.currentDay < 7) {
      this.playerChoices.push(selectedChoice);
    }

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
        this.completeStory();
        return;
    }

    this.currentDay++;
    SaveManager.saveGame(this.slot, {
      currentChapter: 1,
      currentDay: this.currentDay,
      mentalShield: this.mentalShield,
      mentalState: this.mentalState,
      playerChoices: this.playerChoices,
      storyMode: this.storyMode,
      flowResults: this.flowResults,
    });
    this.scene.restart({
      currentDay: this.currentDay,
      mentalShield: this.mentalShield,
      mentalState: this.mentalState,
      playerChoices: this.playerChoices,
      slot: this.slot,
      storyMode: this.storyMode,
      flowResults: this.flowResults,
    });
  }

  completeStory() {
    const result = this.buildStoryResult();

    if (this.storyMode === 'linear') {
      const flowResults = { ...this.flowResults, cyberbullying: result };
      SaveManager.saveGame(this.slot, {
        currentChapter: 2,
        currentDay: 1,
        mentalShield: 45,
        mentalState: 65,
        playerChoices: [],
        storyMode: 'linear',
        flowResults,
      });
      this.scene.start('BodyShamingScene', { storyMode: 'linear', slot: this.slot, flowResults });
      return;
    }

    SaveManager.deleteSave(this.slot);
    this.scene.start('ReflectionScene', {
      storyMode: 'single',
      chapter: 1,
      reflectionId: getReflectionId({ chapter: 1 }),
      choices: result.choices,
      mentalShield: result.mentalShield,
      anxiety: result.anxiety,
      storyResults: { cyberbullying: result },
    });
  }

  buildStoryResult() {
    return {
      chapter: 1,
      key: 'cyberbullying',
      title: 'Cyberbullying',
      choices: [...this.playerChoices],
      mentalShield: Phaser.Math.Clamp(this.mentalShield, 0, 100),
      mentalState: Phaser.Math.Clamp(this.mentalState, 0, 100),
      anxiety: Phaser.Math.Clamp(100 - this.mentalState, 0, 100),
    };
  }

  getSceneState() {
    return {
      currentDay: this.currentDay,
      mentalShield: this.mentalShield,
      mentalState: this.mentalState,
      playerChoices: this.playerChoices,
      slot: this.slot,
      storyMode: this.storyMode,
      flowResults: this.flowResults,
    };
  }
}
