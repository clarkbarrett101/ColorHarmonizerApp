import React from "react";
import { Dimensions } from "react-native";

const clarColorsList: tPaint[] = require("../clarColors3.json");
export function fGetRandomPaint(): tPaint {
  const randomIndex = Math.floor(Math.random() * clarColorsList.length);
  const paint = clarColorsList[randomIndex];
  return paint;
}

export type tColorModel = "RGB" | "RYB" | "RYGB";
export const modelRanges: {
  [key in tColorModel]: [number, number, number, number, number];
} = {
  RGB: [0, 0.167, 0.333, 0.667, 1],
  RYB: [0, 0.333, 0.5, 0.667, 1],
  RYGB: [0, 0.25, 0.5, 0.75, 1],
};

export type tPalette = {
  name: string;
  paints: tPaint[];
};

export function fGetRandomPalette(size: number): tPalette {
  const paints = [];
  for (let i = 0; i < size; i++) {
    paints.push(fGetRandomPaint());
  }
  paints.sort((a, b) => a.clar.l - b.clar.l);
  return { name: `Random Palette ${Math.floor(Math.random() * 1000)}`, paints };
}
export type MixingColors =
  | "red"
  | "yellow"
  | "blue"
  | "white"
  | "grey"
  | "black";
export type tBrand =
  | "Behr"
  | "Benjamin Moore"
  | "Sherwin Williams"
  | "PPG"
  | "Valspar"
  | "Pantone"
  | "All Brands";

export type tCLARColor = {
  c: number;
  l: number;
  ar: number;
};

const CLArRed: tCLARColor = { ar: 0, c: 1, l: 0.3 };
const CLArYellow: tCLARColor = { ar: 11 / 7, c: 0.9, l: 0.9 };
const CLArBlue: tCLARColor = { ar: 33 / 7, c: 0.7, l: 0.1 };
const CLArWhite: tCLARColor = { c: 0, l: 1, ar: 0 };
const CLArGrey: tCLARColor = { c: 0, l: 0.5, ar: 0 };
const CLArBlack: tCLARColor = { c: 0, l: 0, ar: 0 };
const CLArSpring: tCLARColor = { ar: 11 / 7, c: 0.9, l: 0.9 };
const CLArSummer: tCLARColor = { ar: 35 / 7, c: 0.2, l: 0.9 };
const CLArAutumn: tCLARColor = { ar: 8 / 7, c: 0.2, l: 0.2 };
const CLArWinter: tCLARColor = { ar: 33 / 7, c: 0.8, l: 0.2 };

export type tColorMap<type> = Record<MixingColors, type>;

export const refColors: tColorMap<tCLARColor> = {
  red: CLArRed,
  yellow: CLArYellow,
  blue: CLArBlue,
  white: CLArWhite,
  grey: CLArGrey,
  black: CLArBlack,
};

export function fRGBToYUV(
  rgb: [number, number, number],
): [number, number, number] {
  "worklet";
  const [r, g, b] = rgb.map((c) => c / 255);
  const y = Math.round((0.299 * r + 0.587 * g + 0.114 * b) * 10000) / 10000;
  const u =
    Math.round((-0.14713 * r - 0.28886 * g + 0.436 * b) * 10000) / 10000;
  const v = Math.round((0.615 * r - 0.51499 * g - 0.10001 * b) * 10000) / 10000;
  return [y, u, v];
}
export function fYUVToRGB(
  yuv: [number, number, number],
): [number, number, number] {
  "worklet";
  const [y, u, v] = yuv;
  const r = Math.round(Math.min(Math.max(0, y + 1.13983 * v), 1) * 255);
  const g = Math.round(
    Math.min(Math.max(0, y - 0.39465 * u - 0.5806 * v), 1) * 255,
  );
  const b = Math.round(Math.min(Math.max(0, y + 2.03211 * u), 1) * 255);
  return [r, g, b];
}

function fLerp(a: number, b: number, t: number): number {
  "worklet";
  return a + (b - a) * t;
}

