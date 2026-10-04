import { Dimensions } from "react-native";
import React, { use, useEffect, useState } from "react";
import { tRadialObject } from "../Radials/SectorTypes";
import { RadialContext, wDefaultAngleToChord } from "../Radials/RadialContext";
import { tVerse, useVerse, useVerseRelay } from "../utils/Verse";
import { withDelay, withTiming } from "react-native-reanimated";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { BackIcon } from "../Buttons/BackIcon";
import { ColorFan } from "./ColorFan";
import { ColorScheme, fGetHarmonies, tScheme } from "./ColorScheme";
import { usePanHitBox } from "../Buttons/PanHitBox";
import { tAttributeMap, tAttributeModifier } from "../utils/Actor";

import { CurvedText } from "../Buttons/CurvedText";
import { cDimW, cDimH, cWide, cRaxelW } from "../utils/ScreenDimensions";

export default function SchemeSelector({
  arcLength = cWide ? 13 / 7 : 20 / 7,
  radii = [cRaxelW(0.5, 0.3), cRaxelW(0.9, 0.8)],
  origin = [
    Dimensions.get("window").width,
    Dimensions.get("window").height / 2,
  ],
  rotationR = 22 / 7,
}: tRadialObject) {
  const { vSelected, vPage } = useUserContext();
  const vSelectedRelay = useVerseRelay(vSelected);
  const schemes = useVerse<tScheme[]>([]);
  useEffect(() => {
    schemes.dispatch(fGetHarmonies(vSelected.shared.value));
  }, [vSelectedRelay?.state]);
  const { vAccentC, vAccentL } = useUserContext();
  useEffect(() => {
    vAccentC.dispatch(0.3);
    vAccentL.dispatch(0.8);
  }, []);
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
          schemes.shared.value.length,
          rotationR,
        );
        console.log("Current hues:", chord, schemes.shared.value.length);
        console.log("vSelectedRelay state: ", vSelectedRelay?.state);
        vSelectedRelay?.dispatch(
          schemes.shared.value[chord % schemes.shared.value.length].finalHues,
        );
        vPage?.dispatch("Chip Selector");
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
        vPage?.dispatch("Color Harmonizer");
      }
    },
  });
  const vIntroAnim = useVerse(0);
  useEffect(() => {
    vIntroAnim.shared.value = withDelay(500, withTiming(1, { duration: 500 }));
    setTimeout(() => {
      vIntroAnim.dispatch(1);
    }, 1000);
  }, []);
  const mTransitionModifier: tAttributeModifier = {
    modID: 1,
    deps: [vIntroAnim.shared],
    modifier: (input: tAttributeMap) => {
      "worklet";
      return {
        ...input,
        rotateZ: vIntroAnim.shared.value * input.rotateZ,
      };
    },
  };

  return (
    <RadialContext value={{ mTransformModifier: mTransitionModifier }}>
      {schemes.state.map((harmony, index) => (
        <ColorScheme
          key={index}
          origin={origin}
          arcLength={
            ((Math.min(harmony.finalHues.length, 3) / 3) * arcLength) / 8
          }
          chordLength={
            ((harmony.finalHues.length < 3 ? 1.3 : 1) * arcLength) / 8
          }
          rotationR={
            rotationR -
            arcLength / 2 +
            (arcLength / schemes.state.length) * (index + 0.5)
          }
          radii={[cRaxelW(0.5, 0.45), cRaxelW(0.9, 0.8)]}
          bend={0.3}
          tScheme={harmony}
          ready={vIntroAnim.state > 0.5}
        />
      ))}
      <ColorFan
        key="last"
        origin={origin}
        ring={4}
        chord={3}
        radii={[cDimW(0.025), radii[0] * 0.7]}
        rotationR={rotationR}
        arcLength={18 / 7}
        bend={0.5}
        layer={eLayers.colorMixer}
        hues={[
          ...vSelectedRelay?.state,
          ...vSelectedRelay?.state,
          ...vSelectedRelay?.state,
        ]}
      />
      {vIntroAnim.state > 0.5 && (
        <BackIcon
          zIndex={eLayers.chipFan}
          color="white"
          size={cDimH(0.05)}
          origin={[cDimW(0.9), cDimH(0.5)]}
        />
      )}
      <CurvedText
        text="Choose a Color Scheme"
        radii={[0, cRaxelW(1, 0.9)]}
        convex={true}
        rotationR={cWide ? 1 / 7 : 3 / 7}
        origin={[cDimW(), cDimH(0.5)]}
        layer={eLayers.colorMixer}
        color="rgba(0,0,0,.65)"
        fontSize={cDimH(0.03)}
        drawCurve={false}
      />
    </RadialContext>
  );
}
