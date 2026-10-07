import React from "react";
import { tRadialObject } from "../Radials/SectorTypes";
import { ColorFan, tColorFan } from "./ColorFan";
import { eLayers } from "../Contexts/UserContext";
import {
  Circle,
  Defs,
  G,
  Line,
  Path,
  Svg,
  TextPath,
  TSpan,
} from "react-native-svg";
import { tPaint } from "../utils/CLAcolor";
import { cDimH, cDimW } from "../utils/ScreenDimensions";

export type tAngles = {
  Alpha: number;
  Beta: number;
  Delta: number;
  Mu: number;
  Sigma: number;
  Gamma: number;
  sAlpha: number;
  sBeta: number;
  iMu: number;
  iAlpha: number;
  iBeta: number;
  iGamma: number;
  iSigma: number;
};

const signPaths: { [key: string]: string } = {
  cancer:
    "M15 4C8 11-5 12-10 7-16 2-13-5-7-3-4-2-4 2-7 2-5-4-15-2-9 5-5 9 4 9 15 4M-15-4C-9-11 5-12 11-5 15-1 13 5 7 3 4 2 4-2 7-2 5 4 15 2 10-3 4-10-6-8-15-4",
  aries:
    "M0 14Q2-8 10-9 15-9 15-3 15-14 10-14 5-14 0-4-5-14-10-14-15-14-15-3-15-9-10-9-2-8 0 14",
  leo: "M6 5C22-23-16-18-4-4-11-5-12 5-6 6 1 7 4 1-1-4-10-13 15-20 4 4-1 13 2 22 14 9 1 18 3 10 6 5M-4-2A3 3 90 01-2 3 3 3 90 11-4-2",
  capricorn:
    "M-15-5C-14-14-8-4-7 6-6-5-6-11 0-11 7-11 4 2 4 10 4 15 13 16 15 10 17 3 8 1 6 4 3 8 3 12-8 11 2 15 6 9 7 5 8-5 10-13 4-14-1-16-7-14-8-7-13-14-17-14-15-5M10 12A1 1 90 019 5 1 1 90 0110 12",
  taurus:
    "M-11-15C-16-8-14-5-8-2 0 0 6 2 6 7 6 16-6 16-6 7-6 2 0 0 7-2 14-5 16-8 11-15 12-8 10-5 0-2-12 0-11 16 0 16 12 16 12 0 0-2-12-5-12-8-11-15",
  libra:
    "M20-1C1 0 14-14 0-14-14-14-1 0-20-1 3 4-11-10 0-10 11-10-3 4 20-1M20 3C1 1-1 1-20 3 0 6 0 6 20 3",
  gemini:
    "M-2 11C-9 5-9-5-2-10L-1-9C-5-3-5 3-1 10ZM-12 14C-5 7 5 7 12 14 4 11-4 11-12 14ZM2-10C9-5 9 5 2 11L1 10C5 3 5-3 1-9ZM-12-14C-4-10 4-10 12-14 5-6-5-6-12-14Z",
  pisces:
    "M-13 12C-3 7-3-7-13-12 2-12 2 12-13 12M12-12C3-7 3 7 12 12-2 12-2-12 12-12M0-1C10-1 10 0 14 0 9 0 10 1 0 1-10 1-10 0-14 0-9 0-10-1 0-1",
  virgo:
    "M-14-10C-8-13-8-3-5 6-3-12 2-18 3-5 8-16 14-7 5 0 0 6 11 15 14 6 5 11 5 2 9-2 15-9 11-18 5-11 3-18-5-18-5-3-8-14-11-14-14-10M9-2C15-7 18 2 9 6L8 4C3 6-2 6 3 13 3 9 2 8 9 6L8 4C12 2 15-2 9-2Z",
  scorpio:
    "M-16-12C-8-12-8-3-8 11-5-11 0-18 2-6 8-15 12-8 2-1-5 4 5 11 10 6 12 5 12 7 12 9 13 5 13 4 12-1 11 1 10 2 6 3 8 3 8 3 9 4L9 4C7 10-3 5 7-2 14-7 10-18 4-11 2-18-6-18-7-3-9-14-13-14-16-12M21 10Z",

  aquarius:
    "M0 0C-4 7-10 9-10-1-16 12-4 12 0 4 5-5 10 11 12-2 9 7 4-8 0 0ZM0-6C-5 2-8 1-6-7-12 2-6 8 0-3 4-10 9 7 11-5 8 2 4-12 0-6Z",
  sagittarius:
    "M-14 14C-10 8-8 7-3 1-2 0-3-2-8-4-2-4-1-1 0-2 9-10 6-11 2-11 6-13 10-13 13-13 13-10 13-5 11-2 11-6 10-9 2 0 1 1 4 2 4 8 2 3 0 2-1 3-7 8-8 10-14 14",
};
export type tScheme = {
  deltaRange: number[];
  coldAlpha?: boolean;
  addAngles: (keyof tAngles)[];
  topText?: string;
  bottomText?: string;
  signPath?: string;
  finalHues?: number[];
};
const complementaryScheme: tScheme = {
  deltaRange: [0.8, 1],
  addAngles: ["Alpha", "Beta"],
  topText: "Complementary",
  bottomText: "",
  signPath: signPaths.cancer,
};
const analogousMidScheme: tScheme = {
  deltaRange: [0.15, 0.85],
  addAngles: ["Alpha", "Mu", "Beta"],
  topText: "Analogous",
  bottomText: "(Median)",
  signPath: signPaths.aries,
};
const analogousAScheme: tScheme = {
  deltaRange: [0, 0.33],
  addAngles: ["Alpha", "sAlpha", "Beta"],
  topText: "Analogous",
  bottomText: "(Warm)",
  signPath: signPaths.leo,
};
const analogousBScheme: tScheme = {
  deltaRange: [0, 0.33],
  addAngles: ["Alpha", "sBeta", "Beta"],
  topText: "Analogous",
  bottomText: "(Cool)",
  signPath: signPaths.capricorn,
};
const splitCompScheme: tScheme = {
  deltaRange: [0, 0.33],
  addAngles: ["Alpha", "iMu", "Beta"],
  topText: "Split",
  bottomText: "Complementary",
  signPath: signPaths.taurus,
};
const splitComp2Scheme: tScheme = {
  deltaRange: [0.75, 0.9],
  addAngles: ["Alpha", "sAlpha", "Beta"],
  topText: "Cool Split",
  bottomText: "Complementary",
  signPath: signPaths.aquarius,
};
const splitComp3Scheme: tScheme = {
  deltaRange: [0.75, 0.9],
  addAngles: ["Alpha", "sBeta", "Beta"],
  topText: "Warm Split",
  bottomText: "Complementary",
  signPath: signPaths.sagittarius,
};
const triadScheme: tScheme = {
  deltaRange: [0.33, 0.9],
  addAngles: ["Alpha", "iMu", "Beta"],
  topText: "T r i a d i c",
  bottomText: "",
  signPath: signPaths.libra,
};
const doubleSplitScheme: tScheme = {
  deltaRange: [0, 0.4, 0.6, 0.9],
  addAngles: ["Alpha", "iAlpha", "iBeta", "Beta"],
  topText: "Double Split",
  bottomText: "Complementary",
  signPath: signPaths.gemini,
};
const tetradScheme: tScheme = {
  deltaRange: [0.4, 0.6],
  addAngles: ["Alpha", "iAlpha", "iBeta", "Beta"],
  topText: "T e t r a d i c",
  bottomText: "",
  signPath: signPaths.pisces,
};
const tetrad2Scheme: tScheme = {
  deltaRange: [0.85, 1],
  addAngles: ["Alpha", "iMu", "Mu", "Beta"],
  topText: "T e t r a d i c",
  bottomText: "",
  signPath: signPaths.pisces,
};
const scorpioScheme: tScheme = {
  deltaRange: [0.85, 1],
  addAngles: ["Alpha", "Sigma", "iSigma", "Beta"],
  topText: "Double Split",
  bottomText: "Complementary",
  signPath: signPaths.scorpio,
};
const virgoScheme: tScheme = {
  deltaRange: [0.85, 1],
  addAngles: ["Alpha", "iGamma", "Gamma", "Beta"],
  topText: "Double Split",
  bottomText: "Complementary",
  signPath: signPaths.virgo,
};

