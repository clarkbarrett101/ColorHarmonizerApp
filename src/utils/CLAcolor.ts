import React from "react";
import { Dimensions } from "react-native";

const clarColorsList: tPaint[] = require("./clarColors.json");
export function fGetRandomPaint(): tPaint {
  const randomIndex = Math.floor(Math.random() * clarColorsList.length);
  const paint = clarColorsList[randomIndex];
  console.log("Generated random paint:", paint.name, paint.clar);
  return paint;
}

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
export type tBrand = "Behr" | "Benjamin Moore" | "Sherwin Williams" | "PPG" | "Valspar"| "All Brands";
export type tCLARColor = {
  c: number;
  l: number;
  ar: number;
};

 const CLArRed: tCLARColor = {ar: 0, c: 1, l: 0.3} ;
 const CLArYellow: tCLARColor = {ar: 11/7, c: 0.9, l: 0.9};
 const CLArBlue: tCLARColor = {ar: 33/7, c: 0.7, l: 0.1};
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
export function fRGBToYUV(rgb: [number, number, number]): [number, number, number] {
  'worklet';
  const [r, g, b] = rgb.map((c) => c / 255);
  const y = Math.round((0.299 * r + 0.587 * g + 0.114 * b) * 10000) / 10000;
  const u = Math.round((-0.14713 * r - 0.28886 * g + 0.436 * b) * 10000) / 10000;
  const v = Math.round((0.615 * r - 0.51499 * g - 0.10001 * b) * 10000) / 10000;
  return [y, u, v];
}
function descaleAR(ar: number): number {
  'worklet';
  const originalAR = ar;
  ar = ar / (Math.PI * 2);
  if (ar < 0) ar += 1;
 ar -= 2/7;
  if (ar < 0) ar += 1;
  ar = (Math.log2(ar +1));
  ar = ar * (Math.PI * 2);
  ar = Math.round(ar * 100) / 100;
 // console.log("Descaled AR:", originalAR.toFixed(2), "to", ar);
  return ar;
}
function scaleAR(ar: number): number {
  'worklet'; 
  const originalAR = ar; 
  ar = ar / (Math.PI * 2); 
  if (ar < 0) ar += 1;
  ar = Math.pow(2, ar)-1;
  ar += 2/7;
  if (ar > 1) ar -= 1;
  ar = ar * Math.PI * 2;
  ar = Math.round(ar * 100) / 100;
 // console.log("Scaled AR:", originalAR.toFixed(2), "to", ar);
  return ar;
}
export function fCLARColorToYUV(color: tCLARColor): [number, number, number] {
  'worklet';
  let {c, l, ar} = color;
  ar = scaleAR(ar);
  const u = Math.cos(ar)*.5 * c;
  const v = Math.sin(ar)*.5 * c;
  const y = l;
  return [y, u, v];
}

export function fYUVToCLARColor(yuv: [number, number, number]): tCLARColor {
  'worklet';
  const [y, u, v] = yuv;
  const c = Math.round(Math.sqrt(u * u + v * v)*2*100) / 100;
  const l = y;
  let ar = Math.atan2(v, u);
  ar = descaleAR(ar);
  return { c, l, ar };
}

export function fRGBToCLARColor(rgb: [number, number, number]): tCLARColor {
  'worklet';
  return fYUVToCLARColor(fRGBToYUV(rgb));
}

