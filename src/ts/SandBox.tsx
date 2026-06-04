import ColorSelector from "./ColorSelector";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import UserContext, { eLayers } from "./UserContext";
import { ChipHand } from "./ChipHand";
import DropScreen from "./DropScreen";
import BucketContext from "./BucketContext";
import { ColorMixer } from "./ColorMixer";
import { ColorCamera } from "./ColorCamera";
import { WallPaintCam } from "./WallPaintCam";
export default function SandBox() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UserContext>
        <BucketContext>
          <WallPaintCam />
          <DropScreen />
          <ChipHand />
        </BucketContext>
      </UserContext>
    </GestureHandlerRootView>
  );
}
//