const schemes: tScheme[] = [
  tetrad2Scheme,
  tetradScheme,
  virgoScheme,
  scorpioScheme,
  doubleSplitScheme,
  splitComp2Scheme,
  splitComp3Scheme,
  triadScheme,
  splitCompScheme,
  analogousBScheme,
  analogousMidScheme,
  analogousAScheme,
  complementaryScheme,
];
export function fGetHarmonies(hues: number[]): tScheme[] {
  let alpha = hues[0] % (2 * Math.PI);
  let beta = hues[1] % (2 * Math.PI);
  let warmthAlpha = Math.abs(
    Math.atan2(Math.sin(alpha - 11 / 7), Math.cos(alpha - 11 / 7)),
  );
  let warmthBeta = Math.abs(
    Math.atan2(Math.sin(beta - 11 / 7), Math.cos(beta - 11 / 7)),
  );

  if (warmthAlpha > warmthBeta) {
    const temp = alpha;
    alpha = beta;
    beta = temp;
  }
  const delta =
    Math.atan2(Math.sin(beta - alpha), Math.cos(beta - alpha)) / Math.PI;
  alpha /= Math.PI;
  beta /= Math.PI;
  const angles: tAngles = {
    Alpha: Math.round(alpha * 100) / 100,
    Beta: Math.round(beta * 100) / 100,
    Delta: Math.round(Math.abs(delta) * 100) / 100,
    sAlpha: Math.round((alpha - delta) * 100) / 100,
    sBeta: Math.round((beta + delta) * 100) / 100,
    Mu: Math.round((alpha + delta / 2) * 100) / 100,
    iMu: Math.round((alpha + delta / 2 + 1) * 100) / 100,
    iAlpha: Math.round((alpha + 1) * 100) / 100,
    iBeta: Math.round((beta + 1) * 100) / 100,
    Sigma: Math.round((alpha + 0.25) * 100) / 100,
    Gamma: Math.round((beta - 0.25) * 100) / 100,
    iSigma: Math.round((alpha + 1.25) * 100) / 100,
    iGamma: Math.round((beta + 0.75) * 100) / 100,
  };
  for (const key in angles) {
    angles[key as keyof tAngles] = angles[key as keyof tAngles] % 2;
  }
  const harmonies: tScheme[] = [];
  for (const scheme of schemes) {
    if (
      (angles.Delta >= scheme.deltaRange[0] &&
        angles.Delta <= scheme.deltaRange[1]) ||
      (scheme.deltaRange[2] != undefined &&
        angles.Delta >= scheme.deltaRange[2] &&
        angles.Delta <= scheme.deltaRange[3])
    ) {
      const harmony = {
        ...scheme,
        finalHues: scheme.addAngles.map(
          (angle) => Math.round(angles[angle] * Math.PI * 100) / 100,
        ),
      };
      harmonies.push(harmony);
    }
  }
  return harmonies;
}

