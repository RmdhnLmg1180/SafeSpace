// src/scenes/SettingsScene.js
import Phaser from 'phaser';
import { getAudioManager } from '../utils/AudioManager';
import { SaveManager } from '../utils/SaveManager';

export default class SettingsScene extends Phaser.Scene {
  constructor() {
    super('SettingsScene');
  }

  preload() {
    this.load.image('landingBg', '/assets/backgrounds/landing-bg.png');
  }

  create() {
    const { width, height } = this.scale;
    const isMobile = width < 768;
    const audio = getAudioManager(this.game);

    this.createBackground(width, height, isMobile);

    this.add
      .text(width / 2, height * 0.13, 'SETTINGS', {
        fontSize: isMobile ? '30px' : '46px',
        color: '#4FC3F7',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const panelWidth = isMobile ? width * 0.86 : 560;
    const panelHeight = isMobile ? height * 0.62 : 420;
    const panelX = width / 2;
    const panelY = height * 0.5;

    this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x102040, 0.88).setStrokeStyle(2, 0x4fc3f7);

    const startY = panelY - panelHeight * 0.3;
    this.createSlider(panelX, startY, panelWidth, 'MASTER', audio.settings.master, (value) => audio.setMasterVolume(value), isMobile);
    this.createSlider(panelX, startY + 72, panelWidth, 'MUSIC', audio.settings.music, (value) => audio.setMusicVolume(value), isMobile);
    this.createSlider(panelX, startY + 144, panelWidth, 'SFX', audio.settings.sfx, (value) => audio.setSFXVolume(value), isMobile);

    const muteBtn = this.createButton(panelX - panelWidth * 0.22, startY + 230, panelWidth * 0.34, 52, audio.settings.mute ? 'UNMUTE' : 'MUTE', () => {
      audio.setMute(!audio.settings.mute);
      muteBtn.label.setText(audio.settings.mute ? 'UNMUTE' : 'MUTE');
      audio.playSFX('sfx-click');
    });

    this.createButton(panelX + panelWidth * 0.22, startY + 230, panelWidth * 0.34, 52, 'FULLSCREEN', () => {
      audio.playSFX('sfx-click');
      if (this.scale.isFullscreen) this.scale.stopFullscreen();
      else this.scale.startFullscreen();
    });

    this.createButton(panelX, startY + 302, panelWidth * 0.48, 52, 'RESET SAVE', () => {
      audio.playSFX('sfx-back');
      SaveManager.resetAll();
      this.scene.start('MenuScene');
    }, 0xff5252);

    this.createButton(isMobile ? width / 2 : 120, isMobile ? height * 0.92 : height * 0.9, isMobile ? width * 0.46 : 160, 52, 'BACK', () => {
      audio.playSFX('sfx-back');
      this.scene.start('MenuScene');
    });
  }

  createBackground(width, height, isMobile) {
    const bg = this.add.image(width / 2, height / 2, 'landingBg');
    bg.setScale(Math.max(width / bg.width, height / bg.height));
    if (isMobile) bg.setX(width * 0.62);
    this.add.rectangle(width / 2, height / 2, width, height, 0x081426, 0.76);
  }

  createSlider(x, y, panelWidth, label, value, onChange, isMobile) {
    this.add.text(x - panelWidth * 0.38, y - 11, label, {
      fontSize: isMobile ? '16px' : '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    });

    const slider = this.add.dom(x + panelWidth * 0.12, y, 'input', `width:${Math.floor(panelWidth * 0.5)}px; accent-color:#4fc3f7;`, '').setOrigin(0.5);
    slider.node.type = 'range';
    slider.node.min = 0;
    slider.node.max = 1;
    slider.node.step = 0.01;
    slider.node.value = value;

    const valueText = this.add
      .text(x + panelWidth * 0.4, y - 11, `${Math.round(value * 100)}%`, {
        fontSize: isMobile ? '14px' : '18px',
        color: '#d9e9f2',
      })
      .setOrigin(0.5, 0);

    slider.node.oninput = (event) => {
      const nextValue = Number(event.target.value);
      valueText.setText(`${Math.round(nextValue * 100)}%`);
      onChange(nextValue);
    };
  }

  createButton(x, y, w, h, label, callback, strokeColor = 0x4fc3f7) {
    const glow = this.add.rectangle(x, y, w + 14, h + 14, strokeColor, 0.08);
    const btn = this.add.rectangle(x, y, w, h, 0x102040, 0.82).setStrokeStyle(2, strokeColor).setInteractive({ useHandCursor: true });
    this.add.rectangle(x, y - h * 0.22, w * 0.88, h * 0.22, 0xffffff, 0.05);
    const text = this.add
      .text(x, y, label, {
        fontSize: w < 180 ? '18px' : '20px',
        color: '#ffffff',
        fontStyle: 'bold',
        align: 'center',
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

    return { button: btn, label: text };
  }
}
