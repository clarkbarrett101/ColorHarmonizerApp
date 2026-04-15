import { useState } from "react";
import { DerivedValue, SharedValue, useDerivedValue, useSharedValue } from "react-native-reanimated";

export type tCLARColor = {
  c: number;
  l: number;
  ar: number;
};


  export function fCLARColorToString(color: tCLARColor) {
    'worklet';
    const {c, l, ar} = color;
    const u = Math.cos(ar)*.5 * c;
    const v = Math.sin(ar)*.5 * c;
    const y = l;
    const r =Math.round(Math.max(0, y + 1.13983 * v)*255);
    const g = Math.round(Math.max(0, y - 0.39465 * u - 0.58060 * v)*255);
    const b = Math.round(Math.max(0, y + 2.03211 * u)*255);
    return `rgb(${r}, ${g}, ${b})`;
  }