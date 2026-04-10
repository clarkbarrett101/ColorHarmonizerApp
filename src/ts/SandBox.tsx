import { View } from "react-native";
import { ColorWheel } from "./ColorWheel";
import { Menu } from "./Menu";
import { TintSelector } from "./TintSelector";
import { CLARColor } from "./CLAcolor";
import { useState } from "react";
import ColorMixer from "./ColorMixer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
export default function SandBox() {
  const [color, setColor] = useState(new CLARColor(0.5, 0.4, 22 / 7));
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ColorMixer />
    </GestureHandlerRootView>
  );
}