export function fCLARColorToRGB(color: tCLARColor): [number, number, number] {
        'worklet';
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

  export function fColorLerp(colorA: tCLARColor, colorB: tCLARColor, t: number): tCLARColor {
  'worklet';
  const c = Math.min(colorA.c + (colorB.c - colorA.c) * t, 0.7);
  const l = Math.max(
    Math.min(colorA.l + (colorB.l - colorA.l) * t, 0.9),
    0.1,
  );

  const diff = Math.atan2(
    Math.sin(colorB.ar - colorA.ar),
    Math.cos(colorB.ar - colorA.ar),
  );
  const ar = colorA.ar + diff * t;
  return { c, l, ar };
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
  const [y, u, v] = fCLARColorToYUV({ c, l, ar });
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


function fDistanceBetween(colorA: tCLARColor, colorB: tCLARColor, ar = true): number {
  const dc = (colorA.c - colorB.c);
  const dl = (colorA.l - colorB.l);
  const diff = ar ? (1+colorA.c+colorB.c) * Math.atan2(
      Math.sin(colorB.ar - colorA.ar),
      Math.cos(colorB.ar - colorA.ar),
    ) : 0;
  return Math.sqrt(dc * dc + dl * dl + diff * diff);
}
function fDistances(testColor: tCLARColor): tColorMap<number> {
  return {
    red: fDistanceBetween(testColor, refColors.red),
    yellow: fDistanceBetween(testColor, refColors.yellow),
    blue: fDistanceBetween(testColor, refColors.blue),
    white: fDistanceBetween(testColor, refColors.white, false),
    black: fDistanceBetween(testColor, refColors.black, false),
    grey: fDistanceBetween(testColor, refColors.grey, false),
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
    const dis = fDistanceBetween(paint.clar, targetColor.clar) ; 
    const paintScores = fDistances(paint.clar);
    if (!colorMap.grey && paintScores.grey < targetScores.grey ) {
      colorMap.grey = paint;
      console.log("Found more grey:", paint.name, paint.clar, paintScores.grey, dis);
      continue;
    }
    if (!colorMap.yellow && paintScores.yellow < targetScores.yellow ) {
      colorMap.yellow = paint;
      console.log("Found more yellow:", paint.name, paintScores.yellow, dis);
      continue;
    }
      if (!colorMap.red && paintScores.red < targetScores.red) {
        colorMap.red = paint;
      console.log("Found more red:", paint.name, paintScores.red, dis);
      continue;
    }

    if (!colorMap.blue && paintScores.blue < targetScores.blue ) {
      colorMap.blue = paint;
      console.log("Found more blue:", paint.name, paintScores.blue, dis);
      continue;
    }
    if (
      !colorMap.white && paintScores.white < targetScores.white
    ) {
      colorMap.white = paint;
      console.log("Found more white:", paint.name, paint.clar, paintScores.white, dis);
      continue;
    }

    if (
      !colorMap.black && paintScores.black < targetScores.black
    ) {
      colorMap.black = paint;
      console.log("Found more black:", paint.name, paint.clar, paintScores.black, dis);
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

export type tSeasonMap<type> = {
  spring: type;
  summer: type;
  autumn: type;
  winter: type;
};

export function fGetSeasons(testColor: tCLARColor): tSeasonMap<number> {
  const { c, l, ar } = testColor;
    let by = Math.abs(ar / (2 * Math.PI) - 0.75);
  if (by > 0.5) {
    by = 1 - by;
  }
  by /= 0.5;
  by = Math.round(by * 100) / 100;
  let depth = c ** 0.5;
  depth = Math.round(depth * 100) / 100;
  let winterScore = depth * (1 - l);
  winterScore = Math.round(winterScore * 100) / 100;
  let summerScore = ((1 - depth) * l);
  summerScore = Math.round(summerScore * 100) / 100;
  let autumnScore = ((1 - depth) * (1 - l));
  autumnScore = Math.round(autumnScore * 100) / 100;
  let springScore = (depth * l);
  springScore = Math.round(springScore * 100) / 100;
  return {
    spring: springScore,
    summer: summerScore,
    autumn: autumnScore,
    winter: winterScore,
  };
};

export function fGetSeasonColors(testColor: tCLARColor, brand?: tBrand): tSeasonMap<tPaint> {
  const seasons = fGetSeasons(testColor);
  const seasonColors: tSeasonMap<tPaint> = {
    spring: undefined,
    summer: undefined,
    autumn: undefined,
    winter: undefined,
  };
  const rankedColors = findColors(testColor, -1, brand);
  for (let rank of rankedColors) {
    const paint = clarColorsList[rank.index];
    const paintSeasons = fGetSeasons(paint.clar);
    if (!seasonColors.spring && paintSeasons.spring > seasons.spring) {
      seasonColors.spring = paint;
      continue;
    }
    if (!seasonColors.summer && paintSeasons.summer > seasons.summer) {
      seasonColors.summer = paint;
      continue;
    }
    if (!seasonColors.autumn && paintSeasons.autumn > seasons.autumn) {
      seasonColors.autumn = paint;
      continue;
    }
    if (!seasonColors.winter && paintSeasons.winter > seasons.winter) {
      seasonColors.winter = paint;
      continue;
    }
  }
  for (let i in seasonColors) {
    if (seasonColors[i] === undefined) {
      console.log(rankedColors[0]);
      seasonColors[i] = clarColorsList[rankedColors[0].index];
    }
  }
  return seasonColors;
}