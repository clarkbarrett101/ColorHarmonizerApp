import { View } from "react-native";
import { Svg } from "react-native-svg";
import { SectorGridComp } from "./Sector";
export default function SandBox() {
  return (
    <View>
      <Svg width={200} height={200} viewBox="-100 -100 200 200">
        <SectorGridComp
          angles={[90, 180]}
          radii={[50, 100]}
          colors={[
            [
              [255, 0, 0],
              [0, 255, 0],
              [0, 0, 255],
            ],
            [
              [255, 255, 0],
              [255, 0, 255],
              [0, 255, 255],
            ],
            [
              [128, 0, 0],
              [0, 128, 0],
              [0, 0, 128],
            ],
          ]}
        />
      </Svg>
    </View>
  );
}