export type tColorScheme = Omit<tColorFan, "hues"> & {
  tScheme: tScheme;
  ready?: boolean;
};
export function ColorScheme({ tScheme, ready = true, ...props }: tColorScheme) {
  return (
    <>
      <ColorFan
        chromaRange={[0.2, 0.65]}
        hues={tScheme?.finalHues}
        {...props}
        chordLength={props.arcLength / 2}
      />
      {ready && tScheme?.signPath && (
        <Sign
          {...props}
          radii={[(props.radii[0] + props.radii[1]) / 2 - 25, cDimH(0.05)]}
          topText={tScheme.topText}
          bottomText={tScheme.bottomText}
          fontSize={30}
          color="white"
          signPath={tScheme.signPath}
          zIndex={eLayers.chipFan}
        />
      )}
    </>
  );
}
export type tSign = tRadialObject & {
  zIndex?: number;
  color?: string;
  fontSize?: number;
  topText?: string;
  bottomText?: string;
  signPath?: string;
};
export function Sign({
  radii,
  origin,
  zIndex,
  rotationR,
  color,
  fontSize,
  topText,
  bottomText,
  signPath,
}: tSign) {
  const path = `M -24 0 A1 1 0 0 1 24 0 A1 1 0 0 1 -24 0 `;
  const bottomPath = `M 30 0 A1 1 0 0 0 -30 0 A1 1 0 0 0 30 0 `;
  const x = radii[0] * Math.cos(rotationR) + origin[0];
  const y = radii[0] * Math.sin(rotationR) + origin[1];
  return (
    <Svg
      style={{
        position: "absolute",
        width: radii[1] * 2,
        height: radii[1] * 2,
        zIndex: zIndex,
        shadowColor: "black",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        transform: [{ translateX: x - radii[1] }, { translateY: y - radii[1] }],
      }}
      viewBox={`${-32} ${-32} ${64} ${64}`}
      pointerEvents="none"
    >
      <Defs>
        <Path id="curve" d={path} fill="none" stroke="black" strokeWidth={1} />
        <Path
          id="bottomCurve"
          d={bottomPath}
          fill="none"
          stroke="black"
          strokeWidth={1}
        />
      </Defs>
      {signPath && <Path d={signPath} fill={color} />}
      <G transform={[{ rotate: `${-11 / 7}rad` }]}>
        <TextPath
          href="#curve"
          fontFamily="Outfit"
          fill={color}
          startOffset={"50%"}
        >
          <TSpan
            fontFamily="Outfit"
            fontSize={10}
            fontWeight={500}
            textAnchor="middle"
          >
            {topText}
          </TSpan>
        </TextPath>
      </G>
      <G transform={[{ rotate: `${-11 / 7}rad` }]}>
        <TextPath
          href="#bottomCurve"
          fontFamily="Outfit"
          fill={color}
          startOffset={"50%"}
        >
          <TSpan
            fontFamily="Outfit"
            fontSize={10}
            fontWeight={500}
            letterSpacing={1}
            textAnchor="middle"
          >
            {bottomText}
          </TSpan>
        </TextPath>
      </G>
    </Svg>
  );
}

