import { View } from "react-native";
import React, { ReactNode, useCallback, useEffect } from "react";
import { SharedValue, useSharedValue } from "react-native-reanimated";
import { TextProps, Text } from "react-native-svg";
import { fCLARColorToRGB, tCLARColor } from "./CLAcolor";
import { RadialGraphic } from "./RadialGraphic";
import { tAttributeModifier, tAttributeMap } from "./Actor";
import { RadialContext, useRadialContext } from "./RadialContext";
import { usePanManager } from "./PanManager";
import { tSectorGroup } from "./sectorTypes";

export type tMenu = {
  width?: number;
  height?: number;
  options: string[];
  onValueChange?: (value: number) => void;
};

export const PetalMenu = ({
  height = 200,
  width = 200,
  options,
  onValueChange,
}: tMenu) => {
  const optionKeys = Object.keys(options);
  const { dC, dL, dAR, origin, mainRotationR, totalArcLength } =
    useRadialContext();
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
  const vPanPos = useSharedValue({ angle: 0, radius: 0 });
  const callBack = useCallback(() => {
    const ring = Math.floor(
      vPanPos.value.radius / (height / optionKeys.length),
    );
    onValueChange && onValueChange(ring);
  }, [onValueChange, optionKeys.length, height, vPanPos]);
  const radius = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2)) / 2;
  const { registerZone } = usePanManager();
  useEffect(() => {
    const unregisterZone = registerZone({
      origin,
      arcLength: totalArcLength,
      radii: [0, radius],
      rotationR: mainRotationR,
      vPanPos,
      fOnEnter: callBack,
      fOnLeave: () => {},
    });
    return () => {
      unregisterZone();
    };
  }, [origin, radius, mainRotationR, registerZone, callBack]);

  const fSectorGroupModifier = useCallback(
    (group: tSectorGroup) => {
      const text = (
        <Text
          fontSize={14}
          textAnchor="middle"
          verticalAlign="middle"
          transform={[{ rotate: `${11 / 7}rad` }]}
        >
          {options[group.sectorGroupID]}
        </Text>
      );
      group.children = [text];
      return group;
    },
    [options],
  );

  return (
    <RadialContext
      value={{
        mColorModifier,
        radii: [0, radius * optionKeys.length],
      }}
    >
      <RadialGraphic
        chord={1}
        ring={optionKeys.length}
        fSectorModifier={(sector) => {
          return {
            sectorGroupID: sector.ring,
            ...sector,
          };
        }}
        fSectorGroupModifier={fSectorGroupModifier}
      />
    </RadialContext>
  );
};
