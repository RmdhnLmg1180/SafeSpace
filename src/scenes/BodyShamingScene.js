// src/scenes/BodyShamingScene.js
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

export default class BodyShamingScene extends Phaser.Scene {
  constructor() {
    super('BodyShamingScene');
  }

  init(data = {}) {
    this.currentDay = data.currentDay ?? 1;
    this.mentalShield = data.mentalShield ?? 45;
    this.mentalState = data.mentalState ?? 65;
    this.playerChoices = [...(data.playerChoices || [])];
    this.storyMode = data.storyMode || 'single';
    this.slot = data.slot || (this.storyMode === 'linear' ? 'linear' : 2);
    this.flowResults = data.flowResults || {};
  }

  preload() {
    for (let i = 1; i <= 7; i++) {
      safeLoadImage(this, `day${i}`, `/assets/backgrounds/day${i}.png`);
      const asset = getChapterBackgroundAsset('body', i);
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

    createResponsiveBackground(this, getChapterBackgroundKey('body', this.currentDay), { mobileFocalX: 0.62 });

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
      strokeColor: 0x81c784,
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

    this.add.rectangle(panelX, panelY, barWidth, barHeight, 0x1a2838, 0.9).setStrokeStyle(1, 0xb8e6bd, 0.5);

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
      `Body Shaming  •  Hari ke-${this.currentDay}`,
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

    createGlassPanel(this, panelX, panelY, panelWidth, panelHeight, { strokeColor: 0x81c784 });
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
        strokeColor: 0x81c784,
        hoverFillColor: 0x1b3a32,
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
    if (this.currentDay < 7) {
      this.playerChoices.push(choice.text);
    }

    if (this.currentDay < 7) {
      this.currentDay++;
      SaveManager.saveGame(this.slot, {
        currentChapter: 2,
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
      const flowResults = { ...this.flowResults, bodyshaming: result };
      SaveManager.saveGame(this.slot, {
        currentChapter: 3,
        currentDay: 1,
        mentalShield: 45,
        mentalState: 65,
        playerChoices: [],
        storyMode: 'linear',
        flowResults,
      });
      this.scene.start('CyberGroomingScene', { storyMode: 'linear', slot: this.slot, flowResults });
      return;
    }

    SaveManager.deleteSave(this.slot);
    this.scene.start('ReflectionScene', {
      storyMode: 'single',
      chapter: 2,
      reflectionId: getReflectionId({ chapter: 2 }),
      choices: result.choices,
      mentalShield: result.mentalShield,
      anxiety: result.anxiety,
      storyResults: { bodyshaming: result },
    });
  }

  buildStoryResult() {
    return {
      chapter: 2,
      key: 'bodyshaming',
      title: 'Body Shaming',
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
