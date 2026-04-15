import { Dimensions, View } from "react-native";
import { useState } from "react";
import ColorMixer from "./ColorMixer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaintChip } from "./PaintChip";
export default function SandBox() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaintChip
        paint={{
          name: "Test Paint",
          brand: "Test Brand",
          rgb: [255, 0, 0],
          ryb: [255, 0, 0],
          hsluv: [0, 100, 50],
          clarColor: { c: 0.5, l: 0.4, ar: 22 / 7 },
          hex: "#ff0000",
          yuv: [255, 128, 128],
          label: "Test Paint",
        }}
        startPosition={[0, Dimensions.get("window").height / 2 - 25]}
        grabbed={false}
      />
      <ColorMixer radii={[50, 225]} />
    </GestureHandlerRootView>
  );
}
