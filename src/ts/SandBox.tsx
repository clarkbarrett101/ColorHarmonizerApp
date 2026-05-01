import ColorMixer from "./ColorMixer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import UserContext, { eLayers } from "./UserContext";
import { ChipHand } from "./ChipHand";
import DropScreen from "./DropScreen";
export default function SandBox() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UserContext>
        <ChipHand />
        <ColorMixer radii={[50, 225]} />
        <DropScreen />
      </UserContext>
    </GestureHandlerRootView>
  );
}
