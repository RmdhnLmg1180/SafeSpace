import Phaser from 'phaser';
import PreloadScene from './scenes/PreloadScene';
import LandingScene from './scenes/LandingScene';
import IntroScene from './scenes/IntroScene';
import MenuScene from './scenes/MenuScene';
import GameScene from './scenes/GameScene';
import ChapterSelectionScene from './scenes/ChapterSelectionScene';
import SettingsScene from './scenes/SettingsScene';
import LoadGameScene from './scenes/LoadGameScene';
import AboutScene from './scenes/AboutScene';
import TutorialScene from './scenes/TutorialScene';
import BodyShamingScene from './scenes/BodyShamingScene';
import CyberGroomingScene from './scenes/CyberGroomingScene';
import ReflectionScene from './scenes/ReflectionScene';
import OutcomeResultScene from './scenes/OutcomeResultScene';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  resolution: Math.min(window.devicePixelRatio || 1, 3),
  render: {
    antialias: true,
    antialiasGL: true,
    pixelArt: false,
    roundPixels: true,
  },
  parent: 'app',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  dom: { createContainer: true },
  scene: [PreloadScene, LandingScene, IntroScene, MenuScene, GameScene, ChapterSelectionScene, SettingsScene, LoadGameScene, AboutScene, TutorialScene, BodyShamingScene, CyberGroomingScene, ReflectionScene, OutcomeResultScene],
  audio: {
    disableWebAudio: false,
  },
};

const game = new Phaser.Game(config);

// AudioManager singleton
import { getAudioManager } from './utils/AudioManager';
getAudioManager(game);
