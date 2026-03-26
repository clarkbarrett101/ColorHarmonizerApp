import { View } from "react-native";
import { Svg } from "react-native-svg";
import { SectorGridComp, ColorRange } from "./Sector";
export default function SandBox() {
  return (
    <View>
      <Svg width={200} height={200} viewBox="-100 -100 200 200">
        <SectorGridComp
          rowLength={5}
          angles={[0, 360]}
          radii={[20, 100]}
          colors={ColorRange([0, 1], [0.5, 0.5], [0, 360], [3, 1, 5])}
        />
      </Svg>
    </View>
  );
}
