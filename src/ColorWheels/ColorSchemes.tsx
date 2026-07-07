import { View, Text, Dimensions } from "react-native";
import React, { useEffect, useState } from "react";
import { tRadialObject } from "../Radials/SectorTypes";
import { useUserContext } from "../Contexts/UserContext";
import { RadialContext } from "../Radials/RadialContext";
import { RadialGraphic } from "../Radials/RadialGraphic";
import { tAttribute, tAttributeMap, tAttributeModifier } from "../utils/Actor";
import { fCLARColorToRGB, tCLARColor } from "../utils/CLAcolor";
import { tVerse } from "../utils/Verse";

export type tColorSchemes = tRadialObject & {
  vSelectedColors?: tVerse<tCLARColor[]>;
};

export function ColorSchemes({
  arcLength = 18 / 7,
  radii = [200, 400],
  origin = [
    Dimensions.get("window").width,
    Dimensions.get("window").height / 2,
  ],
  rotationR = 22 / 7,
  ring = 5,
  vSelectedColors,
}: tColorSchemes) {
  function fGetHarmonies(): number[] {
    const aRA = vSelectedColors?.state[0]?.ar ?? 0;
    const aRB = vSelectedColors?.state[1]?.ar ?? 0;
    const mid = fLerpAngle(aRA, aRB, 0.5);
    const aSide = fLerpAngle(aRA, aRB, -1);
    const bSide = fLerpAngle(aRA, aRB, 2);
    const midInv = Math.atan2(Math.sin(mid + 22 / 7), Math.cos(mid + 22 / 7));
    const aSideInv = Math.atan2(Math.sin(aRA + 22 / 7), Math.cos(aRA + 22 / 7));
    const bSideInv = Math.atan2(Math.sin(aRB + 22 / 7), Math.cos(aRB + 22 / 7));
    return [
      aRA,
      aRB,
      bSide,
      null,
      aRA,
      mid,
      aRB,
      null,
      aSide,
      aRA,
      aRB,
      null,
      aRA,
      aRB,
      midInv,
      null,
      aRA,
      aRB,
      aSideInv,
      bSideInv,
    ];
  }
  const [colors, setColors] = useState(fGetHarmonies());
  useEffect(() => {
    setColors(fGetHarmonies());
  }, [vSelectedColors?.state]);
  const mColorModifier: tAttributeModifier = {
    modID: 0,
    deps: [],
    modifier: (input: tAttributeMap) => {
      "worklet";
      if (colors[input.chord] === null) {
        return {
          ...input,
          red: 255,
          green: 255,
          blue: 255,
        };
      }
      const c = (input.ring / ring) * 0.5 + 0.5;
      const l = (input.ring / ring) * 0.5 + 0.5;
      const ar = colors[input.chord % colors.length];
      const [r, g, b] = fCLARColorToRGB({ c, l, ar });
      return {
        ...input,
        red: r,
        green: g,
        blue: b,
      };
    },
  };
  const mTransformModifier: tAttributeModifier = {
    modID: 1,
    deps: [],
    modifier: (input: tAttributeMap) => {
      "worklet";
      if (colors[input.chord] === null) {
        return {
          ...input,
          scaleX: 0,
          scaleY: 0,
        };
      }
      return input;
    },
  };
  return (
    <RadialContext
      value={{
        totalRings: ring,
        origin,
        radii,
        mainRotationR: rotationR,
        totalArcLength: arcLength,
        mColorModifier,
        mTransformModifier,
      }}
    >
      <RadialGraphic chord={colors.length} />
    </RadialContext>
  );
}
function fLerpAngle(a: number, b: number, t: number) {
  const delta = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return Math.atan2(Math.sin(a + delta * t), Math.cos(a + delta * t));
}
type tSchemeMap = {
  root: [number, number];
  analogous: [number, number, number];
  triad: number;
  tetrad: [number, number];
};
function fGetSchemes(schemeMap: tSchemeMap) {
  const arg = [];
  for (let i = 0; i < 3; i++) {
    arg.push(...schemeMap.root);
    arg.push(schemeMap.analogous[i]);
  }
  arg.push(...schemeMap.root, schemeMap.triad);
  arg.push(...schemeMap.root, ...schemeMap.tetrad);
  console.log("arg", arg);
  return arg;
}
