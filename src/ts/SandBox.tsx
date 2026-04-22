import ColorMixer from "./ColorMixer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import UserContext from "./UserContext";
import { ChipHand } from "./ChipHand";
export default function SandBox() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UserContext>
        <ColorMixer radii={[50, 225]} />
        <ChipHand />
      </UserContext>
    </GestureHandlerRootView>
  );
}
