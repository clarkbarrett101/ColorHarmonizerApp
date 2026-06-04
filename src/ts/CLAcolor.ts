import { useState } from "react";
import { DerivedValue, SharedValue, useDerivedValue, useSharedValue } from "react-native-reanimated";
const clarColorsList: tPaint[] = require("./clarColors.json");
export function fGetRandomPaint(): tPaint {
  const randomIndex = Math.floor(Math.random() * clarColorsList.length);
  const paint = clarColorsList[randomIndex];
  console.log("Generated random paint:", paint.name, paint.clar);
  return paint;
}
export type tBrand = "Behr" | "Benjamin Moore" | "Sherwin Williams" | "PPG" | "Valspar"| "All Brands";
export type tCLARColor = {
  c: number;
  l: number;
  ar: number;
};

 const CLArRed: tCLARColor = {ar: 1.81, c: 1, l: 0.3} ;
 const CLArYellow: tCLARColor = {ar: 2.9, c: 0.9, l: 0.9};
 const CLArBlue: tCLARColor = {ar: -0.23, c: 0.8, l: 0.1};
 const CLArWhite: tCLARColor = { c: 0, l: 1, ar: 0 };
 const CLArGrey: tCLARColor = { c: 0, l: 0.5, ar: 0 };
 const CLArBlack: tCLARColor = { c: 0, l: 0, ar: 0 };
 export type tColorMap<type> = {
   red?: type;
   yellow?: type;
   blue?: type;
   white?: type;
   grey?: type;
   black?: type;
};
export const refColors: tColorMap<tCLARColor> = {
  red: CLArRed,
  yellow: CLArYellow,
  blue: CLArBlue,
  white: CLArWhite,
  grey: CLArGrey,
  black: CLArBlack,
};
export function fCLARColorToYUV(color: tCLARColor): [number, number, number] {
  'worklet';
  const {c, l, ar} = color;
  const u = Math.cos(ar)*.5 * c;
  const v = Math.sin(ar)*.5 * c;
  const y = l;
  return [y, u, v];
}
export function fRGBToCLARColor(rgb: [number, number, number]): tCLARColor {
  'worklet';
  const [r, g, b] = rgb.map((c) => c / 255);
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const u = -0.14713 * r - 0.28886 * g + 0.436 * b;
  const v = 0.615 * r - 0.51499 * g - 0.10001 * b;
  const c = Math.sqrt(u * u + v * v) * 2;
  const l = y;
  const ar = Math.atan2(v, u);
  return { c, l, ar };
}

  export function fCLARColorToRGB(color: tCLARColor): [number, number, number] {
        'worklet';
    const {c, l, ar} = color;
    const [y, u, v] = fCLARColorToYUV(color);
    const r =Math.round(Math.max(0, y + 1.13983 * v)*255);
    const g = Math.round(Math.max(0, y - 0.39465 * u - 0.58060 * v)*255);
    const b = Math.round(Math.max(0, y + 2.03211 * u)*255);
    return [r, g, b];
  }
  export function fCLARColorToString(color: tCLARColor) {
    'worklet';
    const [r, g, b] = fCLARColorToRGB(color);
    return `rgb(${r}, ${g}, ${b})`;
  }
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
      hex: fCLARColorToString(color),
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
  distance: number;
};

export function findColors(
  { c = 0.5, l = 0.5, ar = 0 }: tCLARColor,
  targetNumber = 3,
  brand?: tBrand,
) {
  let y = l;
  let u = Math.cos(ar) * 0.5 * c;
  let v = Math.sin(ar) * 0.5 * c;
  let paintRanks: tPaintRank[] = [];
  for (let i = 0; i < clarColorsList.length; i++) {
    const paintColor = clarColorsList[i];
        if (brand !== "All Brands" && paintColor.brand !== brand) {
        continue;
      }
    const dy = paintColor.yuv[0] - y;
    const du = paintColor.yuv[1] - u;
    const dv = paintColor.yuv[2] - v;
    const distance =
      Math.sqrt(dy * dy + du * du + dv * dv) ;
    paintRanks.push({
      index: i,
      distance,
    });
  }
  paintRanks.sort((a, b) => a.distance - b.distance);
  if (targetNumber > 0) paintRanks = paintRanks.slice(0, targetNumber);
  return paintRanks;
}

function calculateRYBScore(
  color: { r: number; g: number; b: number } | number[],
  test: "r" | "y" | "b",
) {
  let r, g, b;
  if (Array.isArray(color)) {
    [r, g, b] = color;
  } else {
    ({ r, g, b } = color);
  }
  if (test === "r") {
    return r - g - 2 * b;
  } else if (test === "y") {
    return r + g - b - Math.abs(r - g) / 2;
  } else {
    return -2 * r - g / 2 + b;
  }
}
function fDistanceBetween(colorA: tCLARColor, colorB: tCLARColor) {
  const dc = colorA.c - colorB.c;
  const dl = colorA.l - colorB.l;
    const diff = 2 * Math.atan2(
      Math.sin(colorB.ar - colorA.ar),
      Math.cos(colorB.ar - colorA.ar),
    );
  return Math.sqrt(dc * dc + dl * dl + diff * diff);
}
function fDistances(testColor: tCLARColor): tColorMap<number> {
  return {
    red: fDistanceBetween(testColor, refColors.red),
    yellow: fDistanceBetween(testColor, refColors.yellow),
    blue: fDistanceBetween(testColor, refColors.blue),
    white: fDistanceBetween(testColor, { ...refColors.white, ar: testColor.ar }),
    black: fDistanceBetween(testColor, { ...refColors.black, ar: testColor.ar }),
    grey: fDistanceBetween(testColor, { ...refColors.grey, ar: testColor.ar }),
  };
}

export function fClosestColors(targetColor: tPaint, brand?: tBrand): tColorMap<tPaint> {
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

  const targetScores = fDistances(targetColor.clar);

  for (let rank of rankedColors) {
    const paint = clarColorsList[rank.index];
    const paintScores = fDistances(paint.clar);
    if (!colorMap.grey && paintScores.grey < targetScores.grey) {
      colorMap.grey = paint;
      console.log("Found more grey:", paint.name, paint.clar);
      continue;
    }
    if (!colorMap.yellow && paintScores.yellow < targetScores.yellow) {
      colorMap.yellow = paint;
      console.log("Found more yellow:", paint.name, paintScores.yellow);
      continue;
    }
    if (!colorMap.red && paintScores.red < targetScores.red) {
      colorMap.red = paint;
      console.log("Found more red:", paint.name, paintScores.red);
      continue;
    }

    if (!colorMap.blue && paintScores.blue < targetScores.blue) {
      colorMap.blue = paint;
      console.log("Found more blue:", paint.name, paintScores.blue);
      continue;
    }
    if (
      !colorMap.white && paintScores.white < targetScores.white
    ) {
      colorMap.white = paint;
      console.log("Found more white:", paint.name, paint.clar);
      continue;
    }

    if (
      !colorMap.black && paintScores.black < targetScores.black
    ) {
      colorMap.black = paint;
      console.log("Found more black:", paint.name, paint.clar);
      continue;
    }
  }
  
  for (let i in colorMap) {
    if (colorMap[i] === undefined) {
      console.log(rankedColors[0]);
      colorMap[i] = clarColorsList[rankedColors[0].index];
    }
  }
  return colorMap;
}
