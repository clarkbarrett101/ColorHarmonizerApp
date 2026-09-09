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
export type tColorHarmonizer = tRadialObject & { phase?: tHarmonizerPhase };
export type tHarmonizerPhase = "wheel" | "scheme" | "chipSelector";
export function ColorHarmonizer({ phase = "wheel" }: tColorHarmonizer) {
  const { vColorModel, vSelected } = useUserContext();
  const vSelectedRelay = useVerseRelay(vSelected);
  const vModelBuffer = useSharedValue<tColorModel>(vColorModel.shared.value);
  const vPhase = useVerse<tHarmonizerPhase>(phase);
  useAnimatedReaction(
    () => vSelected.shared.value,
    (selectedAngles, prevSelectedAngles) => {
      vModelBuffer.value = vColorModel.shared.value;
      console.log("Selected Angles:", selectedAngles);
    },
  );
  const dCs = useDerivedValue(() => {
    return vSelected.shared.value.map((angle) => {
      return 0.5;
    });
  });
  const dLs = useDerivedValue(() => {
    return vSelected.shared.value.map((angle) => {
      return 0.8;
    });
  });
  function fOnPhase() {
    "worklet";
    vPhase.dispatch("scheme");
  }
  useEffect(() => {
    vSelectedRelay?.dispatch();
  }, []);
  useEffect(() => {
    if (vSelectedRelay.state.length < 2) {
      vPhase.dispatch("wheel");
    } else if (vSelectedRelay.state.length == 2) {
      vPhase.dispatch("scheme");
    } else if (vSelectedRelay.state.length > 2) {
      vPhase.dispatch("chipSelector");
    }
  }, [vSelectedRelay.state]);
  return (
    <>
      <BGGradient dARs={vSelected.shared} dCs={dCs} dLs={dLs} />
      {vPhase?.state === "wheel" ? (
        <HarmonizerWheel draggable fOnPhase={fOnPhase} />
      ) : vPhase?.state === "scheme" ? (
        <SchemeSelector vPhase={vPhase} vSelected={vSelectedRelay} />
      ) : (
        <SchemeChipSelector vPhase={vPhase} vSelected={vSelectedRelay} />
      )}
    </>
  );
}
