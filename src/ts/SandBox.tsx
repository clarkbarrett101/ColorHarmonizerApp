import { View } from "react-native";
import { ColorWheel } from "./ColorWheel";
import { Menu } from "./Menu";
import { TintSelector } from "./TintSelector";
import { CLAColor } from "./CLAcolor";
import { useState } from "react";
export default function SandBox() {
  const [color, setColor] = useState(new CLAColor(0.5, 0.4, 180));
  return (
    <View>
      <ColorWheel
        arcLength={360}
        rotation={0}
        radii={[20, 200]}
        rc={{ rings: 5, chords: 18 }}
      />
    </View>
  );
}
