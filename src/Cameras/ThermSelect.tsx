import { useCallback, useEffect, useState } from "react";
import { ePanEvent, usePanManager } from "../Contexts/PanManager";
import { tAttributeMap, tAttributeModifier } from "../utils/Actor";
import { Text } from "react-native-svg";
import {
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useRadialContext, RadialContext } from "../Radials/RadialContext";
import { tSector, tSectorGroup } from "../Radials/SectorTypes";
import { SectorGroup } from "../Radials/SectorGroup";
import { scheduleOnRN } from "react-native-worklets";
import { eLayers } from "../Contexts/UserContext";
import { kelvin_table, tTemp } from "./KelvinTemp";
import { usePanHitBox } from "../Buttons/PanHitBox";

export type tThermSelect = {
  radius?: number;
  tempK: number;
  setTemp: (temp: tTemp) => void;
  mainRotationR?: number;
  origin?: [number, number];
  tempList?: number[];
  arcLength?: number;
};
const defaultTempList = [3500, 4500, 5500, 6500, 8000, 10000, 12000];
export const ThermSelect = (props: tThermSelect) => {
  let temps = (props.tempList || defaultTempList).map((k) => kelvin_table[k]);
  const ctx = useRadialContext();
  const origin = props.origin || ctx.origin || [0, 0];
  const totalArcLength = props.arcLength || ctx.totalArcLength || 44 / 7;
  const mainRotationR = props.mainRotationR || ctx.mainRotationR || 22 / 7;
  const radius = props.radius ? props.radius : 40;
  const vActive = useSharedValue(1);
  const vSelection = useSharedValue(0);
  useEffect(() => {
    let closestIndex = -1;
    let closestDistance = Number.MAX_VALUE;
    for (let i = 0; i < temps.length; i++) {
      const distance = Math.abs(temps[i].k - props.tempK);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    }
  }, [props.tempK]);
  const dActive = useDerivedValue(() => 1 - vActive.value, []);
  usePanHitBox({
    id: "" + origin[0] + origin[1],
    shape: "capsule",
    priority: 10,
    origin: [origin[0], origin[1] + radius / 2],
    arcLength: totalArcLength,
    radii: [radius * 0.7, radius * temps.length],
    capsuleMod: dActive,
    rotationR: mainRotationR,
    fOnUpdate: (state, pos) => {
      "worklet";
      console.log("Pan update", state.value, vActive.value);
      if (vActive.value < 0.5) {
        if (state.value == "drag") {
          const index = Math.round(pos.value.radius / radius);
          if (
            index >= 0 &&
            index < temps.length &&
            index !== vSelection.value
          ) {
            vSelection.value = index;
            scheduleOnRN(props.setTemp, temps[index]);
          }
        }
        if (state.value == "release" || state.value == "tap") {
          const index = Math.round(pos.value.radius / radius);
          if (
            index >= 0 &&
            index < temps.length &&
            index !== vSelection.value
          ) {
            vSelection.value = index;
            scheduleOnRN(props.setTemp, temps[index]);
          }
          vActive.value = withTiming(1, { duration: 500 });
          state.value = "leave";
        }
      } else {
        if (state.value == "enter" || state.value == "tap") {
          vActive.value = withTiming(0, { duration: 500 });
          if (state.value == "tap") {
            state.value = "leave";
          }
        }
      }
    },
  });

  function fLerp(a: number, b: number, t: number) {
    "worklet";
    return a + (b - a) * t;
  }
  const mTransformModifier: tAttributeModifier = {
    modID: 1,
    deps: [vSelection, vActive],
    modifier: (input: tAttributeMap) => {
      "worklet";
      const x = fLerp(input.ring * radius, input.translateX, vActive.value);
      const selected = vSelection.value === input.ring;

      return {
        ...input,
        translateX: x,
        scaleX: selected ? 1.1 : 1,
        scaleY: selected ? 1.1 : 1,
        shadowOpacity:
          vActive.value < 1
            ? input.shadowOpacity
            : selected
              ? input.shadowOpacity
              : 0,
        zIndex:
          temps.length -
          Math.abs(vSelection.value - input.ring) +
          eLayers.colorMixer -
          10,
      };
    },
  };
  const adjustedRotation = Math.round(mainRotationR / (11 / 7)) * (-11 / 7);
  const sectors = useCallback(() => {
    const group = [];
    for (let i = 0; i < temps.length; i++) {
      const sector: tSector = {
        arcLength: totalArcLength,
        chord: 0,
        ring: i,
        radii: [radius * 0.2, radius * 1.2],
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
            { translateY: radius * 0.7 },
          ]}
        >
          {temps[i].k + "K"}
        </Text>
      );
      const sectorGroup: tSectorGroup = {
        arcLength: totalArcLength,
        chord: 0,
        rotationR: mainRotationR,
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
        radii: [radius, radius * temps.length],
        mTransformModifier,
        totalArcLength,
        mainRotationR,
      }}
    >
      {sectors()}
    </RadialContext>
  );
};
const paths = {
  sun: "M0-46-7-26C-5-27-2-27 0-27S5-27 7-26ZM33-32 14-24C18-21 21-18 24-14ZM-32-32-24-14C-21-18-18-21-14-24ZM-26-7-46 0-26 7C-27 5-27 2-27 0-27-2-27-5-26-7ZM26-7C27-5 27-2 27 0 27 2 27 5 26 7L46 0ZM24 14C21 18 18 21 14 24L33 33ZM-24 14-32 33-14 24C-18 21-21 18-24 14ZM-7 26 0 46 7 26C5 27 2 27 0 27-2 27-5 27-7 26ZM-24 0A2 2 90 0024 0 2 2 90 00-24 0",
  sunset:
    "M0-26-7-6C-5-7-2-7 0-7S5-7 7-6ZM33-12 14-4C18-1 21 2 24 6ZM-32-12-24 6C-21 2-18-1-14-4ZM-26 10-45 15C-45 15-27 18-27 18-27 18-27 15-26 10ZM26 10C27 15 27 18 27 18L45 15ZM24 20A2 2 90 00-24 20Z",
  candle:
    "M-1-226c-28 0-94 87-94 159 0 59 29 80 69 95-15-16-26-44-26-76 0-49 31-89 53-89 21 0 53 40 53 89 0 30-9 57-23 73 36-18 62-36 62-92 0-71-67-159-94-159zm7 176-19 3c6 39 7 69 4 98-25-1-50-6-74-15v95c-3 26-22 31-22 53 0 20 15 26 22 18v36h165v-88c9 11 27 3 28-21 0-29-25-35-28-69V35c-24 9-48 14-72 15 2-30 1-61-4-101z",
  cloud:
    "M51-87C98-92 142-76 165-36Q196-110 134-134 66-154 50-87ZM-95-120C-143-120-181-84-181-39V-39A78 78 0 00-177-17L-175-8-184-6C-197-3-208 2-215 8-222 15-226 22-226 29V29C-226 37-220 46-210 53-199 60-184 65-167 65-159 65-150 64-142 61L-138 60-134 63C-117 77-84 87-49 87-35 87-21 86-8 83L0 81 3 88C11 107 38 122 70 122 90 122 108 116 120 107 133 98 140 87 140 75 140 75 140 74 140 74L139 64 149 65C152 65 156 65 159 65 182 65 203 61 218 55 225 53 230 49 234 46 237 44 238 41 238 40 238 39 237 37 234 34 232 32 227 29 221 26 209 20 190 16 169 15L159 15 161 4A44 44 0 00162-5C162-23 151-40 132-53 112-67 84-75 53-75 33-75 13-71-5-64L-13-61-16-69C-29-100-60-120-95-120H-95Z",
  x: "M5 10 10 5 5 0 10-5 5-10 0-5-5-10-10-5-5 0-10 5-5 10 0 5 5 10M15 0A1 1 0 01-15 0 1 1 0 0115 0",
  plus: "M-3 10 3 10 3 3 10 3 10-3 3-3 3-10-3-10-3-3-10-3-10 3-3 3-3 10M15 0A1 1 45 01-15 0 1 1 45 0115 0",
  camera:
    "M93 32H78L69 18H32l-9 14H9c-6 0-7 3-7 7V75c0 5 4 7 9 7H93c4 0 7-4 7-8V40c0-3-1-8-7-8zm3 43c0 1-2 3-3 3H9c-2 0-3-1-3-3V39c0-2 2-3 3-3h18l8-13h31l6 10 2 3H93c2 0 3 3 3 3v36zM51 32c-12 0-22 10-22 22s10 22 22 22 22-10 22-22-10-22-22-22zm0 38c-9 0-16-7-16-16s7-16 16-16 16 7 16 16-7 16-16 16z",
};
