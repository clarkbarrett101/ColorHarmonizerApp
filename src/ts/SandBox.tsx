import { Dimensions, View } from "react-native";
import { useState } from "react";
import ColorMixer from "./ColorMixer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaintChip, fRandomPaints } from "./PaintChip";
import { ChipFan } from "./ChipStack";
export default function SandBox() {
  const paints = fRandomPaints(12);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ColorMixer radii={[50, 225]} />
      <ChipFan
        paints={paints}
        origin={[
          Dimensions.get("window").width,
          Dimensions.get("window").height / 2 - 30,
        ]}
        size={[120, 80]}
        rotationR={22 / 7}
        arcLength={11 / 7}
        radius={Dimensions.get("window").width * 0.95}
        direction={1}
      />
    </GestureHandlerRootView>
  );
}