/*
  root: [number, number];
  complementary?: [number, number]; //CN ♋
  M30 16C25 21 10 21 5 17-1 14 2 7 8 9 11 10 11 14 8 14 10 8 0 10 5 15 11 18 18 19 30 16M0 8C5 3 20 3 25 7 31 10 28 17 22 15 19 14 19 10 22 10 20 16 30 14 25 9 19 6 12 5 0 8
  analogousA: [number, number, number]; //AR ♈
  M0 4Q0 0 2 0 3 0 3 1 3-1 2-1 1-1 0 0-1-1-2-1-3-1-3 1-3 0-2 0 0 0 0 4
  analogousB?: [number, number, number]; //LE ♌
  M8 6C10-6-2-6-2 4A2 2 90 00-1 12M-1 12A2 2 90 000 4C-2-1 8-6 6 6 4 14 6 16 12 16 6 14 6 12 8 6M-2 5A2 2 90 010 11 2 2 90 11-2 5
  analogousC?: [number, number, number]; //CP ♑
  M-15-5C-14-14-8-4-7 6-6-5-6-11 0-11 7-11 4 2 4 10 4 15 13 16 15 10 17 3 8 1 6 4 3 8 3 12-8 11 2 15 6 9 7 5 8-5 10-13 4-14-1-16-7-14-8-7-13-14-17-14-15-5M10 12A1 1 90 019 5 1 1 90 0110 12
  split?: [number, number, number]; //TR ♉
  M-1 5A1 1 0 007 5 1 1 0 00-1 5L1 5A1 1 0 015 5 1 1 0 011 5M3 1C0 1-2 1-4-1-2 3-2 3 3 3 8 3 8 3 10-1 7 1 7 1 3 1
  triad?: [number, number, number]; //LB ♎
  M7 4C3 4 3 0 0 0-3 0-3 4-7 4-1 4-3 1 0 1 3 1 1 4 7 4M7 6C1 4-1 4-7 6-1 5 1 5 7 6
  tetradA: [number, number, number, number]; //GE ♊
  M0 20C7 16 13 16 20 20 15 12 5 12 0 20M5 15C3 13 3 7 5 5L7 6C5 8 5 12 7 14ZM0 0C5 8 15 8 20 0 13 4 7 4 0 0M15 5 13 6C15 8 15 12 13 14L15 15C17 13 17 7 15 5
  tetradB?: [number, number, number, number]; //VR ♍
  M-14-10C-8-13-8-3-5 6-3-12 2-18 3-5 8-16 14-7 5 0 0 6 11 15 14 6 5 11 5 2 9-2 15-9 11-18 5-11 3-18-5-18-5-3-8-14-11-14-14-10M9-2C15-7 18 2 9 6L8 4C3 6-2 6 3 13 3 9 2 8 9 6L8 4C12 2 15-2 9-2Z
  tetradC?: [number, number, number, number]; //SC ♏
  M-16-12C-8-12-8-3-8 11-5-11 0-18 2-6 8-15 12-8 2-1-5 4 5 11 10 6 12 5 12 7 12 9 13 5 13 4 12-1 11 1 10 2 6 3 8 3 8 3 9 4L9 4C7 10-3 5 7-2 14-7 10-18 4-11 2-18-6-18-7-3-9-14-13-14-16-12M21 10Z
  tetradD?: [number, number, number, number]; //PI ♓
  M-11 10C-3 6-3-6-11-10 1-10 1 10-11 10M11-10C3-6 3 6 11 10-1 10-1-10 11-10M0-1C9-1 9 0 14 0 10 0 10 1 0 1-8 1-8 0-12 0-8 0-8-1 0-1
  pentad?: [number, number, number, number, number]; //ST ♐
  hexad?: [number, number, number, number, number, number]; //AQ ♒

  M4 2Q2 5 5 7L20 4Q21 1 19-1ZM15 6 5 8C4 9 4 10 5 11L21 11C22 10 22 7 21 6ZM5 12 4 11C3 12 3 14 5 15L18 18Q21 16 20 13L15 12Z
*/
