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

export type tSchemeSelector = tRadialObject & {
  vSelectedAngles?: tVerse<number[]>;
  vPhase?: tVerse<tHarmonizerPhase>;
};

export function SchemeSelector(props: tSchemeSelector) {
  const {
    arcLength = 20 / 7,
    radii = [200, 350],
    origin = [
      Dimensions.get("window").width,
      Dimensions.get("window").height / 2,
    ],
    rotationR = 22 / 7,
    ring = 5,
    vSelectedAngles,
    vPhase,
  } = props;
  const { registerHitBox, unregisterHitBox } = usePanManager();
  const vPanPos = useSharedValue<{ angle: number; radius: number }>({
    angle: 0,
    radius: 0,
  });
  const vPanStateBack = useSharedValue<ePanEvent>("leave");
  const vPanState = useSharedValue<ePanEvent>("leave");
  useEffect(() => {
    registerHitBox({
      id: "schemeSelector",
      origin,
      radii,
      rotationR,
      arcLength,
      vPanPos,
      vPanState,
    });
    registerHitBox({
      id: "schemeSelectorBack",
      origin,
      radii: [0, radii[0] - 50],
      rotationR,
      arcLength,
      vPanPos,
      vPanState: vPanStateBack,
    });
    return () => {
      unregisterHitBox("schemeSelector");
      unregisterHitBox("schemeSelectorBack");
    };
  }, []);

  const schemes = useVerse(fGetHarmonies(vSelectedAngles?.state ?? [0, 0]));
  useEffect(() => {
    schemes.dispatch(fGetHarmonies(vSelectedAngles?.state ?? [0, 0]));
  }, [vSelectedAngles?.state]);
  useAnimatedReaction(
    () => {
      return vPanState.value;
    },
    (state) => {
      if (state === "tap" || state === "release") {
        const chord = wDefaultAngleToChord(
          vPanPos.value.angle,
          arcLength,
          schemes.state.length,
          rotationR,
        );
        vSelectedAngles?.dispatch(
          schemes.state[chord % schemes.state.length].finalHues,
        );
        vPhase?.dispatch("chipSelector");
      }
    },
  );
  useAnimatedReaction(
    () => {
      return vPanStateBack.value;
    },
    (state) => {
      if (state === "tap" || state === "release") {
        vPhase?.dispatch("wheel");
      }
    },
  );
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
        hues={[
          ...vSelectedAngles?.state,
          ...vSelectedAngles?.state,
          ...vSelectedAngles?.state,
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
