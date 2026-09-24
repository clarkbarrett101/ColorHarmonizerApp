function hexToRgb(hex) {
  const bigint = parseInt(hex.replace("#", ""), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}
function rgbToHex([r, g, b]) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
import colorsList from "./src/clarColors3.json" with { type: "json" };
import newList from "./colors.json" with { type: "json" };

import fs from "fs";
for (let i = 0; i < newList.length; i++) {
  const foundItem = colorsList.find((item) => item.name === newList[i].name);
  if (foundItem) {
    let rgb = newList[i].color
      .replace("rgb(", "")
      .replace(")", "")
      .split(",")
      .map(Number);
    foundItem.rgb = rgb;
    foundItem.yuv = fRGBToYUV(rgb);
    foundItem.clar = fRGBToCLARColor(rgb, "RYGB");
    foundItem.hex = rgbToHex(rgb);
    if (!foundItem.brand) foundItem.brand = "Benjamin Moore";
    console.log(`Updated item in colorsList: ${newList[i].name}`);
  } else {
    console.log(`Item not found in colorsList: ${newList[i].name}`);
    let rgb = newList[i].color
      .replace("rgb(", "")
      .replace(")", "")
      .split(",")
      .map(Number);
    colorsList.push({
      name: newList[i].name,
      brand: "Benjamin Moore",
      rgb: rgb,
      yuv: fRGBToYUV(rgb),
      clar: fRGBToCLARColor(rgb, "RYGB"),
      hex: rgbToHex(rgb),
      label: newList[i].code,
    });
  }
}

colorsList.sort(
  (a, b) =>
    (a.clar.ar - b.clar.ar) * 100 +
    (a.clar.l - b.clar.l) * 10 +
    (a.clar.c - b.clar.c),
);

asJson(colorsList);

function asJson(colors) {
  const jsonString = JSON.stringify(colors, null, 2);
  fs.writeFile(`./src/clarColors3.json`, jsonString, "utf8", (err) => {
    if (err) {
      console.error("Error writing file:", err);
    } else {
      console.log(`File clarColors3.json has been written successfully.`);
    }
  });
}
function asCSV(colors) {
  const csvLines = colors.map((item) => {
    const [r, g, b] = item.rgb;
    const [y, u, v] = item.yuv;
    const { c, l, ar } = item.clar;
    return `${item.name},${item.brand},${item.hex},${r},${g},${b},${y},${u},${v},${c},${l},${ar}`;
  });
  const csvContent =
    "name,brand,hex,r,g,b,y,u,v,c,l,ar\n" + csvLines.join("\n");
  fs.writeFile(`./src/ts/colors.csv`, csvContent, "utf8", (err) => {
    if (err) {
      console.error("Error writing file:", err);
    } else {
      console.log(`File colors.csv has been written successfully.`);
    }
  });
}

export function fRGBToYUV(rgb) {
  "worklet";
  const [r, g, b] = rgb.map((c) => c / 255);
  const y = Math.round((0.299 * r + 0.587 * g + 0.114 * b) * 10000) / 10000;
  const u =
    Math.round((-0.14713 * r - 0.28886 * g + 0.436 * b) * 10000) / 10000;
  const v = Math.round((0.615 * r - 0.51499 * g - 0.10001 * b) * 10000) / 10000;
  return [y, u, v];
}
export function fYUVToRGB(yuv) {
  "worklet";
  const [y, u, v] = yuv;
  const r = Math.round(Math.min(Math.max(0, y + 1.13983 * v), 1) * 255);
  const g = Math.round(
    Math.min(Math.max(0, y - 0.39465 * u - 0.5806 * v), 1) * 255,
  );
  const b = Math.round(Math.min(Math.max(0, y + 2.03211 * u), 1) * 255);
  return [r, g, b];
}
function fLerp(a, b, t) {
  "worklet";
  return a + (b - a) * t;
}

function fRemapRange(t, inputRange, outputRange) {
  "worklet";
  for (let i = 0; i < inputRange.length - 1; i++) {
    if (t >= inputRange[i] && t <= inputRange[i + 1]) {
      const inputStart = inputRange[i];
      const inputEnd = inputRange[i + 1];
      const outputStart = outputRange[i];
      const outputEnd = outputRange[i + 1];
      const normalizedT = (t - inputStart) / (inputEnd - inputStart);
      const output = fLerp(outputStart, outputEnd, normalizedT);
      return output;
    }
  }
  return outputRange[outputRange.length - 1];
}

export function FromRGBangle(ar, colorModel) {
  "worklet";
  ar = ar / (Math.PI * 2);
  ar = ar % 1;
  if (ar < 0) ar += 1;
  ar -= 2 / 7;
  if (ar < 0) ar += 1;
  switch (colorModel) {
    case "RGB":
      break;
    case "RYB":
      ar = fRemapRange(ar, modelRanges["RGB"], modelRanges["RYB"]);
      break;
    case "RYGB":
      ar = ar ** (1 / 1.35);
  }
  ar = ar * (Math.PI * 2);
  ar = Math.round(ar * 100) / 100;
  return ar;
}

export function ToRGBangle(ar, colorModel) {
  "worklet";
  ar = ar / (Math.PI * 2);
  ar = ar % 1;
  if (ar < 0) ar += 1;
  switch (colorModel) {
    case "RGB":
      break;
    case "RYB":
      ar = fRemapRange(ar, modelRanges["RYB"], modelRanges["RGB"]);
      break;
    case "RYGB":
      ar = ar ** 1.35;
      break;
  }
  ar += 2 / 7;
  if (ar > 1) ar -= 1;
  ar = ar * Math.PI * 2;
  ar = Math.round(ar * 100) / 100;
  return ar;
}

export function fCLARColorToYUV(color, colorModel) {
  "worklet";
  let { c, l, ar } = color;
  c = 2 ** c - 1;
  l = 2 ** l - 1;
  ar = ToRGBangle(ar, colorModel);
  const u = Math.cos(ar) * 0.5 * c;
  const v = Math.sin(ar) * 0.5 * c;
  const y = l;
  return [y, u, v];
}

export function fYUVToCLARColor(yuv, colorModel) {
  "worklet";
  const [y, u, v] = yuv;
  let c = Math.sqrt(u * u + v * v) * 2;
  c = Math.log2(c + 1);
  c = Math.round(c * 100) / 100;
  let l = Math.log2(y + 1);
  l = Math.round(l * 100) / 100;
  let ar = Math.atan2(v, u);
  ar = FromRGBangle(ar, colorModel);
  return { c, l, ar };
}

export function fRGBToCLARColor(rgb, colorModel) {
  "worklet";
  return fYUVToCLARColor(fRGBToYUV(rgb), colorModel);
}

export function fCLARColorToRGB(color, colorModel) {
  "worklet";
  const [y, u, v] = fCLARColorToYUV(color, colorModel);
  const r = Math.round(Math.min(Math.max(0, y + 1.13983 * v), 1) * 255);
  const g = Math.round(
    Math.min(Math.max(0, y - 0.39465 * u - 0.5806 * v), 1) * 255,
  );
  const b = Math.round(Math.min(Math.max(0, y + 2.03211 * u), 1) * 255);
  return [r, g, b];
}
