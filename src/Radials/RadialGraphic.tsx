import React, { use, useEffect, useRef, useState } from "react";
import { PanResponder, Dimensions } from "react-native";
import { tSector, tSectorGroup } from "./SectorTypes";
import { SectorGroup } from "./SectorGroup";
import { tCLARColor } from "../utils/CLAcolor";
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
  const radii = props.radii || ctx.radii || [20, 200];
  const wAngleToChord = ctx.wAngleToChord || wDefaultAngleToChord;
  const wChordToAngle = ctx.wChordToAngle || wDefaultChordToAngle;
  const arcLength = props.arcLength || ctx.totalArcLength;
  const origin = props.origin || ctx.origin;
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
        origin: origin,
        rotationR: 0,
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
