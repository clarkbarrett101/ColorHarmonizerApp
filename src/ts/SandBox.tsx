import ColorSelector from "./ColorSelector";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import UserContext, { eLayers } from "./UserContext";
import { ChipHand } from "./ChipHand";
import DropScreen from "./DropScreen";
import BucketContext from "./BucketContext";
import { BGGradient } from "./BGGradient";
import { ColorMixer } from "./ColorMixer";
export default function SandBox() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UserContext>
        <BucketContext>
          <ChipHand />
          <ColorSelector />
          <DropScreen />
        </BucketContext>
      </UserContext>
    </GestureHandlerRootView>
  );
}
