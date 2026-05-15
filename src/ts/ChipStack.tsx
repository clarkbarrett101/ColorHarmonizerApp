import { eChipSizes, PaintChip, tPaintChip } from "./PaintChip";
import { tCLARColor, tPaint } from "./CLAcolor";
import { useEffect, useState } from "react";
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
  fGetChipModifier?: (chip: tPaintChip) => tPaintChip;
  paintsA: tPaint[];
  paintsB?: tPaint[];
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
    const foundColors =
      refList
        .find((entry) => {
          return (
            Math.abs(entry.c - targetColor.c) < 1 / cSteps &&
            Math.abs(entry.l - targetColor.l) < 1 / lSteps &&
            Math.abs(entry.ar - targetColor.ar) < 44 / 7 / arSteps
          );
        })
        ?.paintIndexes.map((index) => clarColorsList[index]) ?? [];
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
  if (targetNumber > 0) paintRanks = paintRanks.slice(0, targetNumber);
  return paintRanks;
}
export type tClosestColors = {
  moreRed?: tPaint;
  moreYellow?: tPaint;
  moreBlue?: tPaint;
  moreWhite?: tPaint;
  moreBlack?: tPaint;
  moreGrey?: tPaint;
};
function calculateRYBScore(color, index) {
  if (index === 0) {
    return color[0] - color[1] - 2 * color[2];
  } else if (index === 1) {
    return color[0] + color[1] - color[2] - Math.abs(color[0] - color[1]) / 2;
  } else {
    return -2 * color[0] - color[1] / 2 + color[2];
  }
}
export function fClosestColors(targetColor: tPaint): tPaint[] {
  let rankedColors = findColors(targetColor.clar, -1);
  let colorMap: tPaint[] = Array(6).fill(undefined);
  const targetScores = targetColor.rgb.map((c, i) =>
    calculateRYBScore(targetColor.rgb, i),
  );
  console.log(
    "Finding closest colors to",
    targetColor.name,
    targetColor.clar,
    targetScores,
  );
  for (let rank of rankedColors) {
    const paint = clarColorsList[rank.index];
    const paintScores = paint.rgb.map((c, i) =>
      calculateRYBScore(paint.rgb, i),
    );
    if (!colorMap[5] && paint.clar.c < targetColor.clar.c * 0.8) {
      colorMap[5] = paint;
      console.log("Found more grey:", paint.name, paint.clar);
      continue;
    }
    if (!colorMap[1] && paintScores[1] > targetScores[1] * 1.5) {
      colorMap[1] = paint;
      console.log("Found more yellow:", paint.name, paintScores[1]);
      continue;
    }
    if (!colorMap[0] && paintScores[0] > targetScores[0] * 1.5) {
      colorMap[0] = paint;
      console.log("Found more red:", paint.name, paintScores[0]);
      continue;
    }

    if (!colorMap[2] && paintScores[2] > targetScores[2] * 1.5) {
      colorMap[2] = paint;
      console.log("Found more blue:", paint.name, paintScores[2]);
      continue;
    }
    if (
      !colorMap[3] &&
      paint.clar.l > targetColor.clar.l * 1.2 &&
      paint.clar.c <= targetColor.clar.c
    ) {
      colorMap[3] = paint;
      console.log("Found more white:", paint.name, paint.clar);
      continue;
    }

    if (
      !colorMap[4] &&
      paint.clar.l < targetColor.clar.l * 0.9 &&
      paint.clar.c <= targetColor.clar.c
    ) {
      colorMap[4] = paint;
      console.log("Found more black:", paint.name, paint.clar);
      continue;
    }
  }
  return colorMap.filter((paint) => paint !== undefined) as tPaint[];
}
