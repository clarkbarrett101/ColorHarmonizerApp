import { View } from "react-native";
import { LightThermometer } from "./Cameras/LightThermometer";
import React, { Profiler, ReactNode, useEffect } from "react";
import type { ePages } from "./Contexts/UserContext";
import PanManager from "./Contexts/PanManager";
import UserContext from "./Contexts/UserContext";
import BucketContext from "./Buckets/BucketContext";
import SoundContext from "./Contexts/SoundContext";
import { ChipHand } from "./Chips/ChipHand";
import { Menu } from "./Menu";
import { DropScreen } from "./Buckets/DropScreen";
import { ColorCamera } from "./Cameras/ColorCamera";
import { WallPaintCam } from "./Cameras/WallPaintCam";
import { ColorMixer } from "./ColorWheels/ColorMixer";
import ColorSelector from "./ColorWheels/ColorSelector";
import { useVerse } from "./utils/Verse";
import { PaletteLibrary } from "./Chips/PaletteLibrary";
import { ColorSeasons } from "./ColorWheels/ColorSeasons";
import { MenuButton } from "./Buckets/MenuButton";
import ChipContext from "./Chips/ChipContext";
import { BGGradient } from "./ColorWheels/BGGradient";
import { SchemeChipSelector } from "./Harmonizer/ChipSelector";
import { SchemeSelector } from "./Harmonizer/SchemeSelector";
import { HarmonizerWheel } from "./Harmonizer/HarmonizerWheel";

const Driver = () => {
  const vPage = useVerse<ePages>("Menu");
  const vTransition = useVerse<number>(0);
  const pageMap: Record<ePages, ReactNode> = {
    Menu: <Menu />,
    "ReColor Camera": <WallPaintCam />,
    "Color Wheel": <ColorSelector />,
    "Color Mixer": <ColorMixer />,
    "Color Seasons": <ColorSeasons />,
    "Undertone Camera": <ColorCamera />,
    "Color Harmonizer": <HarmonizerWheel />,
    "Palette Library": <PaletteLibrary />,
    "Light Thermometer": <LightThermometer />,
    "Scheme Selector": <SchemeSelector />,
    "Chip Selector": <SchemeChipSelector />,
  };
  function fShouldShowBGGradient(page: ePages) {
    return (
      page !== "Undertone Camera" &&
      page !== "ReColor Camera" &&
      page !== "Light Thermometer"
    );
  }
  return (
    <Profiler
      id="Driver"
      onRender={(id, phase, actualDuration, baseDuration) => {
        console.log("Driver Rendered", {
          id,
          phase,
          actualDuration,
          baseDuration,
        });
      }}
    >
      <ChipContext>
        <UserContext vPage={vPage}>
          <SoundContext>
            <BucketContext>
              {fShouldShowBGGradient(vPage.state) && <BGGradient />}
              <DropScreen />
              {vPage.state !== "Menu" && (
                <MenuButton
                  onPress={() => {
                    vPage.dispatch("Menu");
                  }}
                />
              )}
              <PanManager drawSectors>{pageMap[vPage.state]}</PanManager>

              <ChipHand />
            </BucketContext>
          </SoundContext>
        </UserContext>
      </ChipContext>
    </Profiler>
  );
};

export default Driver;
