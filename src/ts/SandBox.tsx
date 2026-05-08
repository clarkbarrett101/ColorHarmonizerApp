import ColorMixer from "./ColorMixer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import UserContext, { eLayers } from "./UserContext";
import { ChipHand } from "./ChipHand";
import DropScreen from "./DropScreen";
import BucketContext from "./BucketContext";
import { BGGradient } from "./BGGradient";
export default function SandBox() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UserContext>
        <BucketContext>
          <ChipHand />
          <ColorMixer radii={[50, 225]} />
          <DropScreen />
        </BucketContext>
      </UserContext>
    </GestureHandlerRootView>
  );
}
