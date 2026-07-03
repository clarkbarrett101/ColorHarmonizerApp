import { View, Text, Dimensions } from "react-native";
import React from "react";
import { useDerivedValue, useSharedValue } from "react-native-reanimated";
import { RadialContext } from "../Radials/RadialContext";
import { BGGradient } from "../ColorWheels/BGGradient";
import { ColorWheel } from "../ColorWheels/ColorWheel";
import { tRadialObject } from "../Radials/SectorTypes";
export type tHarmonizer = tRadialObject & {};
export function Harmonizer({
  radii = [20, 250],
  origin = [
    Dimensions.get("window").width + radii[0],
    Dimensions.get("window").height / 2,
  ],
  rotationR = 22 / 7,
}: tHarmonizer) {
  const vWheelRotation = useSharedValue(22 / 7);
  const dC = useDerivedValue(() => 1);
  const dL = useDerivedValue(() => 1);
  const dAR = useDerivedValue(() => vWheelRotation.value);
  const vSecondColor = useSharedValue({
    c: 0.5,
    l: 0.5,
    ar: 0,
  });
  function wUpdateState() {
    "worklet";
  }
  return (
    <RadialContext
      value={{
        radii,
        origin,
        dC,
        dL,
        dAR,
        wUpdateState,
      }}
    >
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
        }}
      >
        <BGGradient />
      </View>
      <ColorWheel
        radii={radii}
        ring={5}
        chord={24}
        vRotationROffset={vWheelRotation}
        wheelCenter={rotationR}
        vSecondColor={vSecondColor}
      />
    </RadialContext>
  );
}
