import React, { ReactNode, useEffect, useRef } from "react";
import ColorHarmonizer from "./Harmonizer/ColorHarmonizer";
import type { ePages } from "./Contexts/UserContext";
import PanManager from "./Contexts/PanManager";
import UserContext from "./Contexts/UserContext";
import BucketContext from "./Buckets/BucketContext";
import SoundContext from "./Contexts/SoundContext";
import ChipContext from "./Chips/ChipContext";
import ChipHand from "./Chips/ChipHand";
import Menu from "./Menu";
import ColorSearch from "./ColorWheels/ColorSearch";
import DropScreen from "./Buckets/DropScreen";
import UndertoneCam from "./Cameras/UndertoneCam";
import ReColorCam from "./Cameras/ReColorCam";
import ColorMixer from "./ColorWheels/ColorMixer";
import ColorSelector from "./ColorWheels/ColorSelector";
import PaletteLibrary from "./Chips/PaletteLibrary";
import ColorSeasons from "./ColorWheels/ColorSeasons";
import BGGradient from "./ColorWheels/BGGradient";
import SchemeChipSelector from "./Harmonizer/ChipSelector";
import SchemeSelector from "./Harmonizer/SchemeSelector";
import { useVerse } from "./utils/Verse";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import Button from "./Buttons/Button";
import { Paths } from "./utils/Paths";
import { View } from "react-native";
import { DemoContext } from "./Contexts/DemoContext";
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

const Driver = () => {
  const vPage = useVerse<ePages>("Main Menu");
  const hardReset = useRef(0);
  useEffect(() => {
    hardReset.current += 1;
    console.log("Hard reset count:", hardReset.current);
  }, [vPage.state]);
  const pageMap: Partial<Record<ePages, ReactNode>> = {
    "Main Menu": <Menu />,
    "ReColor Camera": <ReColorCam />,
    "Color Wheel": <ColorSelector />,
    "Color Mixer": <ColorMixer />,
    "Color Seasons": <ColorSeasons />,
    "Undertone Camera": <UndertoneCam />,
    "Color Harmonizer": <ColorHarmonizer />,
    "Palette Library": <PaletteLibrary />,
    "Scheme Selector": <SchemeSelector />,
    "Chip Selector": <SchemeChipSelector />,
    "Color Search": <ColorSearch />,
  };
  function fShouldShowBGGradient(page: ePages) {
    return page !== "Undertone Camera" && page !== "ReColor Camera";
  }
  return (
    <ChipContext>
      <UserContext vPage={vPage}>
        <SoundContext>
          <BucketContext>
            {fShouldShowBGGradient(vPage.state) && <BGGradient />}

            <View
              style={{
                flex: 1,
                shadowColor: "black",
                shadowOffset: { width: -10, height: 10 },
                shadowOpacity: 0.25,
                shadowRadius: 5,
                zIndex: 20,
              }}
            >
              <DropScreen />
              {vPage.state !== "Main Menu" && (
                <Button
                  size={50}
                  origin={[50, 75]}
                  path={Paths.menu}
                  onPress={() => {
                    vPage.dispatch("Main Menu");
                  }}
                />
              )}
              <PanManager>
                <DemoContext>{pageMap[vPage.state]}</DemoContext>
              </PanManager>
              <ChipHand />
            </View>
          </BucketContext>
        </SoundContext>
      </UserContext>
    </ChipContext>
  );
};

export default Driver;
