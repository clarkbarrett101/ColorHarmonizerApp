function rybHueWheel(hue) {
  if (hue < 120) {
    return [255, (255 * hue) / 120, 0];
  } else if (hue < 180) {
    return [(255 * (hue - 120)) / 60, 255, 0];
  } else if (hue < 240) {
    return [0, (255 * (240 - hue)) / 60, (255 * (hue - 180)) / 60];
  } else if (hue < 300) {
    return [(128 * (300 - hue)) / 60, 0, 255];
  } else {
    return [128 + (128 * (360 - hue)) / 60, 0, (255 * (360 - hue)) / 60];
  }
}
function rgbHue2RybHue(hue) {
  if (hue < 120) {
    return hue * 2;
  } else if (hue < 180) {
    return 120 + (hue - 60);
  } else if (hue < 240) {
    return 180 + (hue - 120) / 2;
  } else {
    return hue;
  }
}
function rybHue2RgbHue(hue) {
  if (hue < 60) {
    return hue / 2;
  } else if (hue < 120) {
    return 60 + hue;
  } else if (hue < 180) {
    return 120 + (hue - 180) * 2;
  } else {
    return hue;
  }
}
for (let i = 0; i < 360; i += 10) {
  console.log(i, rybHueWheel(i));
}
