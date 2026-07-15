import { Dimensions } from "react-native";
import React, { use, useEffect, useState } from "react";
import {
  fMakePetalPath,
  tRadialObject,
  tSector,
  tSectorGroup,
} from "../Radials/SectorTypes";
import { RadialContext, wDefaultAngleToChord } from "../Radials/RadialContext";
import { RadialGraphic } from "../Radials/RadialGraphic";
import { tAttributeMap, tAttributeModifier } from "../utils/Actor";
import { fCLARColorToRGB, tCLARColor, tColorModel } from "../utils/CLAcolor";
import { tVerse, useVerse } from "../utils/Verse";
import { ePanEvent, usePanManager } from "../Contexts/PanManager";
import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { tHarmonizerPhase } from "./ColorHarmonizer";
import { BackIcon } from "../Buttons/BackIcon";
import { CurvedText } from "../Buttons/CurvedText";
import { Sign } from "../Buttons/Sign";

export type tAngles = {
  Alpha: number;
  Beta: number;
  Delta: number;
  Mid: number;
  sAlpha: number;
  sBeta: number;
  iMid: number;
  iAlpha: number;
  iBeta: number;
};

const signPaths: { [key: string]: string } = {
  cancer:
    "M15 4C8 11-5 12-10 7-16 2-13-5-7-3-4-2-4 2-7 2-5-4-15-2-9 5-5 9 4 9 15 4M-15-4C-9-11 5-12 11-5 15-1 13 5 7 3 4 2 4-2 7-2 5 4 15 2 10-3 4-10-6-8-15-4",
  aries:
    "M0 14Q0-8 10-8 15-8 15-3 15-14 10-14 5-14 0-8-5-14-10-14-15-14-15-3-15-8-10-8 0-8 0  14",
  leo: "M7 2C17-19-11-17-4-3 2 4-17 4-8-5-14-5-15 2-8 4-2 5 2 1-1-5-6-12 11-16 4 2 3 5 0 5 1 10 3 14 8 14 12 12 0 12 4 6 7 2",
  capricorn:
    "M-15-5C-14-14-8-4-7 6-6-5-6-11 0-11 7-11 4 2 4 10 4 15 13 16 15 10 17 3 8 1 6 4 3 8 3 12-8 11 2 15 6 9 7 5 8-5 10-13 4-14-1-16-7-14-8-7-13-14-17-14-15-5M10 12A1 1 90 019 5 1 1 90 0110 12",
  taurus:
    "M-11-15C-16-8-14-5-8-2 0 0 6 2 6 7 6 16-6 16-6 7-6 2 0 0 7-2 14-5 16-8 11-15 12-8 10-5 0-2-12 0-11 16 0 16 12 16 12 0 0-2-12-5-12-8-11-15",
  libra:
    "M7 4C3 4 3 0 0 0-3 0-3 4-7 4-1 4-3 1 0 1 3 1 1 4 7 4M7 6C1 4-1 4-7 6-1 5 1 5 7 6",
  gemini:
    "M0 20C7 16 13 16 20 20 15 12 5 12 0 20M5 15C3 13 3 7 5 5L7 6C5 8 5 12 7 14ZM0 0C5 8 15 8 20 0 13 4 7 4 0 0M15 5 13 6C15 8 15 12 13 14L15 15C17 13 17 7",
  pisces:
    "M-13 12C-3 7-3-7-13-12 2-12 2 12-13 12M12-12C3-7 3 7 12 12-2 12-2-12 12-12M0-1C10-1 10 0 14 0 9 0 10 1 0 1-10 1-10 0-14 0-9 0-10-1 0-1",
  virgo:
    "M-14-10C-8-13-8-3-5 6-3-12 2-18 3-5 8-16 14-7 5 0 0 6 11 15 14 6 5 11 5 2 9-2 15-9 11-18 5-11 3-18-5-18-5-3-8-14-11-14-14-10M9-2C15-7 18 2 9 6L8 4C3 6-2 6 3 13 3 9 2 8 9 6L8 4C12 2 15-2 9-2Z",
  scorpio:
    "M-16-12C-8-12-8-3-8 11-5-11 0-18 2-6 8-15 12-8 2-1-5 4 5 11 10 6 12 5 12 7 12 9 13 5 13 4 12-1 11 1 10 2 6 3 8 3 8 3 9 4L9 4C7 10-3 5 7-2 14-7 10-18 4-11 2-18-6-18-7-3-9-14-13-14-16-12M21 10Z",
};
export type tScheme = {
  deltaRange: [number, number];
  addAngles: (keyof tAngles)[];
  title?: string;
  signPath?: string;
};
const complementaryScheme: tScheme = {
  deltaRange: [0.9, 1],
  addAngles: ["Alpha", "Beta"],
  title: "Complementary",
  signPath: signPaths.cancer,
};
const analogousMidScheme: tScheme = {
  deltaRange: [0.1, 0.9],
  addAngles: ["Alpha", "Mid", "Beta"],
  title: "Analogous (Median)",
  signPath: signPaths.aries,
};
const analogousAScheme: tScheme = {
  deltaRange: [0, 0.33],
  addAngles: ["Alpha", "sAlpha", "Beta"],
  title: "Analogous (Warm)",
  signPath: signPaths.leo,
};
const analogousBScheme: tScheme = {
  deltaRange: [0, 0.33],
  addAngles: ["Alpha", "sBeta", "Beta"],
  title: "Analogous (Cool)",
  signPath: signPaths.capricorn,
};
const splitCompScheme: tScheme = {
  deltaRange: [0, 0.3],
  addAngles: ["Alpha", "iMid", "Beta"],
  title: "Split Complementary",
  signPath: signPaths.taurus,
};
const triadScheme: tScheme = {
  deltaRange: [0.3, 0.66],
  addAngles: ["Alpha", "iMid", "Beta"],
  title: "Triad",
  signPath: signPaths.libra,
};
const doubleSplitScheme: tScheme = {
  deltaRange: [0.66, 0.9],
  addAngles: ["Alpha", "iAlpha", "iBeta", "Beta"],
  title: "Double Split Complementary",
  signPath: signPaths.gemini,
};
const tetradScheme: tScheme = {
  deltaRange: [0.4, 0.66],
  addAngles: ["Alpha", "iAlpha", "iBeta", "Beta"],
  title: "Tetrad",
  signPath: signPaths.pisces,
};

