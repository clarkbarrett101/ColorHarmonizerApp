import ColorSelector from "./ColorSelector";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import UserContext, { eLayers } from "./UserContext";
import { ChipHand } from "./ChipHand";
import DropScreen from "./DropScreen";
import BucketContext from "./BucketContext";
import { ColorMixer } from "./ColorMixer";
import { ColorCamera } from "./ColorCamera";
import { WallPaintCam } from "./WallPaintCam";
import { LightThermo } from "./LightThermo";
import { PaletteLibrary } from "./PaletteLibrary";
import SoundContext from "./SoundContext";
import { Waveform } from "./Waveform";
export default function SandBox() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UserContext>
        <BucketContext>
          <SoundContext>
            <DropScreen />
            <PaletteLibrary />
            <ChipHand />
          </SoundContext>
        </BucketContext>
      </UserContext>
    </GestureHandlerRootView>
  );
}
/*
    
*/
