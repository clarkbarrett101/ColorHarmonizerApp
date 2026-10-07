import { View } from "react-native";
import React, { useCallback, useEffect } from "react";
import {
  fGetBumpSize,
  tRadialObject,
  tSector,
  tSectorGroup,
} from "../Radials/SectorTypes";
import { kelvin_table, tTemp } from "./KelvinTemp";
import { Text } from "react-native-svg";
import { RadialContext } from "../Radials/RadialContext";
import { SectorGroup } from "../Radials/SectorGroup";
import { eLayers } from "../Contexts/UserContext";
import { tAttributeModifier, tAttributeMap } from "../utils/Actor";
import { useSharedValue } from "react-native-reanimated";
export type tThermo = tRadialObject & {
  tempList?: number[];
  tempK: number;
  totalLength?: number;
};
export function Thermo({
  tempList = [3500, 4500, 5500, 6500, 8000, 10000, 12000],
  tempK,
  arcLength = 2 / 7,
  rotationR = 0,
  origin = [0, 0],
  totalLength = 500,
}: tThermo) {
  const temps = tempList.map((k) => kelvin_table[k]);
  const radius = totalLength / temps.length;
  const adjustedRotation = Math.round(rotationR / (11 / 7)) * (-11 / 7);
  const vSelection = useSharedValue(0);
  useEffect(() => {
    let closestIndex = -1;
    let closestDistance = Number.MAX_VALUE;
    for (let i = 0; i < temps.length; i++) {
      const distance = Math.abs(temps[i].k - tempK);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    }
    vSelection.value = closestIndex;
  }, [tempK]);

  const mTransformModifier: tAttributeModifier = {
    modID: 1,
    deps: [vSelection],
    modifier: (input: tAttributeMap) => {
      "worklet";
      const selected = vSelection.value === input.ring;

      return {
        ...input,
        translateX: (1 + input.ring - temps.length / 2) * radius,
        scaleX: selected ? 1.1 : 1,
        scaleY: selected ? 1.1 : 1,
        zIndex:
          temps.length -
          Math.abs(vSelection.value - input.ring) +
          eLayers.colorMixer -
          10,
      };
    },
  };
  const sectors = useCallback(() => {
    const group = [];
    for (let i = 0; i < temps.length; i++) {
      const sector: tSector = {
        arcLength: arcLength,
        chord: 0,
        ring: i,
        radii: [radius * 0.1, radius * 1.1],
        rgb: temps[i].rgb,
      };
      const text = (
        <Text
          key={i}
          fontFamily="Outfit"
          fontSize={18}
          textAnchor="middle"
          fontWeight={2000}
          opacity={0.65}
          fill={"black"}
          verticalAlign={0.1}
          transform={[
            { rotate: `${adjustedRotation}rad` },
            { translateY: radius * 0.6 },
          ]}
        >
          {temps[i].k + "K"}
        </Text>
      );
      const sectorGroup: tSectorGroup = {
        arcLength,
        chord: 0,
        rotationR,
        sectorGroupID: i,
        ring: i,
        children: [text],
        sectors: [sector],
        origin,
      };
      group.push(<SectorGroup key={i} {...sectorGroup} />);
    }
    return group;
  }, [temps]);

  return (
    <RadialContext
      value={{
        origin,

        mTransformModifier,
      }}
    >
      {sectors()}
    </RadialContext>
  );
}
