// src/scenes/CyberGroomingScene.js
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
  getChapterBackgroundAsset,
  getChapterBackgroundKey,
} from '../utils/UIHelpers';

export default class CyberGroomingScene extends Phaser.Scene {
  constructor() {
    super('CyberGroomingScene');
  }

  init(data = {}) {
    this.currentDay = data.currentDay ?? 1;
    this.mentalShield = data.mentalShield ?? 45;
    this.mentalState = data.mentalState ?? 65;
    this.playerChoices = [...(data.playerChoices || [])];
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
    bindResponsiveScene(this, () => this.getSceneState());
  }

  renderScene() {
    const { width, height } = this.scale;
    const device = getDeviceType(width);
    this.layout = getGameplayLayout(width, height, this.getChoices().length);

    createResponsiveBackground(this, getChapterBackgroundKey('groom', this.currentDay), { mobileFocalX: 0.62 });

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
      fillColor: 0x102040,
      fillAlpha: 0.52,
      strokeColor: 0xffb74d,
      highlightAlpha: 0.025,
    });
    createFittedText(
      this,
      panelX - panelWidth * 0.42,
      panelY - panelHeight * 0.3,
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

    this.add.rectangle(panelX, panelY, barWidth, barHeight, 0x1f1b11, 0.9).setStrokeStyle(1, 0xffd6a6, 0.5);

    const fillWidth = (safeMental / 100) * barWidth;
    const fillBar = this.add.rectangle(panelX - barWidth / 2 + fillWidth / 2, panelY, fillWidth, barHeight, this.getMentalColor());
    this.tweens.add({ targets: fillBar, width: fillWidth, duration: 450, ease: 'Sine.easeOut' });

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
      `Cyber Grooming  •  Hari ke-${this.currentDay}`,
      {
        fontSize: getResponsiveFont(width, 24),
        color: '#ffffff',
        fontStyle: 'bold',
        align: isMobile ? 'center' : 'right',
      },
      { maxWidth: title.w, maxHeight: title.h, minFontSize: 13 },
    );
  }

  createCharacter(width, height, device) {
    const { character } = this.layout;
    const ray = this.add.image(character.x, character.y, this.getCharacterExpression()).setDepth(8);
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
    const choices = this.getChoices();
    const { x: buttonX, w: buttonWidth, h: buttonHeight, gap, bottom } = this.layout.choices;
    const startY = bottom - (choices.length * buttonHeight + (choices.length - 1) * gap) + buttonHeight / 2;

    choices.forEach((choice, index) => {
      const y = startY + (buttonHeight + gap) * index;
      createNeonButton(this, buttonX, y, buttonWidth, buttonHeight, choice.text, () => {
        getAudioManager(this.game).playSFX('sfx-choice');
        this.handleChoice(choice);
      }, {
        fontSize: getResponsiveFontSize(width, 20, { min: 13, mobileScale: 0.7 }),
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
