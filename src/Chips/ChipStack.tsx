import { eChipSizes, PaintChip, tPaintChip } from "./PaintChip";
import {
  refColors,
  tCLARColor,
  tColorMap,
  tPaint,
  findColors,
  tBrand,
} from "../utils/CLAcolor";
import { SharedValue, useSharedValue } from "react-native-reanimated";
import React, { useEffect, useRef, useState } from "react";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { useSoundContext } from "../Contexts/SoundContext";
import { View } from "react-native";
import { tRadialObject } from "../Radials/SectorTypes";
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
  const lastColor = useSharedValue<tCLARColor>(targetColor);
  const { fAddPaintsToPresent } = useSoundContext();

  function fNearestColors() {
    const foundColors = findColors(targetColor, targetNumber, brand);
    const foundPaints = foundColors.map(
      (color) => clarColorsList[color.index!],
    );
    console.log("Found paints", foundPaints.length, "for target", targetColor);
    lastColor.value = targetColor;
    if (!sideA) {
      setPaintsB(foundPaints);
    } else {
      setPaintsA(foundPaints);
    }

    setSideABuffer(sideA);
  }
  useEffect(() => {
    fAddPaintsToPresent("chipStack", [...paintsA, ...paintsB]);
  }, [paintsA, paintsB]);

  useEffect(() => {
    if (
      targetColor.c !== lastColor.value.c ||
      targetColor.l !== lastColor.value.l ||
      targetColor.ar !== lastColor.value.ar
    ) {
      fNearestColors();
    }
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
export function AccentChipFan({
  brand,
  ...rest
}: Omit<tChipWheel, "targetColor">) {
  const { vAccentC, vAccentL, vAccentAR } = useUserContext();
  const targetColor = {
    c: vAccentC.state,
    l: vAccentL.state,
    ar: vAccentAR.state,
  };
  return <ColorChipFan targetColor={targetColor} brand={brand} {...rest} />;
}
type tChipRow = tRadialObject &
  Partial<tPaintChip> & {
    paints: tPaint[];
    id: number;
    grouped: boolean;
  };
export function ChipRow({ id, paints, grouped, ...radialProps }: tChipRow) {
  if (!grouped)
    return (
      <>
        {paints.map((paint, index) => (
          <PaintChip
            key={`${id}-${index}`}
            paintA={paint}
            chipID={[id, index]}
            size={"small"}
            {...radialProps}
          />
        ))}
      </>
    );
  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        shadowColor: "#000",
        shadowOffset: { width: -2, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 3,
        zIndex: id,
      }}
    >
      {paints.map((paint, index) => (
        <PaintChip
          key={`${id}-${index}`}
          paintA={paint}
          chipID={[id, index]}
          size={"small"}
          {...radialProps}
        />
      ))}
    </View>
  );
}
