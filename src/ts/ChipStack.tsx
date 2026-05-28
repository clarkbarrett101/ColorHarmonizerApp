import { eChipSizes, PaintChip, tPaintChip } from "./PaintChip";
import {
  refColors,
  tCLARColor,
  tColorMap,
  tPaint,
  findColors,
  tBrand,
} from "./CLAcolor";
import React, { useEffect, useState } from "react";
const clarColorsList: tPaint[] = require("./clarColors.json");
const refList: {
  c: number;
  l: number;
  ar: number;
  paintIndexes: number[];
}[] = require("./refList.json");

export type tChipFan = {
  arcLength: number;
  radius: number;
  fGetChipModifier?: (chip: tPaintChip) => tPaintChip;
  paintsA: tPaint[];
  paintsB?: tPaint[];
  origin: [number, number];
  rotationR?: number;
  size?: keyof typeof eChipSizes;
  sideA?: boolean;
  groupLayer?: number;
};

export const ChipFan = React.memo(
  ({
    paintsA,
    paintsB,
    origin,
    size = "default",
    rotationR = 0,
    arcLength,
    radius,
    sideA = true,
    fGetChipModifier = (chip) => chip,
    groupLayer = 0,
  }: tChipFan) => {
    const groupID = useState(groupLayer)[0];
    const chipStack = () => {
      const newChipStack = [];

      for (let i = 0; i < paintsA.length; i++) {
        const z = (i + 0.5) / paintsA.length;
        const chip: tPaintChip = {
          paintA: paintsA[i],
          paintB: paintsB ? paintsB[i] : undefined,
          radialOffset: radius,
          origin: {
            x: origin[0] - eChipSizes[size][0] / 2,
            y: origin[1] - eChipSizes[size][1] / 2,
          },
          size,
          startRotation: rotationR + arcLength * (z - 0.5),
          relativeZ: z,
          chipID: [groupLayer, i],
          sideA,
        };
        const modifiedChip = fGetChipModifier(chip);
        newChipStack.push(
          <PaintChip key={`${groupID}-${z}`} {...modifiedChip} />,
        );
      }
      return newChipStack;
    };
    return <>{chipStack()}</>;
  },
);
type tChipWheel = Omit<tChipFan, "paintsA"> & {
  targetColor: tCLARColor;
  brand?: tBrand;
  targetNumber?: number;
  cSteps?: number;
  lSteps?: number;
  arSteps?: number;
};

export const ColorChipFan = ({
  targetColor,
  targetNumber = 3,
  brand,
  sideA = true,
  cSteps = 4,
  lSteps = 5,
  arSteps = 18,
  ...rest
}: tChipWheel) => {
  const [paintsA, setPaintsA] = useState<tPaint[]>(
    refList
      .find((entry) => {
        return (
          Math.abs(entry.c - targetColor.c) < 1 / cSteps &&
          Math.abs(entry.l - targetColor.l) < 1 / lSteps &&
          Math.abs(entry.ar - targetColor.ar) < 44 / 7 / arSteps
        );
      })
      ?.paintIndexes.map((index) => clarColorsList[index]) ?? [],
  );
  const [paintsB, setPaintsB] = useState<tPaint[]>([]);
  const [sideABuffer, setSideABuffer] = useState(sideA);
  useEffect(() => {
    console.log("Finding colors for target", targetColor, sideA ? "A" : "B");
    const foundColors = findColors(targetColor, targetNumber, brand);
    const foundPaints = foundColors.map(
      (color) => clarColorsList[color.index!],
    );
    if (sideA) {
      setPaintsA(foundPaints);
    } else {
      setPaintsB(foundPaints);
    }
    setSideABuffer(sideA);
  }, [sideA]);
  return (
    <ChipFan
      paintsA={paintsA}
      paintsB={paintsB}
      sideA={sideABuffer}
      {...rest}
    />
  );
};
