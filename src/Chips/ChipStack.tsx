import { eChipSizes, PaintChip, tPaintChip } from "./PaintChip";
import {
  refColors,
  tCLARColor,
  tColorMap,
  tPaint,
  findColors,
  tBrand,
} from "../utils/CLAcolor";
import React, { useEffect, useState } from "react";
const clarColorsList: tPaint[] = require("../clarColors.json");

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
          origin: [origin[0], origin[1]],
          size,
          rotationR: rotationR + arcLength * (z - 0.5),
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
  const [paintsA, setPaintsA] = useState<tPaint[]>([]);
  const [paintsB, setPaintsB] = useState<tPaint[]>([]);
  const [sideABuffer, setSideABuffer] = useState(sideA);
  useEffect(() => {
    console.log("Finding colors for target", targetColor, sideA ? "A" : "B");
    const foundColors = findColors(targetColor, targetNumber, brand);
    const foundPaints = foundColors.map(
      (color) => clarColorsList[color.index!],
    );
    console.log("Found paints", foundPaints.length, "for target", targetColor);
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
