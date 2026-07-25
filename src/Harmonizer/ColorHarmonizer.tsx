import { View, Text } from "react-native";
import React, { Profiler, useEffect } from "react";
import { tRadialObject } from "../Radials/SectorTypes";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { HarmonizerWheel } from "./HarmonizerWheel";
import { useVerse, useVerseRelay } from "../utils/Verse";
import {
  tCLARColor,
  tColorModel,
  ToRGBangle,
  FromRGBangle,
} from "../utils/CLAcolor";
import { SchemeSelector } from "./SchemeSelector";
import { SchemeChipSelector } from "./ChipSelector";
import { BGGradient } from "../ColorWheels/BGGradient";
import {
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { ColorModels } from "./ColorModels";
export type tColorHarmonizer = tRadialObject & {};
export type tHarmonizerPhase = "wheel" | "scheme" | "chipSelector";
export function ColorHarmonizer({}: tColorHarmonizer) {
  const vSelectedAngles = useVerse<number[]>([]);
  const { vColorModel } = useUserContext();
  const modelRelay = useVerseRelay(vColorModel);
  const vModelBuffer = useSharedValue<tColorModel>(vColorModel.shared.value);
  const vPhase = useVerse<tHarmonizerPhase>("wheel");
  useAnimatedReaction(
    () => vSelectedAngles.shared.value,
    (selectedAngles, prevSelectedAngles) => {
      vModelBuffer.value = vColorModel.shared.value;
      console.log("Selected Angles:", selectedAngles);
    },
  );
  const dCs = useDerivedValue(() => {
    return vSelectedAngles.shared.value.map((angle) => {
      return 0.5;
    });
  });
  const dLs = useDerivedValue(() => {
    return vSelectedAngles.shared.value.map((angle) => {
      return 0.8;
    });
  });
  return (
    <>
      <BGGradient dARs={vSelectedAngles.shared} dCs={dCs} dLs={dLs} />
      {vPhase?.state === "wheel" ? (
        <HarmonizerWheel
          draggable
          vSelectedAngles={vSelectedAngles}
          vPhase={vPhase}
        />
      ) : vPhase?.state === "scheme" ? (
        <SchemeSelector vSelectedAngles={vSelectedAngles} vPhase={vPhase} />
      ) : (
        <SchemeChipSelector vSelectedAngles={vSelectedAngles} vPhase={vPhase} />
      )}
    </>
  );
}
