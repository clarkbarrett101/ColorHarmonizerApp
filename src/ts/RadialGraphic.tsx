import React, { useRef, useState } from "react";
import { PanResponder, Dimensions } from "react-native";
import { SectorGroup, tSector, tSectorGroup } from "./Sector";
import { CLAColor } from "./CLAcolor";
import { View } from "react-native";
import { SharedValue, withTiming } from "react-native-reanimated";

type tRadialGraphic = tSectorGroup & {
  colorRange: CLAColor[][] | tColorRange;
  onSectorPress?: ({ ring, chord }: { ring: number; chord: number }) => void;
  onSectorRelease?: () => void;
  sectorModifier?: (sector: tSector) => tSector;
  sectorGroupModifier?: (group: tSectorGroup) => any;
  rotationOffset?: SharedValue<number> | { value: number };
  draggable?: boolean;
  position?: [number, number];
  onOverTravel?: () => void;
};

export default function RadialGraphic({
  rotation = 0,
  arcLength = 360,
  rc = { rings: 5, chords: 18 },
  radii = [20, 200],
  colorRange = [[new CLAColor(1, 1, 0)]],
  sectorModifier = (sector) => sector,
  sectorGroupModifier = (group) => group,
  direction = 1,
  rotationOffset = { value: 0 },
  draggable = false,
  style = {},
  position = [0, 0],
  onSectorPress = () => {},
  onSectorRelease = () => {},
  onOverTravel = () => {},
  selection,
  ...props
}: tRadialGraphic) {
  const colors = Array.isArray(colorRange)
    ? colorRange
    : fGetColorsFromGrid({
        ...colorRange,
        dimensions: [rc.rings, rc.chords],
      });

  //// Init sectors ////

  const arcStep = (arcLength - rotation) / rc.chords;
  const radStep = (radii[1] - radii[0]) / rc.rings;
  const sectors = [];
  for (let r = 0; r < rc.rings; r++) {
    for (let c = 0; c < rc.chords; c++) {
      const sectorRadii: [number, number] = [
        radii[0] + r * radStep,
        radii[0] + (r + 1) * radStep,
      ];

      const color = colors[c][r];
      let sector: tSector = {
        arcLength: arcStep,
        radii: sectorRadii,
        color,
        rc: { rings: r, chords: c },
        sectorGroupID: c,
        maxRadius: radii[1],
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
      const sectorArc = rotation + (sector.rc.chords + 0.5) * arcStep;
      group = {
        ...sector,
        sectorGroupID: groupID,
        rotationOffset: rotationOffset,
        rotation: sectorArc,
        direction: direction,
        rc: sector.rc,
        selection: selection,
      };
      group = sectorGroupModifier(group);
      groups[groupID] = group;
    }
    group.sectors = group.sectors || [];
    group.sectors.push(sector);
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

  //// Sector from touch ////

  function fSectorFromTouch(
    pageX: number,
    pageY: number,
  ): { ring: number; chord: number; angle: number } | null {
    const centerX = position[0];
    const centerY = position[1];
    const dx = pageX - centerX;
    const dy = pageY - centerY;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle < 0) {
      angle += 360;
    }
    const radius = Math.sqrt(dx * dx + dy * dy);
    const chord =
      rc.chords -
      Math.round(
        ((angle - rotation + 360 + ((rotationOffset?.value || 0) % 360)) %
          360) /
          arcStep,
      );
    const ring = Math.floor((radius - radii[0]) / radStep);
    return { ring, chord, angle };
  }

  //// PanResponder ////

  const startAngle = useRef(0);
  const totalTravel = useRef(0);
  const panHandler = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderStart: (e, gestureState) => {
      const { pageX, pageY } = e.nativeEvent;
      const sector = fSectorFromTouch(pageX, pageY);
      if (sector) {
        startAngle.current = sector.angle;
        totalTravel.current = 0;
        onSectorPress(sector);
      }
    },
    onPanResponderMove: (e, gestureState) => {
      const { pageX, pageY } = e.nativeEvent;
      const sector = fSectorFromTouch(pageX, pageY);
      if (sector) {
        if (draggable) {
          ((rotationOffset.value =
            rotationOffset.value + (startAngle.current - sector.angle)),
            (totalTravel.current += sector.angle - startAngle.current));
          startAngle.current = sector.angle;
        }
        onSectorPress(sector);
        if (Math.abs(totalTravel.current) > 30) {
          totalTravel.current = 0;
          onOverTravel();
        }
      }
    },
    onPanResponderEnd: () => {
      onSectorRelease();
    },
  });

  //// Render ////

  return (
    <View
      {...props}
      style={{
        top: position[1],
        left: position[0],
        width: radii[1] * 2,
        height: radii[1] * 2,
        position: "absolute",
        ...style,
      }}
      {...panHandler.panHandlers}
    >
      {zGroups()}
    </View>
  );
}

export type tColorRange = {
  R0A0: CLAColor;
  R1A0: CLAColor;
  R0A1: CLAColor;
  interpolation?: "linear" | "expo";
  dimensions?: [number, number];
};

export function fGetColorsFromGrid({
  R0A0,
  R1A0,
  R0A1,
  interpolation = "linear",
  dimensions,
}: tColorRange) {
  const colors: CLAColor[][] = [];
  const rdc = Math.pow(
    R0A0.c / R1A0.c,
    1 / (dimensions ? dimensions[0] - 1 : 1),
  );
  const rdl = Math.pow(
    R0A0.l / R1A0.l,
    1 / (dimensions ? dimensions[0] - 1 : 1),
  );
  const adc = Math.pow(
    R0A0.c / R0A1.c,
    1 / (dimensions ? dimensions[1] - 1 : 1),
  );
  const adl = Math.pow(
    R0A0.l / R0A1.l,
    1 / (dimensions ? dimensions[1] - 1 : 1),
  );
  const radialDelta = [R1A0.c - R0A0.c, R1A0.l - R0A0.l, R1A0.a - R0A0.a];
  const angularDelta = [R0A1.c - R0A0.c, R0A1.l - R0A0.l, R0A1.a - R0A0.a];
  const [rings, chords] = dimensions || [1, 1];
  for (let c = 0; c < chords; c++) {
    const chordColors: CLAColor[] = [];
    const chromaMax = R1A0.c * Math.pow(adc, c);
    const lightnessMax = R1A0.l * Math.pow(adl, c);

    for (let r = 0; r < rings; r++) {
      const chroma =
        interpolation == "expo"
          ? chromaMax * Math.pow(rdc, rings - r - 1)
          : R0A0.c +
            radialDelta[0] * (r / (rings - 1)) +
            angularDelta[0] * (c / (chords - 1));
      const lightness =
        interpolation == "expo"
          ? lightnessMax * Math.pow(rdl, rings - r - 1)
          : R0A0.l +
            radialDelta[1] * (r / (rings - 1)) +
            angularDelta[1] * (c / (chords - 1));
      const angle =
        R0A0.a +
        radialDelta[2] * (r / (rings - 1)) +
        angularDelta[2] * (c / (chords - 1));
      chordColors.push(new CLAColor(chroma, lightness, angle));
    }
    colors.push(chordColors);
  }
  return colors;
}
