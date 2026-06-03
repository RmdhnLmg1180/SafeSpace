import Phaser from 'phaser';

export function getDeviceType(width) {
  if (width < 768) return 'mobile';
  if (width < 1200) return 'tablet';
  return 'desktop';
}

export function getResponsiveFont(width, desktopPx) {
  const device = getDeviceType(width);
  const scale = device === 'mobile' ? 0.6 : device === 'tablet' ? 0.8 : 1;
  return `${Math.round(desktopPx * scale)}px`;
}

export function createResponsiveBackground(scene, textureKey, options = {}) {
  const { width, height } = scene.scale;
  const device = getDeviceType(width);
  const mobileFocalX = options.mobileFocalX ?? 0.62;
  const overlayAlpha = options.overlayAlpha ?? 0.55;
  const overlayColor = options.overlayColor ?? 0x081426;

  const bg = scene.add.image(width / 2, height / 2, textureKey);
  const scale = Math.max(width / bg.width, height / bg.height);
  bg.setScale(scale);

  if (device === 'mobile') {
    bg.setX(width * mobileFocalX);
  }

  scene.add.rectangle(width / 2, height / 2, width, height, overlayColor, overlayAlpha);
  return bg;
}

export function setResponsiveLogoDisplaySize(scene, logo, options = {}) {
  const { width, height } = scene.scale;
  const device = getDeviceType(width);
  const source = logo.texture.getSourceImage();
  const ratio = source.width / source.height;

  const desktopWidth = options.desktopWidth ?? width * 0.2;
  const tabletWidth = options.tabletWidth ?? width * 0.24;
  const mobileWidth = options.mobileWidth ?? width * 0.28;

  const targetWidth = device === 'mobile' ? mobileWidth : device === 'tablet' ? tabletWidth : desktopWidth;
  const targetHeight = targetWidth / ratio;

  logo.setDisplaySize(targetWidth, targetHeight);

  if (device === 'mobile') {
    logo.setPosition(width * 0.5, options.mobileY ?? height * 0.1);
  } else {
    logo.setPosition(options.desktopX ?? width * 0.16, options.desktopY ?? height * 0.12);
  }
}

export function scaleCharacterByScreenHeight(scene, character, options = {}) {
  const { width, height } = scene.scale;
  const device = getDeviceType(width);

  const desktopPercent = options.desktopPercent ?? 0.5;
  const tabletPercent = options.tabletPercent ?? 0.38;
  const mobilePercent = options.mobilePercent ?? 0.25;

  const targetPercent = device === 'mobile' ? mobilePercent : device === 'tablet' ? tabletPercent : desktopPercent;
  character.setScale((height * targetPercent) / character.height);

  return device;
}

export function getChapterBackgroundKey(chapterType, day) {
  if (chapterType === 'body') return `body-day${day}`;
  if (chapterType === 'groom') return `groom-day${day}`;
  return `day${day}`;
}
