import { eChipSizes, PaintChip, tPaintChip } from "./PaintChip";
import { tCLARColor, tPaint } from "./CLAcolor";
import { useEffect, useState } from "react";
import { tMatrix } from "./Verse";
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
  direction?: 1 | -1;
  firstIndex?: number;
  fGetChipModifier?: (chip: tPaintChip) => tPaintChip;
  wTransformMatrix?: (matrix: Partial<tMatrix>) => tMatrix;
  paintsA: number[];
  paintsB?: number[];
  origin: [number, number];
  rotationR?: number;
  size?: keyof typeof eChipSizes;
  sideA?: boolean;
  groupLayer?: number;
};

export const ChipFan = ({
  paintsA,
  paintsB,
  origin,
  size = "default",
  rotationR = 0,
  arcLength,
  radius,
  direction = 1,
  sideA = true,
  firstIndex = 0.5,
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
        zIndex: Math.round((1 - Math.abs(z - firstIndex)) * paintsA.length),
        chipID: [groupLayer, z],
        sideA,
        groupLayer,
        direction,
      };
      const modifiedChip = fGetChipModifier(chip);
      newChipStack.push(
        <PaintChip key={`${groupID}-${z}`} {...modifiedChip} />,
      );
    }
    return newChipStack;
  };
  return <>{chipStack()}</>;
};
type tChipWheel = Omit<tChipFan, "paintsA"> & {
  targetColor: tCLARColor;
  targetNumber?: number;
  cSteps?: number;
  lSteps?: number;
  arSteps?: number;
};

export const ColorChipFan = ({
  targetColor,
  targetNumber = 3,
  sideA = true,
  cSteps = 4,
  lSteps = 5,
  arSteps = 18,
  ...rest
}: tChipWheel) => {
  const [paintsA, setPaintsA] = useState<number[]>(
    refList.find((entry) => {
      return (
        Math.abs(entry.c - targetColor.c) < 1 / cSteps &&
        Math.abs(entry.l - targetColor.l) < 1 / lSteps &&
        Math.abs(entry.ar - targetColor.ar) < 44 / 7 / arSteps
      );
    })?.paintIndexes,
  );
  const [paintsB, setPaintsB] = useState<number[]>([]);
  const [sideABuffer, setSideABuffer] = useState(sideA);
  useEffect(() => {
    console.log("Finding colors for target", targetColor, sideA ? "A" : "B");
    const foundColors = refList.find((entry) => {
      return (
        Math.abs(entry.c - targetColor.c) < 1 / cSteps &&
        Math.abs(entry.l - targetColor.l) < 1 / lSteps &&
        Math.abs(entry.ar - targetColor.ar) < 44 / 7 / arSteps
      );
    })?.paintIndexes;
    if (sideA) {
      setPaintsA(foundColors);
    } else {
      setPaintsB(foundColors);
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
    if (paintColor.index === undefined) paintColor.index = i;
    const dy = paintColor.yuv[0] - y;
    const du = paintColor.yuv[1] - u;
    const dv = paintColor.yuv[2] - v;
    const distance =
      Math.sqrt(dy * dy + du * du + dv * dv) +
      (paintColor.brand === "Behr" ? 0.02 : 0);
    paintRanks.push({
      index: paintColor.index!,
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

  return paintRanks;
}
