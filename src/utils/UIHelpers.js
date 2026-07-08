import Phaser from 'phaser';

const BODY_BACKGROUNDS = new Set([1, 2, 4, 7]);
const GROOM_BACKGROUNDS = new Set([]);
const TEXT_RESOLUTION = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 2, 2);

export function getDeviceType(width) {
  if (width < 768) return 'mobile';
  if (width < 1200) return 'tablet';
  return 'desktop';
}

export function getResponsiveFont(width, desktopPx, options = {}) {
  return `${getResponsiveFontSize(width, desktopPx, options)}px`;
}

export function getResponsiveFontSize(width, desktopPx, options = {}) {
  const device = getDeviceType(width);
  const scale = device === 'mobile' ? options.mobileScale ?? 0.6 : device === 'tablet' ? options.tabletScale ?? 0.8 : options.desktopScale ?? 1;
  const min = options.min ?? 10;
  const max = options.max ?? desktopPx;
  return Phaser.Math.Clamp(Math.round(desktopPx * scale), min, max);
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

export function safeLoadImage(scene, key, path) {
  if (!scene.textures.exists(key)) scene.load.image(key, path);
}

export function safeLoadAudio(scene, key, path) {
  if (!scene.cache.audio.exists(key)) scene.load.audio(key, path);
}

export function cleanChoiceLabel(choice) {
  return String(choice ?? '').replace(new RegExp('\\s*\\(\\s*game\\s*over\\s*\\)\\s*', 'gi'), '').trim();
}

export function cleanChoiceList(choices = []) {
  return choices.map(cleanChoiceLabel).filter(Boolean);
}

export function createGlassPanel(scene, x, y, w, h, options = {}) {
  const fillColor = options.fillColor ?? 0x102040;
  const fillAlpha = options.fillAlpha ?? 0.86;
  const strokeColor = options.strokeColor ?? 0x4fc3f7;
  const strokeAlpha = options.strokeAlpha ?? 0.78;
  const strokeWidth = options.strokeWidth ?? 2;
  const highlightAlpha = options.highlightAlpha ?? 0.045;

  const panel = scene.add.rectangle(x, y, w, h, fillColor, fillAlpha).setStrokeStyle(strokeWidth, strokeColor, strokeAlpha);
  const highlight = scene.add.rectangle(x, y - h * 0.34, w * 0.86, Math.max(10, h * 0.12), 0xffffff, highlightAlpha);

  return { panel, highlight };
}

function parseFontSize(fontSize, fallback = 18) {
  if (typeof fontSize === 'number') return fontSize;
  if (typeof fontSize === 'string') {
    const parsed = Number.parseFloat(fontSize);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function setTextFontSize(text, size) {
  if (typeof text.setFontSize === 'function') {
    text.setFontSize(size);
  } else {
    text.setStyle({ fontSize: `${size}px` });
  }

  if (typeof text.updateText === 'function') {
    text.updateText();
  }
}

function applyTextResolution(text) {
  if (typeof text.setResolution === 'function') {
    text.setResolution(TEXT_RESOLUTION);
  } else if (text.style) {
    text.style.resolution = TEXT_RESOLUTION;
    if (typeof text.updateText === 'function') text.updateText();
  }
}

export function fitTextToBox(text, options = {}) {
  const maxWidth = options.maxWidth ?? text.width;
  const maxHeight = options.maxHeight ?? Number.POSITIVE_INFINITY;
  const minFontSize = options.minFontSize ?? 10;
  let fontSize = parseFontSize(text.style?.fontSize, options.startFontSize ?? 18);

  if (maxWidth && typeof text.setWordWrapWidth === 'function') {
    text.setWordWrapWidth(maxWidth, true);
  }

  while (fontSize > minFontSize && ((maxWidth && text.width > maxWidth) || (Number.isFinite(maxHeight) && text.height > maxHeight))) {
    fontSize -= 1;
    setTextFontSize(text, fontSize);
  }

  if (options.truncate && Number.isFinite(maxHeight) && text.height > maxHeight) {
    const words = String(text.text || '').split(/\s+/);
    while (words.length > 1 && text.height > maxHeight) {
      words.pop();
      text.setText(`${words.join(' ')}...`);
      if (typeof text.updateText === 'function') text.updateText();
    }
  }

  return text;
}

export function createFittedText(scene, x, y, content, style = {}, options = {}) {
  const maxWidth = options.maxWidth ?? style.wordWrap?.width;
  const maxHeight = options.maxHeight ?? Number.POSITIVE_INFINITY;
  const fontSize = parseFontSize(style.fontSize, options.startFontSize ?? 18);
  const text = scene.add.text(x, y, content, {
    ...style,
    fontSize: `${fontSize}px`,
    resolution: style.resolution ?? options.resolution ?? TEXT_RESOLUTION,
    wordWrap: maxWidth
      ? {
          ...(style.wordWrap ?? {}),
          width: maxWidth,
          useAdvancedWrap: true,
        }
      : style.wordWrap,
  });

  applyTextResolution(text);

  const origin = options.origin ?? 0.5;
  if (Array.isArray(origin)) {
    text.setOrigin(origin[0], origin[1]);
  } else {
    text.setOrigin(origin);
  }

  return fitTextToBox(text, {
    maxWidth,
    maxHeight,
    minFontSize: options.minFontSize,
    truncate: options.truncate,
    startFontSize: fontSize,
  });
}

export const addFitText = createFittedText;

export function createNeonButton(scene, x, y, w, h, label, callback, options = {}) {
  const strokeColor = options.strokeColor ?? 0x4fc3f7;
  const fillColor = options.fillColor ?? 0x102040;
  const hoverFillColor = options.hoverFillColor ?? 0x16325f;
  const disabled = options.disabled ?? false;
  const fillAlpha = disabled ? 0.48 : options.fillAlpha ?? 0.82;
  const textColor = disabled ? options.disabledTextColor ?? '#8fa6b8' : options.textColor ?? '#ffffff';
  const hoverTextColor = options.hoverTextColor ?? '#e7f8ff';

  const glow = scene.add.rectangle(x, y, w + 12, h + 12, strokeColor, disabled ? 0.02 : 0.06);
  const button = scene.add.rectangle(x, y, w, h, disabled ? 0x263849 : fillColor, fillAlpha).setStrokeStyle(2, strokeColor, disabled ? 0.32 : 0.78);
  const highlight = scene.add.rectangle(x, y - h * 0.23, w * 0.86, Math.max(8, h * 0.2), 0xffffff, disabled ? 0.02 : 0.045);

  if (!disabled) {
    button.setInteractive({ useHandCursor: true });
  }

  const text = createFittedText(
    scene,
    x,
    y,
    label,
    {
      fontSize: `${options.fontSize ?? Math.min(22, Math.max(14, Math.round(h * 0.36)))}px`,
      color: textColor,
      fontStyle: 'bold',
      align: 'center',
    },
    {
      maxWidth: w * 0.82,
      maxHeight: h * 0.72,
      minFontSize: options.minFontSize ?? 10,
    },
  );

  if (!disabled) {
    button.on('pointerover', () => {
      button.setFillStyle(hoverFillColor, fillAlpha);
      glow.setAlpha(0.15);
      text.setColor(hoverTextColor);
    });

    button.on('pointerout', () => {
      button.setFillStyle(fillColor, fillAlpha);
      glow.setAlpha(0.06);
      text.setColor(textColor);
    });

    button.on('pointerdown', () => {
      if (callback) callback();
    });
  } else {
    button.setAlpha(0.58);
    text.setAlpha(0.6);
  }

  return { button, label: text, glow, highlight };
}

export const createButton = createNeonButton;

export function createScrollableTextBox(scene, x, y, w, h, content, style = {}, options = {}) {
  const padding = options.padding ?? 20;
  const maxWidth = w - padding * 2;
  const text = scene.add.text(x - w / 2 + padding, y - h / 2 + padding, content, {
    ...style,
    resolution: style.resolution ?? options.resolution ?? TEXT_RESOLUTION,
    wordWrap: {
      ...(style.wordWrap ?? {}),
      width: maxWidth,
      useAdvancedWrap: true,
    },
  });
  applyTextResolution(text);

  const maskShape = scene.make.graphics({ x: 0, y: 0, add: false });
  maskShape.fillStyle(0xffffff);
  maskShape.fillRect(x - w / 2 + padding, y - h / 2 + padding, maxWidth, h - padding * 2);
  const mask = maskShape.createGeometryMask();
  text.setMask(mask);

  const zone = scene.add.zone(x, y, w, h).setInteractive();
  const maxScroll = Math.max(0, text.height - (h - padding * 2));
  let scrollY = 0;
  let dragging = false;
  let lastPointerY = 0;

  const track = scene.add.rectangle(x + w / 2 - padding * 0.55, y, 4, h - padding * 2, 0x88ddff, maxScroll > 0 ? 0.18 : 0);
  const thumbHeight = maxScroll > 0 ? Phaser.Math.Clamp(((h - padding * 2) / text.height) * (h - padding * 2), 28, h - padding * 2) : 0;
  const thumb = scene.add.rectangle(track.x, y - (h - padding * 2) / 2 + thumbHeight / 2, 4, thumbHeight, 0x8be9ff, maxScroll > 0 ? 0.65 : 0);

  const applyScroll = () => {
    text.y = y - h / 2 + padding - scrollY;
    if (maxScroll > 0) {
      const travel = h - padding * 2 - thumbHeight;
      thumb.y = y - (h - padding * 2) / 2 + thumbHeight / 2 + (scrollY / maxScroll) * travel;
    }
  };

  const scrollBy = (delta) => {
    if (maxScroll <= 0) return;
    scrollY = Phaser.Math.Clamp(scrollY + delta, 0, maxScroll);
    applyScroll();
  };

  const isInside = (pointer) => pointer.x >= x - w / 2 && pointer.x <= x + w / 2 && pointer.y >= y - h / 2 && pointer.y <= y + h / 2;

  const onWheel = (pointer, _gameObjects, _deltaX, deltaY) => {
    if (isInside(pointer)) scrollBy(deltaY * 0.6);
  };

  const onMove = (pointer) => {
    if (!dragging) return;
    scrollBy(lastPointerY - pointer.y);
    lastPointerY = pointer.y;
  };

  const stopDrag = () => {
    dragging = false;
  };

  zone.on('pointerdown', (pointer) => {
    dragging = true;
    lastPointerY = pointer.y;
  });
  scene.input.on('wheel', onWheel);
  scene.input.on('pointermove', onMove);
  scene.input.on('pointerup', stopDrag);
  scene.input.on('pointerupoutside', stopDrag);

  scene.events.once('shutdown', () => {
    scene.input.off('wheel', onWheel);
    scene.input.off('pointermove', onMove);
    scene.input.off('pointerup', stopDrag);
    scene.input.off('pointerupoutside', stopDrag);
  });

  return {
    text,
    zone,
    track,
    thumb,
    scrollBy,
    maxScroll,
  };
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
  if (chapterType === 'body' && BODY_BACKGROUNDS.has(day)) return `body-day${day}`;
  if (chapterType === 'groom' && GROOM_BACKGROUNDS.has(day)) return `groom-day${day}`;
  return `day${day}`;
}

export function getChapterBackgroundAsset(chapterType, day) {
  const key = getChapterBackgroundKey(chapterType, day);
  return {
    key,
    path: `/assets/backgrounds/${key}.png`,
  };
}
