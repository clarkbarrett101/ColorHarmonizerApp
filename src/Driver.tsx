import { View, Text, Dimensions } from "react-native";
import React, { ReactNode, useState } from "react";
import { useSharedValue } from "react-native-reanimated";
import PanManager, { usePanManager } from "./Contexts/PanManager";
import { tRadialObject } from "./Radials/SectorTypes";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import UserContext, { eLayers } from "./Contexts/UserContext";
import BucketContext from "./Buckets/BucketContext";
import SoundContext from "./Contexts/SoundContext";
import { ChipHand } from "./Chips/ChipHand";
import { Menu } from "./Menu";
import DropScreen from "./Buckets/DropScreen";
import { ColorCamera } from "./Cameras/ColorCamera";
import { WallPaintCam } from "./Cameras/WallPaintCam";
import { ColorWheel } from "./ColorWheels/ColorWheel";
import { ColorMixer } from "./ColorWheels/ColorMixer";
import ColorSelector from "./ColorWheels/ColorSelector";
import { useVerse } from "./utils/Verse";
import { PaletteLibrary } from "./Chips/PaletteLibrary";
import { ColorSeasons } from "./ColorWheels/ColorSeasons";
import { HarmonizerWheel } from "./ColorWheels/HarmonizerWheel";
import { ColorHarmonizer } from "./ColorWheels/ColorHarmonizer";

export type ePages =
  | "Menu"
  | "WallPaint"
  | "ColorWheel"
  | "ColorMixer"
  | "ColorCamera"
  | "ColorSeasons"
  | "ColorHarmony"
  | "PaletteLibrary";
const allPages: ePages[] = [
  "Menu",
  "WallPaint",
  "ColorWheel",
  "ColorMixer",
  "ColorCamera",
  "ColorSeasons",
  "ColorHarmony",
  "PaletteLibrary",
];
const Driver = () => {
  const vPage = useVerse<ePages>("Menu");
  const pageMap: Record<ePages, ReactNode> = {
    Menu: (
      <Menu vSelection={vPage} options={allPages.filter((p) => p !== "Menu")} />
    ),
    WallPaint: <WallPaintCam />,
    ColorWheel: <ColorSelector />,
    ColorMixer: <ColorMixer />,
    ColorSeasons: <ColorSeasons />,
    ColorCamera: <ColorCamera />,
    ColorHarmony: <ColorHarmonizer />,
    PaletteLibrary: <PaletteLibrary />,
  };
  return (
    <UserContext>
      <BucketContext>
        <SoundContext>
          <DropScreen />
          <View
            style={{
              position: "absolute",
              top: 40,
              left: 20,
              width: 50,
              height: 50,
              zIndex: eLayers.superMax,
              borderRadius: 50,
              backgroundColor: "rgba(255, 0, 0, 0.5)",
            }}
            onTouchEnd={() => vPage.dispatch("Menu")}
          />
          <PanManager drawSectors>{pageMap[vPage.state]}</PanManager>
          <ChipHand />
        </SoundContext>
      </BucketContext>
    </UserContext>
  );
};

export default Driver;
