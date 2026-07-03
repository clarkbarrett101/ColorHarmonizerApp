import { View, Text, Dimensions } from "react-native";
import React, { ReactNode, useState } from "react";
import { useSharedValue } from "react-native-reanimated";
import PanManager, { usePanManager } from "./PanManager";
import { tRadialObject } from "./sectorTypes";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import UserContext, { eLayers } from "./UserContext";
import BucketContext from "./BucketContext";
import SoundContext from "./SoundContext";
import { ChipHand } from "./ChipHand";
import { Menu } from "./Menu";
import DropScreen from "./DropScreen";
import { ColorCamera } from "./ColorCamera";
import { WallPaintCam } from "./WallPaintCam";
import { ColorWheel } from "./ColorWheel";
import { ColorSector } from "../components";
import { ColorMixer } from "./ColorMixer";
import ColorSelector from "./ColorSelector";
import { useVerse } from "./Verse";
import { PaletteLibrary } from "./PaletteLibrary";
import { ColorSeasons } from "./ColorSeasons";

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
    ColorHarmony: (
      <View>
        <Text>Color Harmony</Text>
      </View>
    ),
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
          <PanManager>{pageMap[vPage.state]}</PanManager>
          <ChipHand />
        </SoundContext>
      </BucketContext>
    </UserContext>
  );
};

export default Driver;