function fRemapRange(
  t: number,
  inputRange: number[],
  outputRange: number[],
): number {
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

export function FromRGBangle(ar: number, colorModel: tColorModel): number {
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

export function ToRGBangle(ar: number, colorModel: tColorModel): number {
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

export function fCLARColorToYUV(
  color: tCLARColor,
  colorModel: tColorModel,
): [number, number, number] {
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

export function fYUVToCLARColor(
  yuv: [number, number, number],
  colorModel: tColorModel,
): tCLARColor {
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

export function fRGBToCLARColor(
  rgb: [number, number, number],
  colorModel: tColorModel,
): tCLARColor {
  "worklet";
  return fYUVToCLARColor(fRGBToYUV(rgb), colorModel);
}

export function fCLARColorToRGB(
  color: tCLARColor,
  colorModel: tColorModel,
): [number, number, number] {
  "worklet";
  const [y, u, v] = fCLARColorToYUV(color, colorModel);
  const r = Math.round(Math.min(Math.max(0, y + 1.13983 * v), 1) * 255);
  const g = Math.round(
    Math.min(Math.max(0, y - 0.39465 * u - 0.5806 * v), 1) * 255,
  );
  const b = Math.round(Math.min(Math.max(0, y + 2.03211 * u), 1) * 255);
  return [r, g, b];
}
export function fCLARColorToString(
  color: tCLARColor,
  colorModel: tColorModel,
): string {
  "worklet";
  const [r, g, b] = fCLARColorToRGB(color, colorModel);
  const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b)
    .toString(16)
    .slice(1)
    .toUpperCase()}`;
  return hex;
}

export function fColorLerp(
  colorA: tCLARColor,
  colorB: tCLARColor,
  t: number,
  minMaxC: [number, number] = [0.1, 0.9],
): tCLARColor {
  "worklet";
  const c = Math.min(colorA.c + (colorB.c - colorA.c) * t, minMaxC[1]);
  const l = Math.max(
    Math.min(colorA.l + (colorB.l - colorA.l) * t, minMaxC[1]),
    minMaxC[0],
  );

  const diff = Math.atan2(
    Math.sin(colorB.ar - colorA.ar),
    Math.cos(colorB.ar - colorA.ar),
  );
  const ar = Math.atan2(
    Math.sin(colorA.ar + diff * t),
    Math.cos(colorA.ar + diff * t),
  );
  return { c, l, ar };
}
function fArrayLerp(argA: number[], argB: number[], t: number): number[] {
  return argA.map((val, index) => val + (argB[index] - val) * t);
}
const refYUV = {
  red: fCLARColorToYUV(refColors.red, "RYGB"),
  yellow: fCLARColorToYUV(refColors.yellow, "RYGB"),
  blue: fCLARColorToYUV(refColors.blue, "RYGB"),
  white: fCLARColorToYUV(refColors.white, "RYGB"),
  black: fCLARColorToYUV(refColors.black, "RYGB"),
  grey: fCLARColorToYUV(refColors.grey, "RYGB"),
};
export type tPaint = {
  name: string;
  brand: tBrand;
  rgb: [number, number, number];
  ryb: [number, number, number];
  hsluv: [number, number, number];
  clar: tCLARColor;
  hex: string;
  yuv: [number, number, number];
  label: string;
  index?: number;
};

export const fRandomPaints = (count: number) => {
  const paints = [];
  for (let i = 0; i < count; i++) {
    const color = {
      c: Math.random(),
      l: Math.random(),
      ar: (Math.random() * 44) / 7,
    };
    const randomPaint: tPaint = {
      name: "Random Paint",
      brand: "Behr",
      rgb: [0, 0, 0],
      ryb: [0, 0, 0],
      hsluv: [0, 0, 0],
      clar: color,
      hex: fCLARColorToString(color, "RYGB"),
      yuv: [0, 0, 0],
      label: "Random Paint",
      index: i,
    };
    paints.push(randomPaint);
  }
  return paints;
};

type tPaintRank = {
  index: number;
  brand?: tBrand;
  distance: number;
};

export function findColors(
  { c = 0.5, l = 0.5, ar = 0 }: tCLARColor,
  targetNumber = 3,
  brand: tBrand = "All Brands",
  colorModel: tColorModel = "RYGB",
) {
  console.log("Finding colors for", {
    c,
    l,
    ar,
    targetNumber,
    brand,
    colorModel,
  });
  const [y, u, v] = fCLARColorToYUV({ c, l, ar }, colorModel);
  let paintRanks: tPaintRank[] = [];
  for (let i = 0; i < clarColorsList.length; i++) {
    const paintColor = clarColorsList[i];
    if (brand !== "All Brands" && paintColor.brand !== brand) {
      continue;
    }
    if (
      paintColor.clar.c === c &&
      paintColor.clar.l === l &&
      paintColor.clar.ar === ar
    ) {
      continue;
    }
    const [py, pu, pv] = fRGBToYUV(paintColor.rgb);
    const dy = py - y;
    const du = pu - u;
    const dv = pv - v;
    let distance = Math.sqrt(dy * dy + du * du + dv * dv);

    paintRanks.push({
      index: i,
      brand: paintColor.brand,
      distance,
    });
  }
  paintRanks.sort((a, b) => a.distance - b.distance);
  if (targetNumber > 0) {
    if (brand == "All Brands") {
      paintRanks = paintRanks.slice(0, 100);
      let brandCounts: Record<string, number> = {};
      for (let j = 0; j < paintRanks.length; j++) {
        const rank = paintRanks[j];

        if (rank.brand in brandCounts) {
          brandCounts[rank.brand]++;
        } else {
          brandCounts[rank.brand] = 1;
        }
        rank.distance *= brandCounts[rank.brand];
      }
      paintRanks.sort((a, b) => a.distance - b.distance);
    }

    paintRanks = paintRanks.slice(0, targetNumber);
  }
  return paintRanks;
}
export type tColorSearchParams = {
  label?: string;
  name?: string;
  brand?: tBrand;
};
export function fDirectColorSearch(params: tColorSearchParams): tPaint[] {
  const labelQuery = params.label ?? "";
  const nameQuery = params.name ?? "";
  const brandQuery = params.brand ?? "";

  const list = clarColorsList.filter((paint) => {
    const paintLabel = paint.label == null ? "" : String(paint.label);
    const paintName = paint.name == null ? "" : String(paint.name);
    const paintBrand = paint.brand == null ? "" : String(paint.brand);

    if (labelQuery.length > 0 && !paintLabel.includes(labelQuery)) {
      return false;
    }
    if (nameQuery.length > 0 && !paintName.includes(nameQuery)) {
      return false;
    }
    if (brandQuery !== "All Brands" && !paintBrand.includes(brandQuery)) {
      return false;
    }
    return true;
  });
  return list;
}
export function fAverageColor(colors: tPaint[]): tCLARColor {
  let totalC = 0.5;
  let totalL = 0.5;
  let totalAR = 0;
  for (const color of colors) {
    totalC += color.clar.c;
    totalL += color.clar.l;
    totalAR += color.clar.ar;
  }
  const count = Math.max(colors.length, 1);
  return {
    c: totalC / count,
    l: totalL / count,
    ar: totalAR / count,
  };
}
export function fClosestColors(
  targetColor: tPaint,
  brand?: tBrand,
): tColorMap<tPaint> {
  const colorPriority: (keyof tColorMap<tPaint>)[] = [
    "red",
    "yellow",
    "blue",
    "white",
    "grey",
    "black",
  ];

  let rankedColors = findColors(targetColor.clar, -1, brand);
  console.log("Ranked colors:", rankedColors.length);
  let colorMap: tColorMap<tPaint> = {
    red: undefined,
    yellow: undefined,
    blue: undefined,
    white: undefined,
    grey: undefined,
    black: undefined,
  };
  const lerpRed = fYUVToCLARColor(
    fArrayLerp(targetColor.yuv, refYUV.red, 0.1) as [number, number, number],
    "RYGB",
  );
  const lerpYellow = fYUVToCLARColor(
    fArrayLerp(targetColor.yuv, refYUV.yellow, 0.1) as [number, number, number],
    "RYGB",
  );
  const lerpBlue = fYUVToCLARColor(
    fArrayLerp(targetColor.yuv, refYUV.blue, 0.1) as [number, number, number],
    "RYGB",
  );
  const lerpWhite = fYUVToCLARColor(
    fArrayLerp(targetColor.yuv, refYUV.white, 0.1) as [number, number, number],
    "RYGB",
  );
  const lerpGrey = fYUVToCLARColor(
    fArrayLerp(targetColor.yuv, refYUV.grey, 0.1) as [number, number, number],
    "RYGB",
  );
  const lerpBlack = fYUVToCLARColor(
    fArrayLerp(targetColor.yuv, refYUV.black, 0.1) as [number, number, number],
    "RYGB",
  );
  const lerps = {
    red: lerpRed,
    yellow: lerpYellow,
    blue: lerpBlue,
    white: lerpWhite,
    grey: lerpGrey,
    black: lerpBlack,
  };
  for (const colorKey of colorPriority) {
    const ranks = findColors(lerps[colorKey], 2, brand);
    if (clarColorsList[ranks[0].index] == targetColor) {
      colorMap[colorKey] = clarColorsList[ranks[1].index];
    } else {
      colorMap[colorKey] = clarColorsList[ranks[0].index];
    }
  }

  return colorMap;
}

export type tSeasonMap<type> = {
  spring: type;
  summer: type;
  autumn: type;
  winter: type;
};

export function fGetSeasons(testColor: tCLARColor): tSeasonMap<number> {
  let { c, l, ar } = testColor;
  let dar =
    Math.atan2(
      Math.sin(ar - (Math.PI * 3) / 2),
      Math.cos(ar - (Math.PI * 3) / 2),
    ) / Math.PI;

  let depth = c ** 0.5;
  dar = (dar + 1) / 2;
  dar = Math.round(dar * 100) / 100;

  l = l ** 2;
  depth = Math.round(depth * 100) / 100;
  let winterScore = depth * (1 - l) * (1 - dar);
  winterScore = Math.round(winterScore * 100) / 100;
  let summerScore = (1 - depth) * l * (1 - dar);
  summerScore = Math.round(summerScore * 100) / 100;
  let autumnScore = (1 - depth) * (1 - l) * dar;
  autumnScore = Math.round(autumnScore * 100) / 100;
  let springScore = depth * l * dar;
  springScore = Math.round(springScore * 100) / 100;
  return {
    spring: springScore,
    summer: summerScore,
    autumn: autumnScore,
    winter: winterScore,
  };
}

export function fGetSeasonColors(
  testColor: tCLARColor,
  brand?: tBrand,
): tSeasonMap<tPaint> {
  const seasonColors: tSeasonMap<tPaint> = {
    spring: undefined,
    summer: undefined,
    autumn: undefined,
    winter: undefined,
  };
  const lerpSpring = fColorLerp(testColor, CLArSpring, 0.2);
  const lerpSummer = fColorLerp(testColor, CLArSummer, 0.2);
  const lerpAutumn = fColorLerp(testColor, CLArAutumn, 0.2);
  const lerpWinter = fColorLerp(testColor, CLArWinter, 0.2);
  const lerps = {
    spring: lerpSpring,
    summer: lerpSummer,
    autumn: lerpAutumn,
    winter: lerpWinter,
  };
  //  const rankedColors = findColors(testColor, -1, brand);
  for (let season in seasonColors) {
    const paintRanks = findColors(lerps[season], 2, brand);
    if (clarColorsList[paintRanks[0].index].clar !== testColor) {
      seasonColors[season] = clarColorsList[paintRanks[0].index];
    } else {
      seasonColors[season] = clarColorsList[paintRanks[1].index];
    }
  }
  for (let season in seasonColors) {
    if (seasonColors[season] === undefined) {
      console.log(
        `Filling missing ${season} with top ranked color:`,
        clarColorsList[findColors(testColor, -1, brand)[0].index],
      );
      seasonColors[season] =
        clarColorsList[findColors(testColor, -1, brand)[0].index];
    }
  }
  return seasonColors;
}
