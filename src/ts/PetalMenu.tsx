import { View } from "react-native";
import React, { ReactNode, use, useCallback, useEffect } from "react";
import {
  SharedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { TextProps, Text } from "react-native-svg";
import { fCLARColorToRGB, tCLARColor } from "./CLAcolor";
import { RadialGraphic } from "./RadialGraphic";
import { tAttributeModifier, tAttributeMap } from "./Actor";
import { RadialContext, useRadialContext } from "./RadialContext";
import { usePanManager } from "./PanManager";
import { tSector, tSectorGroup } from "./sectorTypes";
import { Sector } from "./Sector";
import { SectorGroup } from "./SectorGroup";

export type tMenu = {
  width?: number;
  height?: number;
  options: string[];
  selection?: number;
  setSelection?: (index: number) => void;
  collapsed?: boolean;
};

export const PetalMenu = ({
  height = 200,
  width = 200,
  options,
  selection,
  setSelection,
  collapsed = false,
}: tMenu) => {
  const collapseAnim = useSharedValue(collapsed ? 0 : 1);
  useEffect(() => {
    collapseAnim.value = withTiming(collapsed ? 0 : 1, { duration: 500 });
  }, [collapsed]);
  const optionKeys = Object.keys(options);
  const { dC, dL, dAR, origin, mainRotationR, totalArcLength } =
    useRadialContext();
  const radius = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2)) / 2;

  const vPanPos = useSharedValue({ angle: 0, radius: 0 });
  const callBack = useCallback(() => {
    const ring = Math.floor(vPanPos.value.radius / radius / optionKeys.length);
    console.log(ring);
    setSelection && setSelection(ring);
  }, [setSelection, optionKeys.length, radius, vPanPos]);

  const { registerHitBox: registerZone } = usePanManager();
  useEffect(() => {
    const unregisterZone = registerZone({
      shape: "capsule",
      origin: origin || [0, 0],
      arcLength: totalArcLength,
      radii: [radius, radius * optionKeys.length],
      rotationR: mainRotationR,
      vPanPos,
      fOnEnter: callBack,
      fOnLeave: () => {},
    });
    return () => {
      unregisterZone();
    };
  }, []);
  const mColorModifier: tAttributeModifier = {
    modID: 0,
    deps: [dC, dL, dAR],
    modifier: (input: tAttributeMap) => {
      "worklet";
      const rdc = Math.pow(0.5, 1 / Math.max(optionKeys.length - 1, 1));
      const rdl = Math.pow(0.5, 1 / Math.max(optionKeys.length - 1, 1));
      let c = Math.pow(rdc, optionKeys.length - 1 - input.ring) * dC.value;
      let l = Math.pow(rdl, optionKeys.length - 1 - input.ring) * dL.value;
      let ar = dAR.value - 2 / 7 + (input.chord / 12) * (4 / 7);
      const [r, g, b] = fCLARColorToRGB({ c, l, ar });
      return {
        ...input,
        red: r,
        green: g,
        blue: b,
      };
    },
  };
  function fLerp(a: number, b: number, t: number) {
    "worklet";
    return a + (b - a) * t;
  }
  const mTransformModifier: tAttributeModifier = {
    modID: 1,
    deps: [collapseAnim],
    modifier: (input: tAttributeMap) => {
      "worklet";
      const x = input.translateX - input.ring * radius * collapseAnim.value;
      const y = input.translateY;
      return {
        ...input,
        translateX: x,
        translateY: y,
        zIndex: optionKeys.length - Math.abs(selection - input.ring),
      };
    },
  };
  const sectors = useCallback(() => {
    const group = [];
    for (let i = 0; i < optionKeys.length; i++) {
      const sector: tSector = {
        arcLength: totalArcLength,
        chord: 0,
        ring: i,
        radii: [radius * i, radius * (i + 1)],
      };
      const text = (
        <Text
          key={i}
          fontSize={14}
          textAnchor="middle"
          verticalAlign="middle"
          transform={[
            { rotate: `${11 / 7}rad` },
            { translateY: -radius * i - radius / 2 },
          ]}
        >
          {options[i]}
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
      };
      group.push(<SectorGroup key={i} {...sectorGroup} />);
    }
    return group;
  }, [options]);

  return (
    <RadialContext
      value={{
        mColorModifier,
        radii: [0, radius * optionKeys.length],
        mTransformModifier,
      }}
    >
      {sectors()}
    </RadialContext>
  );
};
