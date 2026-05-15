import masterList from "./masterList.js";
import fs from "fs";

function calculateDiff(color, index) {
  if (index === 0) {
    return color[0] - color[1] - 2 * color[2];
  } else if (index === 1) {
    return color[0] + color[1] - color[2] - Math.abs(color[0] - color[1]) / 2;
  } else {
    return -2 * color[0] - color[1] / 2 + color[2];
  }
}
const clarColors = [];
masterList.map((item) => {
  const entry = {
    name: item.name,
    brand: item.brand,
    rgb: item.rgb,
    ryb: item.rgb
      .map((c) => c / 255)
      .map((c, i) => calculateDiff([c, c, c], i)),
    redder: null,
    yellower: null,
    bluer: null,
    blacker: null,
    whiter: null,
    grayer: null,
  };
  let [r, g, b] = item.rgb;
  r /= 255;
  g /= 255;
  b /= 255;
  let y = 0.299 * r + 0.587 * g + 0.114 * b;
  let u = -0.14713 * r - 0.28886 * g + 0.436 * b;
  let v = 0.615 * r - 0.51499 * g - 0.10001 * b;
  let c = Math.sqrt(u * u + v * v);
  let ar = Math.atan2(v, u);
  y = Math.round(y * 10000) / 10000;
  u = Math.round(u * 10000) / 10000;
  v = Math.round(v * 10000) / 10000;
  c = Math.round(c * 10000) / 10000;
  const l = y;
  if (ar < 0) {
    ar += 2 * Math.PI;
  }
  ar = Math.round(ar * 100000) / 100000;
  entry.yuv = [y, u, v];
  entry.clar = { c, l, ar };
  clarColors.push(entry);
});
