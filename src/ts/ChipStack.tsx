import { View } from "react-native";
import { PaintChip, tPaint, tPaintChip } from "./PaintChip";

export type tChipStack = {
  paints: tPaint[];
  origin: [number, number];
  rotationR?: number;
  size?: [number, number];
};
export const ChipStack = ({
  paints,
  origin,
  size = [120, 75],
  rotationR = 0,
}: tChipStack) => {
  return (
    <>
      {paints.map((paint, index) => {
        const chip: tPaintChip = {
          paint,
          startPosition: [
            origin[0] +
              Math.cos(rotationR + 11 / 7) * index * size[1] * 0.55 -
              size[0] / 2,
            origin[1] -
              Math.sin(rotationR + 11 / 7) * index * size[1] * 0.55 -
              size[1] / 2,
          ],
          size,
          startRotation: -rotationR,
        };

        return <PaintChip key={index} {...chip} />;
      })}
    </>
  );
};
export type tChipWheel = tChipStack & {
  rc: { rings: number; chords: number };
  arcLength: number;
};

export const ChipWheel = ({
  rc: { rings, chords },
  arcLength,
  paints,
  origin,
  size = [120, 75],
  rotationR = 0,
}: tChipWheel) => {
  const chordStack = [];
  for (let i = 0; i < chords; i++) {
    const chipStack: tChipStack = {
      paints: paints.slice(i * rings, (i + 1) * rings),
      origin,
      size,
      rotationR: -(rotationR + arcLength * (i / chords) + Math.PI / 2),
    };
    chordStack.push(<ChipStack key={i} {...chipStack} />);
  }
  return <>{chordStack}</>;
};

export type tChipFan = tChipStack & {
  arcLength: number;
  radius: number;
  direction?: 1 | -1;
};

export const ChipFan = ({
  paints,
  origin,
  size = [120, 75],
  rotationR = 0,
  arcLength,
  radius,
  direction = 1,
}: tChipFan) => {
  const chipStack = [];
  for (let i = 0; i < paints.length; i++) {
    const chip: tPaintChip = {
      paint: paints[i],
      origin,
      radialOffset: radius,
      startPosition: [
        origin[0] +
          Math.cos(
            rotationR + arcLength * ((i - paints.length / 2) / paints.length),
          ) *
            radius,
        origin[1] +
          Math.sin(
            rotationR + arcLength * ((i - paints.length / 2) / paints.length),
          ) *
            radius,
      ],
      size,
      startRotation:
        -direction *
        (rotationR + arcLength * ((i - paints.length / 2) / paints.length)),
    };
    chipStack.push(<PaintChip key={i} {...chip} />);
  }
  return <>{chipStack}</>;
};
