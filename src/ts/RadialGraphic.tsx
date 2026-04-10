import React, { use, useEffect, useRef, useState } from "react";
import { PanResponder, Dimensions } from "react-native";
import { tSector, tSectorGroup } from "./sectorTypes";
import { SectorGroup } from "./SectorGroup";
import { CLARColor, tCLARColor } from "./CLAcolor";
import { View } from "react-native";
import { SharedValue, withTiming } from "react-native-reanimated";
import { useRadialContext } from "./RadialContext";

export type tRadialGraphic = tSectorGroup & {
  sectorModifier?: (sector: tSector) => tSector;
  sectorGroupModifier?: (group: tSectorGroup) => any;
};

export function RadialGraphic({
  rotationR = 0,
  arcLength = 44 / 7,
  rc = { rings: 5, chords: 18 },
  sectorModifier = (sector) => sector,
  sectorGroupModifier = (group) => group,
  style = {},
  ...props
}: tRadialGraphic) {
  const { origin, direction, angleToChord, chordToAngle, radii } =
    useRadialContext();
  if (!origin) {
    throw new Error(
      "RadialGraphic must be used within a RadialContext provider",
    );
  }
  if (
    angleToChord(
      chordToAngle(0, arcLength, rc.chords, rotationR),
      arcLength,
      rc.chords,
      rotationR,
    ) !== 0
  )
    throw new Error(
      `angleToChord:${angleToChord(chordToAngle(0, arcLength, rc.chords, rotationR), arcLength, rc.chords, rotationR)} and chordToAngle:${chordToAngle(0, arcLength, rc.chords, rotationR)} are not consistent with each other`,
    );

  //// Init sectors ////

  const arcStep = arcLength / rc.chords;
  const radStep = (radii[1] - radii[0]) / rc.rings;
  const sectors = [];
  for (let r = rc.rings - 1; r >= 0; r--) {
    for (let c = 0; c < rc.chords; c++) {
      const sectorRadii: [number, number] = [
        radii[0] + r * radStep,
        radii[0] + (r + 1) * radStep,
      ];

      let sector: tSector = {
        arcLength: arcStep,
        radii: sectorRadii,
        rc: { rings: r, chords: c },
        sectorGroupID: c,
      };
      if (sectorModifier) {
        sector = sectorModifier(sector);
      }
      sectors.push(sector);
    }
  }

  //// Group sectors ////

  let groups: tSectorGroup[] = [];
  sectors.forEach((sector: tSector) => {
    const groupID = sector.sectorGroupID || 0;
    let group = groups[groupID];
    if (!group) {
      const sectorArc = chordToAngle(
        sector.rc.chords,
        arcLength,
        rc.chords,
        rotationR,
      );
      group = {
        ...sector,
        sectorGroupID: groupID,
        rotationR: sectorArc,
        direction,
      };
    }
    group.sectors = group.sectors || [];
    group.sectors.push(sector);
    group = sectorGroupModifier(group);
    groups[groupID] = group;
  });
  const zGroups = () => {
    const zGroups = [];
    groups.forEach((element) => {
      zGroups.push(
        <SectorGroup key={element.sectorGroupID} {...element}>
          {element.children}
        </SectorGroup>,
      );
    });
    return zGroups;
  };
  //// Render ////

  return (
    <View
      {...props}
      style={{
        top: origin[1],
        left: origin[0],
        position: "absolute",
        ...style,
      }}
    >
      {zGroups()}
    </View>
  );
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
