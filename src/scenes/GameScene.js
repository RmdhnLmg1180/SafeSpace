import Phaser from 'phaser';
import { SaveManager, getReflectionId } from '../utils/SaveManager';
import { getAudioManager } from '../utils/AudioManager';
import {
  createFittedText,
  createGlassPanel,
  createNeonButton,
  createResponsiveBackground,
  bindResponsiveScene,
  getDeviceType,
  getGameplayLayout,
  getResponsiveFont,
  getResponsiveFontSize,
  safeLoadImage,
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
    this.currentDay = data.currentDay ?? 1;
    this.mentalState = data.mentalState ?? 80;
    this.mentalShield = data.mentalShield ?? 40;
    this.playerChoices = [...(data.playerChoices || [])];
    this.storyMode = data.storyMode || 'single';
    this.slot = data.slot || (this.storyMode === 'linear' ? 'linear' : 1);
    this.flowResults = data.flowResults || {};
  }

  preload() {
    for (let i = 1; i <= 7; i++) {
      safeLoadImage(this, `day${i}`, `/assets/backgrounds/day${i}.png`);
    }

    safeLoadImage(this, 'ray-neutral', '/assets/characters/ray/neutral.png');
    safeLoadImage(this, 'ray-sad', '/assets/characters/ray/sad.png');
    safeLoadImage(this, 'ray-panic', '/assets/characters/ray/panic.png');
    safeLoadImage(this, 'ray-relief', '/assets/characters/ray/relief.png');
  }

  create() {
    getAudioManager(this.game).playMusic('music-story-theme');
    this.renderScene();
    bindResponsiveScene(this, () => this.getSceneState());
  }

  renderScene() {
    const { width, height } = this.scale;
    const device = getDeviceType(width);
    this.layout = getGameplayLayout(width, height, this.getChoices().length);

    createResponsiveBackground(this, getChapterBackgroundKey('cyber', this.currentDay), { mobileFocalX: 0.62 });
    this.createTopPanel(width, height, device);
    this.createCharacter(width, height, device);
    this.createStoryPanel(width, height, device);
    this.createChoicePanel(width, height, device);
  }

  createTopPanel(width, height, device) {
    const isMobile = device === 'mobile';
    const { status, title } = this.layout;
    const { x: panelX, y: panelY, w: panelWidth, h: panelHeight } = status;

    createGlassPanel(this, panelX, panelY, panelWidth, panelHeight, {
      fillColor: 0x0e1f3d,
      fillAlpha: 0.52,
      strokeColor: 0x66d9ff,
      highlightAlpha: 0.025,
    });

    createFittedText(
      this,
      panelX - panelWidth * 0.42,
      panelY - panelHeight * 0.3,
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
    const barY = panelY;

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
      panelY + panelHeight * 0.3,
      `Netral | Anxiety ${100 - safeMental} | Shield ${this.mentalShield}%`,
      {
        fontSize: getResponsiveFont(width, 18),
        color: '#ffffff',
      },
      { origin: [0, 0.5], maxWidth: panelWidth * 0.84, maxHeight: 28, minFontSize: 10 },
    );

    createFittedText(
      this,
      title.x,
      title.y,
      `Cyberbullying  •  Hari ke-${this.currentDay}`,
      {
        fontSize: getResponsiveFont(width, 30),
        color: '#ffffff',
        fontStyle: 'bold',
        align: 'center',
      },
      { maxWidth: title.w, maxHeight: title.h, minFontSize: 13 },
    );
  }

  createCharacter(width, height, device) {
    const expression = this.getCharacterExpression();
    const { character } = this.layout;
    const ray = this.add.image(character.x, character.y, expression).setDepth(8);
    ray.setScale(character.targetHeight / ray.height);

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
    const { x: panelX, y: panelY, w: panelWidth, h: panelHeight } = this.layout.story;

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
        minFontSize: isMobile ? 10 : 15,
      },
    );
  }

  createChoicePanel(width, height, device) {
    const choices = this.getChoices();
    const { x: buttonX, w: buttonWidth, h: buttonHeight, gap, bottom } = this.layout.choices;
    const startY = bottom - (choices.length * buttonHeight + (choices.length - 1) * gap) + buttonHeight / 2;

    choices.forEach((choice, index) => {
      const y = startY + (buttonHeight + gap) * index;

      createNeonButton(this, buttonX, y, buttonWidth, buttonHeight, choice, () => {
        getAudioManager(this.game).playSFX('sfx-choice');
        this.nextDay(index);
      }, {
        fontSize: getResponsiveFontSize(width, 20, { min: 13, mobileScale: 0.7 }),
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

      5: ['Melukai diri', 'Gunakan teknik grounding'],

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
          this.mentalState -= 25;
          this.mentalShield -= 10;
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
