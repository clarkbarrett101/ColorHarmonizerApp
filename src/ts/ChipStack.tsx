import { View } from "react-native";
import { PaintChip, tPaintChip } from "./PaintChip";
import { tCLARColor, tPaint } from "./CLAcolor";
import { JSX, useCallback, useEffect, useState } from "react";
import { tMatrix } from "./AnimatedMatrix";
const clarColorsList: tPaint[] = require("./clarColors.json");

export type tChipStack = {
  paints: tPaint[];
  origin: [number, number];
  rotationR?: number;
  size?: [number, number];
  collapsed?: boolean;
};
export const ChipStack = ({
  paints,
  origin,
  size = [120, 75],
  rotationR = 0,
  collapsed = false,
}: tChipStack) => {
  return (
    <>
      {paints.map((paint, index) => {
        const chip: tPaintChip = {
          paint,
          startPosition: {
            x:
              origin[0] +
              Math.cos(rotationR + 11 / 7) * index * size[1] * 0.55 -
              size[0] / 2,
            y:
              origin[1] -
              Math.sin(rotationR + 11 / 7) * index * size[1] * 0.55 -
              size[1] / 2,
          },
          size,
          startRotation: -rotationR,
        };

        return <PaintChip key={index} {...chip} />;
      })}
    </>
  );
};

export type tChipFan = tChipStack & {
  arcLength: number;
  radius: number;
  direction?: 1 | -1;
  firstIndex?: number;
  fGetChipModifier?: (chip: tPaintChip) => tPaintChip;
  wTransformMatrix?: (matrix: Partial<tMatrix>) => tMatrix;
  groupID?: number;
};

export const ChipFan = ({
  paints,
  origin,
  size = [120, 75],
  rotationR = 0,
  arcLength,
  radius,
  direction = 1,
  collapsed = false,
  firstIndex = 0.5,
  fGetChipModifier = (chip) => chip,
  groupID = 0,
}: tChipFan) => {
  const chipStack = useCallback(() => {
    const newChipStack = [];
    for (let i = 0; i < paints.length; i++) {
      const z = (i + 0.5) / paints.length;
      const chip: tPaintChip = {
        paint: paints[i],
        radialOffset: radius,
        startPosition: {
          x: origin[0] - size[0] / 2,
          y: origin[1] - size[1] / 2,
        },
        size,
        startRotation:
          -direction *
          (rotationR + arcLength * ((z - 0.5) * (collapsed ? 0.1 : 1))),
        zIndex: (1 - Math.abs(z - firstIndex)) * paints.length,
        shadow: !collapsed || i === 0,
        chipID: [groupID, i],
      };
      const modifiedChip = fGetChipModifier(chip);
      newChipStack.push(<PaintChip key={i} {...modifiedChip} />);
    }
    return newChipStack;
  }, [
    paints,
    origin,
    size,
    rotationR,
    arcLength,
    radius,
    direction,
    collapsed,
  ]);
  return <>{chipStack()}</>;
};
type tChipWheel = Omit<tChipFan, "paints"> & {
  targetColor: tCLARColor;
  targetNumber?: number;
};

export const ColorChipFan = ({
  targetColor,
  targetNumber = 3,
  collapsed = false,
  ...rest
}: tChipWheel) => {
  const [paints, setPaints] = useState<tPaint[]>([]);
  useEffect(() => {
    const foundColors = findColors(targetColor, targetNumber);
    setPaints(foundColors);
  }, [targetColor, targetNumber]);
  return (
    <>
      <ChipFan paints={paints} collapsed={collapsed} {...rest} />
    </>
  );
};
type tPaintRank = {
  index: number;
  distance: number;
};

function findColors(
  { c = 0.5, l = 0.5, ar = 0 }: tCLARColor,
  targetNumber = 3,
) {
  let y = l;
  let u = Math.cos(ar) * 0.5 * c;
  let v = Math.sin(ar) * 0.5 * c;
  let paintRanks: tPaintRank[] = [];

  for (let i = 0; i < clarColorsList.length; i++) {
    const paintColor = clarColorsList[i];
    const dy = paintColor.yuv[0] - y;
    const du = paintColor.yuv[1] - u;
    const dv = paintColor.yuv[2] - v;
    const distance =
      Math.sqrt(dy * dy + du * du + dv * dv) +
      (paintColor.brand === "Behr" ? 0.02 : 0);
    paintRanks.push({
      index: i,
      distance,
    });
  }
  paintRanks.sort((a, b) => a.distance - b.distance);
  paintRanks = paintRanks.slice(0, targetNumber);
  const midDistance = paintRanks[Math.floor(targetNumber / 2)].distance;
  paintRanks.sort((a, b) => {
    const midDiffA = Math.abs(a.distance - midDistance);
    const midDiffB = Math.abs(b.distance - midDistance);
    return midDiffA - midDiffB;
  });

  let paintList = paintRanks.map((rank) => clarColorsList[rank.index]);

  return paintList;
}
