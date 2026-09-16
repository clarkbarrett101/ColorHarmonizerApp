import { View, Text } from "react-native";
import React, { Profiler, useEffect } from "react";
import { tRadialObject } from "../Radials/SectorTypes";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { HarmonizerWheel } from "./HarmonizerWheel";
import { useVerse, useVerseRelay } from "../utils/Verse";
import { tColorModel } from "../utils/CLAcolor";
import {
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
export type tHarmonizerPhase = "wheel" | "scheme" | "chipSelector";
export default function ColorHarmonizer() {
  return <></>;
}