const schemes: tScheme[] = [
  complementaryScheme,
  analogousAScheme,
  analogousMidScheme,
  analogousBScheme,
  splitCompScheme,
  triadScheme,
  doubleSplitScheme,
  tetradScheme,
];

export type tSchemeSelector = tRadialObject & {
  vSelectedAngles?: tVerse<number[]>;
  vPhase?: tVerse<tHarmonizerPhase>;
};

export function SchemeSelector(props: tSchemeSelector) {
  const {
    arcLength = 20 / 7,
    radii = [200, 350],
    origin = [
      Dimensions.get("window").width,
      Dimensions.get("window").height / 2,
    ],
    rotationR = 22 / 7,
    ring = 5,
    vSelectedAngles,
    vPhase,
  } = props;
  const { registerHitBox, unregisterHitBox } = usePanManager();
  const vPanPos = useSharedValue<{ angle: number; radius: number }>({
    angle: 0,
    radius: 0,
  });
  const vPanStateBack = useSharedValue<ePanEvent>("leave");
  const vPanState = useSharedValue<ePanEvent>("leave");
  useEffect(() => {
    registerHitBox({
      id: "schemeSelector",
      origin,
      radii,
      rotationR,
      arcLength,
      vPanPos,
      vPanState,
    });
    registerHitBox({
      id: "schemeSelectorBack",
      origin,
      radii: [0, radii[0] - 50],
      rotationR,
      arcLength,
      vPanPos,
      vPanState: vPanStateBack,
    });
    return () => {
      unregisterHitBox("schemeSelector");
      unregisterHitBox("schemeSelectorBack");
    };
  }, []);

  function fGetHarmonies(): number[][] {
    let alpha = vSelectedAngles?.state[0] % (2 * Math.PI);
    let beta = vSelectedAngles?.state[1] % (2 * Math.PI);
    if (alpha > beta) {
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
      Delta: Math.round(delta * 100) / 100,
      sAlpha: Math.round((alpha - delta) * 100) / 100,
      sBeta: Math.round((beta + delta) * 100) / 100,
      Mid: Math.round(((alpha + beta) / 2) * 100) / 100,
      iMid: Math.round(((alpha + beta) / 2 + 1) * 100) / 100,
      iAlpha: Math.round((alpha + 1) * 100) / 100,
      iBeta: Math.round((beta + 1) * 100) / 100,
    };
    const harmonies: number[][] = [];
    for (const scheme of schemes) {
      if (
        angles.Delta >= scheme.deltaRange[0] &&
        angles.Delta <= scheme.deltaRange[1]
      ) {
        harmonies.push(
          scheme.addAngles.map(
            (angle) => Math.round(angles[angle] * Math.PI * 100) / 100,
          ),
        );
      }
    }
    console.log("harmonies", harmonies, angles);
    return harmonies;
  }
  const colors = useVerse(fGetHarmonies());
  useEffect(() => {
    colors.dispatch(fGetHarmonies());
  }, [vSelectedAngles?.state]);
  useAnimatedReaction(
    () => {
      return vPanState.value;
    },
    (state) => {
      if (state === "tap" || state === "release") {
        const chord = wDefaultAngleToChord(
          vPanPos.value.angle,
          arcLength,
          colors.state.length,
          rotationR,
        );
        vSelectedAngles?.dispatch(colors.state[chord % colors.state.length]);
        vPhase?.dispatch("chipSelector");
      }
    },
  );
  useAnimatedReaction(
    () => {
      return vPanStateBack.value;
    },
    (state) => {
      if (state === "tap" || state === "release") {
        vPhase?.dispatch("wheel");
      }
    },
  );
  return (
    <>
      {colors.state.map((harmony, index) => (
        <>
          <ColorScheme
            key={index}
            origin={origin}
            ring={ring}
            chord={harmony.length}
            radii={radii}
            rotationR={
              ((index + 0.5) * arcLength) / colors.state.length +
              rotationR -
              arcLength / 2
            }
            arcLength={((2.5 / 7) * colors.state[index].length) / 3}
            colors={harmony}
            bend={0.1}
          />
          <Sign
            radii={[(radii[0] + radii[1]) / 2 - 25, 50]}
            origin={origin}
            rotationR={
              ((index + 0.5) * arcLength) / colors.state.length +
              rotationR -
              arcLength / 2
            }
            text={schemes[index].title}
            fontSize={30}
            color="white"
            signPath={schemes[index].signPath}
            zIndex={eLayers.chipFan}
          />
        </>
      ))}
      <ColorScheme
        key="last"
        origin={origin}
        ring={4}
        chord={3}
        radii={[0, radii[0] - 75]}
        rotationR={rotationR}
        arcLength={18 / 7}
        bend={0.5}
        colors={[
          ...vSelectedAngles?.state,
          ...vSelectedAngles?.state,
          ...vSelectedAngles?.state,
        ]}
      />
      <BackIcon
        zIndex={eLayers.chipFan}
        color="white"
        size={75}
        origin={[
          Dimensions.get("window").width - 40,
          Dimensions.get("window").height / 2,
        ]}
      />
    </>
  );
}

