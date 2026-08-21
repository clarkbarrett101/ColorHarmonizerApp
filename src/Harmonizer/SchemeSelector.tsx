import { Dimensions } from "react-native";
import React, { use, useEffect, useState } from "react";
import { tRadialObject } from "../Radials/SectorTypes";
import { RadialContext, wDefaultAngleToChord } from "../Radials/RadialContext";
import { tVerse, useVerse, useVerseRelay } from "../utils/Verse";
import { ePanEvent, usePanManager } from "../Contexts/PanManager";
import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { tHarmonizerPhase } from "./ColorHarmonizer";
import { BackIcon } from "../Buttons/BackIcon";
import { CurvedText } from "../Buttons/CurvedText";
import { ColorFan } from "./ColorFan";
import { ColorScheme, fGetHarmonies } from "./ColorScheme";
import { BGGradient } from "../ColorWheels/BGGradient";
import { usePanHitBox } from "../Buttons/PanHitBox";
import { scheduleOnRN } from "react-native-worklets";

export type tSchemeSelector = tRadialObject & {
  vPhase?: tVerse<tHarmonizerPhase>;
  Selected?: number[];
};

export function SchemeSelector({
  arcLength = 20 / 7,
  radii = [200, 350],
  origin = [
    Dimensions.get("window").width,
    Dimensions.get("window").height / 2,
  ],
  rotationR = 22 / 7,
  ring = 5,
  vPhase,
}: tSchemeSelector) {
  const { vSelected, vSelectedRef } = useUserContext();
  const vSelectedRelay = useVerseRelay(vSelected);
  const schemes = useVerse(fGetHarmonies(vSelectedRef?.current));
  useEffect(() => {
    schemes.dispatch(fGetHarmonies(vSelectedRef?.current));
  }, [vSelectedRelay?.state]);

  usePanHitBox({
    id: "schemeSelector",
    origin,
    radii,
    rotationR,
    arcLength,
    fOnUpdate: (vPanState, vPanPos) => {
      "worklet";
      if (vPanState.value === "tap" || vPanState.value === "release") {
        const chord = wDefaultAngleToChord(
          vPanPos.value.angle,
          arcLength,
          schemes.state.length,
          rotationR,
        );
        vSelected?.dispatch(
          schemes.state[chord % schemes.state.length].finalHues,
        );
        vPhase?.dispatch("chipSelector");
      }
    },
  });
  usePanHitBox({
    id: "schemeSelectorBack",
    origin,
    radii: [0, radii[0] - 50],
    rotationR,
    arcLength,
    fOnUpdate: (vPanStateBack) => {
      "worklet";
      if (vPanStateBack.value === "tap" || vPanStateBack.value === "release") {
        vPhase?.dispatch("wheel");
      }
    },
  });

  return (
    <>
      {schemes.state.map((harmony, index) => (
        <ColorScheme
          key={index}
          origin={origin}
          arcLength={Math.min(harmony.finalHues.length, 3) / 7}
          chordLength={harmony.finalHues.length < 3 ? 1.3 / 7 : 1 / 7}
          rotationR={
            rotationR -
            arcLength / 2 +
            (arcLength / schemes.state.length) * (index + 0.5)
          }
          radii={radii}
          bend={0.3}
          tScheme={harmony}
        />
      ))}
      <ColorFan
        key="last"
        origin={origin}
        ring={4}
        chord={3}
        radii={[0, radii[0] - 75]}
        rotationR={rotationR}
        arcLength={18 / 7}
        bend={0.5}
        layer={eLayers.chipFan}
        hues={[
          ...vSelectedRef?.current,
          ...vSelectedRef?.current,
          ...vSelectedRef?.current,
        ]}
      />
      <BackIcon
        zIndex={eLayers.chipFan}
        color="white"
        size={75}
        origin={[
          Dimensions.get("window").width - 40,
          Dimensions.get("window").height / 2,
        ]}
      />
    </>
  );
}
