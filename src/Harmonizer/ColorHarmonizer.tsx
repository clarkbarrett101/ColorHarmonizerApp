import { View, Text } from "react-native";
import React, { Profiler } from "react";
import { tRadialObject } from "../Radials/SectorTypes";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { HarmonizerWheel } from "./HarmonizerWheel";
import { useVerse, useVerseRelay } from "../utils/Verse";
import { tCLARColor } from "../utils/CLAcolor";
import { SchemeSelector } from "./SchemeSelector";
import { SchemeChipSelector } from "./ChipSelector";
import { BGGradient } from "../ColorWheels/BGGradient";
import { useAnimatedReaction, useDerivedValue } from "react-native-reanimated";
import { ColorModels } from "../ColorWheels/ColorModels";
export type tColorHarmonizer = tRadialObject & {};
export type tHarmonizerPhase = "wheel" | "scheme" | "chipSelector";
export function ColorHarmonizer({}: tColorHarmonizer) {
  const vSelectedAngles = useVerse<number[]>([]);

  const vPhase = useVerse<tHarmonizerPhase>("wheel");
  useAnimatedReaction(
    () => vSelectedAngles.shared.value,
    (selectedAngles, prevSelectedAngles) => {
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
      <Profiler
        id="ColorHarmonizer"
        onRender={(id, phase, actualDuration) => {
          console.log(
            `Profiler [${id}] - Phase: ${phase}, Duration: ${actualDuration}ms`,
          );
        }}
      >
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
          <SchemeChipSelector
            vSelectedAngles={vSelectedAngles}
            vPhase={vPhase}
          />
        )}
        {vPhase?.state !== "chipSelector" && <ColorModels />}
      </Profiler>
    </>
  );
}