export type tColorScheme = tRadialObject & {
  colors: number[];
  bend?: number;
  chromaRange?: [number, number];
  lumaRange?: [number, number];
  customModel?: tColorModel;
};
export function ColorScheme({
  arcLength = 15 / 7,
  radii = [300, 500],
  origin = [
    Dimensions.get("window").width + radii[0] / 2,
    Dimensions.get("window").height / 2,
  ],
  rotationR = 22 / 7,
  ring = 5,
  colors = [],
  bend = 0.5,
  chromaRange = [0.4, 0.9],
  lumaRange = [0.5, 0.9],
  customModel,
}: tColorScheme) {
  const { vColorModel } = useUserContext();
  function fSectorModifier(sector: tSector): tSector {
    const rgb = fCLARColorToRGB(
      {
        c:
          (sector.ring / ring) * (chromaRange[1] - chromaRange[0]) +
          chromaRange[0],
        l: (sector.ring / ring) * (lumaRange[1] - lumaRange[0]) + lumaRange[0],
        ar: colors[sector.chord % colors.length] ?? 0,
      },
      customModel ?? vColorModel.shared.value,
    );
    return {
      ...sector,
      rgb,
    };
  }
  return (
    <RadialContext
      value={{
        radii,
        origin,
        totalArcLength: arcLength,
        mainRotationR: rotationR,
        totalChords: colors.length,
        totalRings: ring,
        fPathFunction: (radii, arcLength, maxRadius, rotationR = 0) =>
          fMakePetalPath(radii, arcLength, maxRadius, rotationR, bend),
      }}
    >
      <RadialGraphic
        ring={ring}
        arcLength={arcLength}
        rotationR={rotationR}
        origin={origin}
        chord={colors.length}
        fSectorModifier={fSectorModifier}
      />
    </RadialContext>
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
*/
