import React, { use, useEffect, useRef, useState } from "react";
import { PanResponder, Dimensions } from "react-native";
import { tSector, tSectorGroup } from "./sectorTypes";
import { SectorGroup } from "./SectorGroup";
import { tCLARColor } from "./CLAcolor";
import {
  tRadialContext,
  useRadialContext,
  wDefaultAngleToChord,
  wDefaultChordToAngle,
} from "./RadialContext";

export type tRadialGraphic = tSectorGroup & {
  fSectorModifier?: (sector: tSector) => tSector;
  fSectorGroupModifier?: (group: tSectorGroup) => any;
};

export function RadialGraphic(props: tRadialGraphic) {
  const ctx: tRadialContext = useRadialContext();
  const radii = ctx.radii || props.radii || [20, 200];
  const wAngleToChord = ctx.wAngleToChord || wDefaultAngleToChord;
  const wChordToAngle = ctx.wChordToAngle || wDefaultChordToAngle;
  const arcLength = props.arcLength || ctx.totalArcLength;
  const ring = props.ring || ctx.totalRings;
  const chord = props.chord || ctx.totalChords;
  const rotationR = props.rotationR || ctx.mainRotationR;
  const fSectorModifier = props.fSectorModifier || ((sector) => sector);
  const fSectorGroupModifier = props.fSectorGroupModifier || ((group) => group);
  if (
    wAngleToChord(
      wChordToAngle(0, arcLength, chord, rotationR),
      arcLength,
      chord,
      rotationR,
    ) !== 0
  ) {
    throw new Error(
      `angleToChord:${wAngleToChord(wChordToAngle(0, arcLength, chord, rotationR), arcLength, chord, rotationR)} and chordToAngle:${wChordToAngle(0, arcLength, chord, rotationR)} are not consistent with each other`,
    );
  }

  //// Init sectors ////

  const arcStep = arcLength / chord;
  const radStep = (radii[1] - radii[0]) / ring;
  const sectors = [];

  for (let r = ring - 1; r >= 0; r--) {
    for (let c = 0; c < chord; c++) {
      const sectorRadii: [number, number] = [
        radii[0] + r * radStep,
        radii[0] + (r + 1) * radStep,
      ];

      let sector: tSector = {
        arcLength: arcStep,
        radii: sectorRadii,
        ring: r,
        chord: c,
        sectorGroupID: c,
      };
      if (fSectorModifier) {
        sector = fSectorModifier(sector);
      }
      sectors.push(sector);
    }
  }

  //// Group sectors ////

  let groups: tSectorGroup[] = [];
  sectors.forEach((sector: tSector) => {
    const groupID = sector.sectorGroupID || 0;
    const rotation = wChordToAngle(sector.chord, arcLength, chord, rotationR);
    let group = groups[groupID];
    if (!group) {
      group = {
        ...sector,
        sectorGroupID: groupID,
      };
    }
    group.sectors = group.sectors || [];
    group.sectors.push(sector);
    group.rotationR = rotation;
    group = fSectorGroupModifier(group);
    groups[groupID] = group;
  });
  const zGroups = () => {
    const zGroups = [];
    groups.forEach((element) => {
      zGroups.push(
        <SectorGroup key={element.sectorGroupID} {...element}></SectorGroup>,
      );
    });
    return zGroups;
  };
  //// Render ////

  return <>{zGroups()}</>;
}

export type tColorRange = {
  R0C0: tCLARColor;
  R1C0: tCLARColor;
  R0C1: tCLARColor;
  interpolation?: "linear" | "expo";
  dimensions?: [number, number];
};

export function fGetColorsFromGrid({
  R0C0: R0C0,
  R1C0: R1C0,
  R0C1: R0C1,
  interpolation = "linear",
  dimensions,
}: tColorRange) {
  const colors: tCLARColor[][] = [];
  let [rings, chords] = dimensions || [1, 1];
  const rdc = Math.pow(R0C0.c / R1C0.c, 1 / Math.max(rings - 1, 1));
  const rdl = Math.pow(R0C0.l / R1C0.l, 1 / Math.max(rings - 1, 1));
  const adc = Math.pow(R0C0.c / R0C1.c, 1 / Math.max(chords - 1, 1));
  const adl = Math.pow(R0C0.l / R0C1.l, 1 / Math.max(chords - 1, 1));
  const radialDelta = [R1C0.c - R0C0.c, R1C0.l - R0C0.l, R1C0.ar - R0C0.ar];
  const angularDelta = [R0C1.c - R0C0.c, R0C1.l - R0C0.l, R0C1.ar - R0C0.ar];

  for (let r = 0; r < rings; r++) {
    const ringColors: tCLARColor[] = [];
    const chromaMax = R1C0.c * Math.pow(rdc, rings - r);
    const lightnessMax = R1C0.l * Math.pow(rdl, rings - r);

    for (let c = 0; c < chords; c++) {
      const chroma =
        interpolation == "expo"
          ? chromaMax * Math.pow(adc, c - 1)
          : R0C0.c +
            radialDelta[0] * (r / Math.max(rings - 1, 1)) +
            angularDelta[0] * (c / Math.max(chords - 1, 1));
      const lightness =
        interpolation == "expo"
          ? lightnessMax * Math.pow(adl, c - 1)
          : R0C0.l +
            radialDelta[1] * (r / Math.max(rings - 1, 1)) +
            angularDelta[1] * (c / Math.max(chords - 1, 1));
      const angle =
        R0C0.ar +
        radialDelta[2] * (r / Math.max(rings - 1, 1)) +
        angularDelta[2] * (c / Math.max(chords - 1, 1));
      ringColors.push({ c: chroma, l: lightness, ar: angle });
    }
    colors.push(ringColors);
  }
  return colors;
}

export function fExperp(
  colorA: tCLARColor,
  colorB: tCLARColor,
  step: number,
  maxSteps: number,
): tCLARColor {
  "worklet";
  const rdc = Math.pow(colorB.c / colorA.c, 1 / Math.max(maxSteps - 1, 1));
  const rdl = Math.pow(colorB.l / colorA.l, 1 / Math.max(maxSteps - 1, 1));
  let c = Math.pow(rdc, maxSteps - 1 - step) * colorA.c;
  let l = Math.pow(rdl, maxSteps - 1 - step) * colorA.l;
  const diff = Math.atan2(
    Math.sin(colorB.ar - colorA.ar),
    Math.cos(colorB.ar - colorA.ar),
  );
  let ar = colorA.ar + diff * (step / Math.max(maxSteps - 1, 1));
  return { c, l, ar };
}
