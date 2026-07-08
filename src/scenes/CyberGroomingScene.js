// src/scenes/CyberGroomingScene.js
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
  safeLoadImage,
  scaleCharacterByScreenHeight,
  getChapterBackgroundAsset,
  getChapterBackgroundKey,
} from '../utils/UIHelpers';

export default class CyberGroomingScene extends Phaser.Scene {
  constructor() {
    super('CyberGroomingScene');
  }

  init(data = {}) {
    this.currentDay = data.currentDay || 1;
    this.mentalShield = data.mentalShield || 45;
    this.mentalState = data.mentalState || 65;
    this.playerChoices = data.playerChoices || [];
    this.storyMode = data.storyMode || 'single';
    this.slot = data.slot || (this.storyMode === 'linear' ? 'linear' : 3);
    this.flowResults = data.flowResults || {};
  }

  preload() {
    for (let i = 1; i <= 7; i++) {
      safeLoadImage(this, `day${i}`, `/assets/backgrounds/day${i}.png`);
      const asset = getChapterBackgroundAsset('groom', i);
      if (asset.key !== `day${i}`) safeLoadImage(this, asset.key, asset.path);
    }

    safeLoadImage(this, 'ray-neutral', '/assets/characters/ray/neutral.png');
    safeLoadImage(this, 'ray-sad', '/assets/characters/ray/sad.png');
    safeLoadImage(this, 'ray-panic', '/assets/characters/ray/panic.png');
    safeLoadImage(this, 'ray-relief', '/assets/characters/ray/relief.png');
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

    createResponsiveBackground(this, getChapterBackgroundKey('groom', this.currentDay), { mobileFocalX: 0.62 });

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
      fillColor: 0x102040,
      fillAlpha: 0.52,
      strokeColor: 0xffb74d,
      highlightAlpha: 0.025,
    });
    createFittedText(
      this,
      panelX - panelWidth * 0.42,
      height * 0.05,
      'STATUS MENTAL',
      {
        fontSize: getResponsiveFont(width, 20),
        color: '#ffffff',
        fontStyle: 'bold',
      },
      { origin: [0, 0.5], maxWidth: panelWidth * 0.82, maxHeight: 28, minFontSize: 11 },
    );

    const barWidth = panelWidth * 0.86;
    const barHeight = isMobile ? 20 : 24;
    const safeMental = Phaser.Math.Clamp(this.mentalState, 0, 100);

    this.add.rectangle(panelX, height * 0.09, barWidth, barHeight, 0x1f1b11, 0.9).setStrokeStyle(1, 0xffd6a6, 0.5);

    const fillWidth = (safeMental / 100) * barWidth;
    const fillBar = this.add.rectangle(panelX - barWidth / 2 + fillWidth / 2, height * 0.09, fillWidth, barHeight, this.getMentalColor());
    this.tweens.add({ targets: fillBar, width: fillWidth, duration: 450, ease: 'Sine.easeOut' });

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
      isMobile ? width * 0.5 : width * 0.82,
      isMobile ? height * 0.19 : height * 0.05,
      `Cyber Grooming\nHari ke-${this.currentDay}`,
      {
        fontSize: getResponsiveFont(width, 24),
        color: '#ffffff',
        fontStyle: 'bold',
        align: isMobile ? 'center' : 'right',
      },
      { maxWidth: isMobile ? width * 0.62 : width * 0.28, maxHeight: 58, minFontSize: 13 },
    );
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

  createStoryPanel(width, height, device) {
    const isMobile = device === 'mobile';
    const panelX = isMobile ? width * 0.5 : width * 0.6;
    const panelY = isMobile ? height * 0.38 : height * 0.42;
    const panelWidth = isMobile ? width * 0.86 : width * 0.58;
    const panelHeight = isMobile ? height * 0.28 : height * 0.25;

    createGlassPanel(this, panelX, panelY, panelWidth, panelHeight, { strokeColor: 0xffb74d });
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
    const isMobile = device === 'mobile';
    const buttonX = isMobile ? width * 0.5 : width * 0.6;
    const buttonWidth = isMobile ? width * 0.84 : width * 0.45;
    const buttonHeight = isMobile ? 50 : 55;
    const startY = isMobile ? height * 0.67 : height * 0.7;
    const gap = isMobile ? 0.095 : 0.09;

    this.getChoices().forEach((choice, index) => {
      const y = startY + height * gap * index;
      createNeonButton(this, buttonX, y, buttonWidth, buttonHeight, choice.text, () => {
        getAudioManager(this.game).playSFX('sfx-choice');
        this.handleChoice(choice);
      }, {
        fontSize: getResponsiveFontSize(width, 18, { min: 10 }),
        strokeColor: 0xffb74d,
        hoverFillColor: 0x3f2b18,
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
      1: 'Ray mendapat pesan dari akun baru yang terasa sangat ramah.',
      2: 'Akun itu mulai memberi pujian dan meminta Ray merahasiakan obrolan mereka.',
      3: 'Ray merasa diperhatikan, tapi beberapa permintaan mulai terasa tidak nyaman.',
      4: 'Akun itu meminta foto pribadi dan bilang Ray akan mengecewakannya jika menolak.',
      5: 'Ray bingung antara takut, bersalah, dan ingin dipercaya.',
      6: 'Ray melihat kembali tanda bahaya dan mempertimbangkan meminta bantuan.',
      7: 'Ray punya kesempatan memutus kontak dan melindungi diri.',
    };

    return stories[this.currentDay];
  }

  getChoices() {
    const choices = {
      1: [
        { text: 'Jaga jarak dan cek profilnya', shield: 12, anxiety: 5 },
        { text: 'Langsung percaya', shield: -8, anxiety: -10 },
      ],
      2: [
        { text: 'Tolak merahasiakan obrolan', shield: 14, anxiety: 6 },
        { text: 'Ikuti saja agar tidak canggung', shield: -8, anxiety: -10 },
      ],
      3: [
        { text: 'Simpan bukti pesan', shield: 16, anxiety: 6 },
        { text: 'Hapus pesan karena takut', shield: -8, anxiety: -12 },
      ],
      4: [
        { text: 'Blokir dan laporkan akun', shield: 20, anxiety: 10 },
        { text: 'Mengirim foto karena tertekan', shield: -20, anxiety: -18 },
      ],
      5: [
        { text: 'Bicara dengan orang dewasa tepercaya', shield: 20, anxiety: 10 },
        { text: 'Menyimpan semuanya sendiri', shield: -10, anxiety: -12 },
      ],
      6: [
        { text: 'Minta bantuan melapor', shield: 18, anxiety: 8 },
        { text: 'Membuka blokir akun itu lagi', shield: -14, anxiety: -14 },
      ],
      7: [{ text: 'Lihat hasil refleksi', shield: 0, anxiety: 0 }],
    };

    return choices[this.currentDay];
  }

  handleChoice(choice) {
    this.mentalShield = Phaser.Math.Clamp(this.mentalShield + choice.shield, 0, 100);
    this.mentalState = Phaser.Math.Clamp(this.mentalState + choice.anxiety, 0, 100);
    if (this.currentDay < 7) {
      this.playerChoices.push(choice.text);
    }

    if (this.currentDay < 7) {
      this.currentDay++;
      SaveManager.saveGame(this.slot, {
        currentChapter: 3,
        currentDay: this.currentDay,
        mentalShield: this.mentalShield,
        mentalState: this.mentalState,
        playerChoices: this.playerChoices,
        storyMode: this.storyMode,
        flowResults: this.flowResults,
      });
      this.scene.restart(this.getSceneState());
      return;
    }

    this.completeStory();
  }

  completeStory() {
    const result = this.buildStoryResult();

    if (this.storyMode === 'linear') {
      const storyResults = { ...this.flowResults, cybergrooming: result };
      const combined = this.buildCombinedReflection(storyResults);
      SaveManager.deleteSave(this.slot);
      this.scene.start('ReflectionScene', combined);
      return;
    }

    SaveManager.deleteSave(this.slot);
    this.scene.start('ReflectionScene', {
      storyMode: 'single',
      chapter: 3,
      reflectionId: getReflectionId({ chapter: 3 }),
      choices: result.choices,
      mentalShield: result.mentalShield,
      anxiety: result.anxiety,
      storyResults: { cybergrooming: result },
    });
  }

  buildStoryResult() {
    return {
      chapter: 3,
      key: 'cybergrooming',
      title: 'Cyber Grooming',
      choices: [...this.playerChoices],
      mentalShield: Phaser.Math.Clamp(this.mentalShield, 0, 100),
      mentalState: Phaser.Math.Clamp(this.mentalState, 0, 100),
      anxiety: Phaser.Math.Clamp(100 - this.mentalState, 0, 100),
    };
  }

  buildCombinedReflection(storyResults) {
    const results = Object.values(storyResults);
    const divisor = Math.max(results.length, 1);
    const choices = results.flatMap((result) => result.choices);
    const mentalShield = Math.round(results.reduce((total, result) => total + result.mentalShield, 0) / divisor);
    const anxiety = Math.round(results.reduce((total, result) => total + result.anxiety, 0) / divisor);

    return {
      storyMode: 'linear',
      chapter: 'linear',
      reflectionId: getReflectionId({ storyMode: 'linear' }),
      choices,
      mentalShield,
      anxiety,
      storyResults,
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
