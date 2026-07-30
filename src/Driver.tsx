import { View } from "react-native";
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
import { ColorHarmonizer } from "./Harmonizer/ColorHarmonizer";
import { MenuButton } from "./Buckets/MenuButton";
import ChipContext from "./Chips/ChipContext";
import { BGGradient } from "./ColorWheels/BGGradient";

export type ePages =
  | "Menu"
  | "ReColorCamera"
  | "ColorWheel"
  | "ColorMixer"
  | "UndertoneCamera"
  | "ColorSeasons"
  | "ColorHarmonizer"
  | "PaletteLibrary";
const allPages: ePages[] = [
  "Menu",
  "PaletteLibrary",
  "UndertoneCamera",
  "ReColorCamera",
  "ColorWheel",
  "ColorMixer",
  "ColorSeasons",
  "ColorHarmonizer",
];
const Driver = () => {
  const vPage = useVerse<ePages>("Menu");
  const pageMap: Record<ePages, ReactNode> = {
    Menu: (
      <Menu vSelection={vPage} options={allPages.filter((p) => p !== "Menu")} />
    ),
    ReColorCamera: <WallPaintCam />,
    ColorWheel: <ColorSelector />,
    ColorMixer: <ColorMixer />,
    ColorSeasons: <ColorSeasons />,
    UndertoneCamera: <ColorCamera />,
    ColorHarmonizer: <ColorHarmonizer />,
    PaletteLibrary: <PaletteLibrary />,
  };

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
              {vPage.state !== "ColorHarmonizer" && <BGGradient />}{" "}
              <DropScreen />
              {vPage.state !== "Menu" && (
                <MenuButton onPress={() => vPage.dispatch("Menu")} />
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
