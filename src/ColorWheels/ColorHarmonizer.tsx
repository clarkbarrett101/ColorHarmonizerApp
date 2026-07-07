import { View, Text } from "react-native";
import React from "react";
import { tRadialObject } from "../Radials/SectorTypes";
import { useUserContext } from "../Contexts/UserContext";
import { HarmonizerWheel } from "./HarmonizerWheel";
import { useVerse, useVerseRelay } from "../utils/Verse";
import { tCLARColor } from "../utils/CLAcolor";
import { ColorSchemes } from "./ColorSchemes";
export type tColorHarmonizer = tRadialObject & {};
export function ColorHarmonizer({}: tColorHarmonizer) {
  const vSelectedColors = useVerse<tCLARColor[]>([]);

  return (
    <View>
      {vSelectedColors.state.length < 2 ? (
        <HarmonizerWheel draggable vSelectedColors={vSelectedColors} />
      ) : (
        <ColorSchemes vSelectedColors={vSelectedColors} />
      )}
    </View>
  );
}
