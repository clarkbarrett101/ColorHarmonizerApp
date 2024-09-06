function rybHue2RgbHue(rybHue) {
  let hue = rybHue;
  if (hue < 60) {
    hue *= 2;
  } else if (hue < 120) {
    hue += 60;
  } else if (hue < 180) {
    hue = 120 + (hue - 60) / 2;
  }
  return hue;
}
function rgbHue2RybHue(rgbHue) {
  let hue = rgbHue;
  if (hue < 120) {
    return hue / 2;
  } else if (hue < 180) {
    return 60 + hue - 120;
  } else if (hue < 240) {
    return 120 + (hue - 180) * 2;
  } else {
    return hue;
  }
}
for (let i = 0; i < 360; i += 10) {
  console.log(i, rybHue2RgbHue(i), rgbHue2RybHue(i));
}
