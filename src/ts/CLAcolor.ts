import { useState } from "react";
import { DerivedValue, SharedValue, useDerivedValue, useSharedValue } from "react-native-reanimated";

export type tCLARColor = {
  c: number;
  l: number;
  ar: number;
};



  export function fCLARColorToRGB(color: tCLARColor): [number, number, number] {
        'worklet';
    const {c, l, ar} = color;
    const u = Math.cos(ar)*.5 * c;
    const v = Math.sin(ar)*.5 * c;
    const y = l;
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
  brand: string;
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
      brand: "Random Brand",
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