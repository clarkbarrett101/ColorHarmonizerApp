import React, { CSSProperties, use, useCallback, useEffect } from "react";
import PanManager, { usePanManager } from "./PanManager";
import { RadialGraphic, tRadialGraphic } from "./RadialGraphic";
import { Text, TextProps } from "react-native-svg";
import {
  RadialContext,
  useRadialContext,
  wDefaultAngleToChord,
  wDefaultChordToAngle,
} from "./RadialContext";
import { tAttributeMap, tAttributeModifier } from "./Actor";
import { SharedValue, useSharedValue } from "react-native-reanimated";
import { tSectorGroup } from "./sectorTypes";
import { eLayers } from "./UserContext";
import { fCLARColorToRGB, tCLARColor } from "./CLAcolor";

export type tRadialMenu = tRadialGraphic & {
  options: { [key: string]: () => void };
  textProps?: TextProps;
  accentColor?: SharedValue<tCLARColor>;
};

export function RadialMenu({
  options,
  textProps,
  accentColor,
  ...props
}: tRadialMenu) {
  const mFilterColorModifier: tAttributeModifier = {
    modID: 0,
    deps: [accentColor],
    modifier: (input: tAttributeMap) => {
      "worklet";
      const rdc = Math.pow(0.5, 1 / Math.max(2 - 1, 1));
      const rdl = Math.pow(0.5, 1 / Math.max(2 - 1, 1));
      let c = Math.pow(rdc, 3 - 1 - input.ring) * accentColor.value.c;
      let l = Math.pow(rdl, 3 - 1 - input.ring) * accentColor.value.l;
      let ar = accentColor.value.ar - 2 / 7 + (input.chord / 12) * (4 / 7);
      const [r, g, b] = fCLARColorToRGB({ c, l, ar });
      return {
        ...input,
        red: r,
        green: g,
        blue: b,
      };
    },
  };
  const { origin, radii, totalArcLength, mainRotationR, totalRings } =
    useRadialContext();
  const optionKeys = Object.keys(options);
  const { registerZone } = usePanManager();
  if (!registerZone) {
    throw new Error("RadialMenu must be used within a PanManager provider");
  }
  const vPanPos = useSharedValue({ angle: 0, radius: 0 });
  const callback = useCallback(() => {
    const chord = wDefaultAngleToChord(
      vPanPos.value.angle,
      totalArcLength,
      optionKeys.length,
      mainRotationR,
    );
    const optionKey = optionKeys[chord];
    if (optionKey) {
      options[optionKey]();
    }
  }, [options, optionKeys]);
  console.log("optionKeys", optionKeys);
  useEffect(() => {
  const unregisterZone = registerZone({
      vPanPos,
      radii,
      arcLength: (totalArcLength * (optionKeys.length - 1)) / optionKeys.length,
      rotationR: mainRotationR,
      origin,
      fOnEnter: callback,
      fOnLeave: () => {},
    });
    return () => {
      unregisterZone();
    };
  }, [options]);
  const sectorModifier = useCallback(
    (sector: tSectorGroup) => {
      sector.children = [
        <Text key={sector.chord} {...textProps}>
          {optionKeys[sector.chord]}
        </Text>,
      ];
      return sector;
    },
    [optionKeys],
  );

  return (
    <RadialGraphic
      arcLength={totalArcLength}
      rotationR={mainRotationR}
      chord={optionKeys.length - 1}
      ring={totalRings}
      fSectorGroupModifier={sectorModifier}
    />
  );
}
