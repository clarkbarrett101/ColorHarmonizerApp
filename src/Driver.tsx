import { View } from "react-native";
import { LightThermometer } from "./Cameras/LightThermometer";
import React, { Profiler, ReactNode, useEffect } from "react";
import PanManager from "./Contexts/PanManager";
import UserContext, { eLayers } from "./Contexts/UserContext";
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
import {
  ColorHarmonizer,
  tHarmonizerPhase,
} from "./Harmonizer/ColorHarmonizer";
import { MenuButton } from "./Buckets/MenuButton";
import ChipContext from "./Chips/ChipContext";
import { BGGradient } from "./ColorWheels/BGGradient";

export type ePages =
  | "Menu"
  | "ReColor Camera"
  | "Color Wheel"
  | "Color Mixer"
  | "Undertone Camera"
  | "Color Seasons"
  | "Color Harmonizer"
  | "Palette Library"
  | "Light Thermometer";
const allPages: ePages[] = [
  "Menu",
  "Palette Library",
  "Undertone Camera",
  "ReColor Camera",
  "Color Harmonizer",
  "Color Wheel",
  "Color Mixer",
  "Color Seasons",
];
const Driver = () => {
  const vPage = useVerse<ePages>("Menu");
  const vPhase = useVerse<tHarmonizerPhase>("wheel");
  const pageMap: Record<ePages, ReactNode> = {
    Menu: (
      <Menu vSelection={vPage} options={allPages.filter((p) => p !== "Menu")} />
    ),
    "ReColor Camera": <WallPaintCam />,
    "Color Wheel": <ColorSelector />,
    "Color Mixer": <ColorMixer />,
    "Color Seasons": <ColorSeasons />,
    "Undertone Camera": (
      <ColorCamera
        fSetHarmonizer={() => {
          "worklet";
          vPhase.dispatch("scheme");
          vPage.dispatch("Color Harmonizer");
        }}
      />
    ),
    "Color Harmonizer": <ColorHarmonizer phase={vPhase.state} />,
    "Palette Library": <PaletteLibrary />,
    "Light Thermometer": <LightThermometer />,
  };
  function fShouldShowBGGradient(page: ePages) {
    return (
      page !== "Color Harmonizer" &&
      page !== "Undertone Camera" &&
      page !== "ReColor Camera" &&
      page !== "Light Thermometer"
    );
  }
  return (
    <Profiler
      id="Driver"
      onRender={(
        id,
        phase,
        actualDuration,
        baseDuration,
        startTime,
        commitTime,
      ) => {
        console.log("Driver Rendered", {
          id,
          phase,
          actualDuration,
          baseDuration,
        });
      }}
    >
      <ChipContext>
        <UserContext>
          <SoundContext>
            <BucketContext>
              {fShouldShowBGGradient(vPage.state) && <BGGradient />}
              <DropScreen />
              {vPage.state !== "Menu" && (
                <MenuButton
                  onPress={() => {
                    vPage.dispatch("Menu");
                    vPhase.dispatch("wheel");
                  }}
                />
              )}
              <PanManager>{pageMap[vPage.state]}</PanManager>
              <ChipHand />
            </BucketContext>
          </SoundContext>
        </UserContext>
      </ChipContext>
    </Profiler>
  );
};

export default Driver;
