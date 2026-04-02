import { useState } from "react";
import { CLAColor } from "./CLAcolor";
import { fGetColorsFromGrid, RadialGraphic } from "./RadialGraphic";
import { Dimensions } from "react-native";
import { fMakePetalPath, tSector, tSectorGroup } from "./Sector";

export type tTintSelector = {
  color?: CLAColor;
  setColor?: (color: CLAColor) => void;
  rc?: { rings: number; chords: number };
  arcLength?: number;
  rotation?: number;
  direction?: 1 | -1;
  radii?: [number, number];
};

export function TintSelector({
  color = new CLAColor(0.5, 0.4, 180),
  setColor,
  rc = { rings: 6, chords: 4 },
  arcLength = 30,
  rotation = 180,
  direction = 1,
  radii = [150, 300],
}: tTintSelector) {
  const dimensions = Dimensions.get("window");
  const [selection, setSelection] = useState<[number, number]>([0, 0]);
  const [colorRange, setColorRange] = useState<CLAColor[][]>(
    fGetColorsFromGrid({
      R0A0: new CLAColor(0.2, 0.2, color.a),
      R1A0: new CLAColor(0.2, 0.8, color.a),
      R0A1: new CLAColor(0.8, 0.2, color.a),
      interpolation: "linear",
      dimensions: [rc.rings, rc.chords],
    }),
  );
  const angleToChord = (angle: number) => {
    const adjustedAngle = angle - rotation;
    const chord = Math.floor(adjustedAngle / (arcLength / rc.chords));
    return chord;
  };
  const chordToAngle = (chord: number) => {
    return (chord + 0.5) * (arcLength / rc.chords) + rotation;
  };
  function distanceFromSelection({
    rings,
    chords,
  }: {
    rings: number;
    chords: number;
  }) {
    return Math.abs(chords - selection[1]) + Math.abs(rings - selection[0]);
  }

  return (
    <RadialGraphic
      rotation={rotation}
      arcLength={arcLength}
      rc={rc}
      radii={radii}
      colorRange={colorRange}
      onSectorPress={({ ring, chord }) => {
        if (ring >= rc.rings || chord >= rc.chords || ring < 0 || chord < 0)
          return;
        setSelection([ring, chord]);
      }}
      selection={{
        value: [color ? color.l - 0.05 : 0, color ? color.l + 0.05 : 1],
      }}
      direction={direction}
      position={[dimensions.width, dimensions.height / 2]}
      sectorModifier={(sector: tSector) => {
        const distance = distanceFromSelection(sector.rc);
        sector.sectorGroupID = sector.rc.chords * rc.rings + sector.rc.rings;
        sector.arcLength =
          distance <= 0.5 ? sector.arcLength + 2 : sector.arcLength;
        sector.radii =
          distance <= 0.5
            ? [sector.radii[0] - 5, sector.radii[1] + 5]
            : sector.radii;
        return sector;
      }}
      sectorGroupModifier={(group: tSectorGroup) => {
        const distance = distanceFromSelection(group.rc);
        group.style = {
          zIndex: group.rc.rings + (distance <= 0.5 ? 100 : 0),
          shadowRadius: distance <= 0.5 ? 10 : 3,
          shadowOffset: {
            width: distance <= 0.5 ? -5 : 0,
            height: distance <= 0.5 ? -5 : 0,
          },
        };
        return group;
      }}
      angleToChord={angleToChord}
      chordToAngle={chordToAngle}
    />
  );
}
