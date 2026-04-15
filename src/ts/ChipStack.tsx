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
            origin[0] + Math.cos(rotationR + 11 / 7) * index * size[1] * 0.55,
            origin[1] - Math.sin(rotationR + 11 / 7) * index * size[1] * 0.55,
          ],
          grabbed: false,
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
