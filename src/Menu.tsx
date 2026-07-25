import { Dimensions, PanResponder, View } from "react-native";
import { fCLARColorToRGB, fRGBToCLARColor, tCLARColor } from "./utils/CLAcolor";
import { RadialGraphic } from "./Radials/RadialGraphic";
import { useEffect, useMemo, useState } from "react";
import { Text } from "react-native-svg";
import {
  useDerivedValue,
  useSharedValue,
  withTiming,
  Easing,
  useAnimatedReaction,
  withSpring,
} from "react-native-reanimated";
import { tRadialObject, tSector, tSectorGroup } from "./Radials/SectorTypes";
import { tAttributeModifier, tAttributeMap } from "./utils/Actor";
import {
  RadialContext,
  wDefaultAngleToChord,
  wDefaultChordToAngle,
} from "./Radials/RadialContext";
import { tVerse, useVerse } from "./utils/Verse";
import { ePanEvent, usePanManager } from "./Contexts/PanManager";
import { eLayers, useUserContext } from "./Contexts/UserContext";
import { useSoundContext } from "./Contexts/SoundContext";
import { scheduleOnRN } from "react-native-worklets";
import { ePages } from "./Driver";
import React from "react";

export type tMenu = tRadialObject & {
  vSelection?: tVerse<ePages>;
  options?: ePages[];
};
export function Menu({
  vSelection,
  options = [
    "Menu",
    "PaletteLibrary",
    "UndertoneCamera",
    "ReColorCamera",
    "ColorWheel",
    "ColorMixer",
    "ColorSeasons",
    "ColorHarmonizer",
  ],
  radii = [200, 500],
  rotationR = 22 / 7,
  arcLength = 9 / 7,
  chord = options.length,
  ring = 5,
  origin = [
    Dimensions.get("window").width + radii[0],
    Dimensions.get("window").height / 2,
  ],
}: tMenu) {
  const { registerHitBox, unregisterHitBox } = usePanManager();
  const vPanPos = useSharedValue({ angle: 22 / 7, radius: 0 });
  const vPanState = useSharedValue<ePanEvent>("enter");
  const vSlowAngle = useSharedValue<number>(0);
  useEffect(() => {
    registerHitBox({
      id: "menu",
      origin,
      radii,
      rotationR,
      arcLength,
      vPanPos,
      vPanState,
    });
    return () => {
      unregisterHitBox("menu");
    };
  }, []);
  const { vAccentAR, vAccentC, vAccentL } = useUserContext();
  vAccentC.shared.value = 0.75;
  vAccentL.shared.value = 0.9;
  useAnimatedReaction(
    () => vPanState.value,
    (state) => {
      if (state === "release" || state === "tap") {
        const adjustedAngle = vPanPos.value.angle - rotationR + arcLength / 2;
        const nearestChord = Math.max(
          Math.min(Math.floor(adjustedAngle / (arcLength / chord)), chord - 1),
          0,
        );
        vSelection?.dispatch(options[nearestChord]);
      }
    },
  );
  useAnimatedReaction(
    () => vPanPos.value,
    (pos) => {
      vSlowAngle.value = withSpring(pos.angle, {
        damping: 100,
        stiffness: 1000,
      });
      const pChord = wDefaultAngleToChord(
        pos.angle,
        arcLength,
        options.length,
        rotationR,
      );
      vAccentAR.shared.value = withSpring(
        22 / 7 + (pChord / (chord - 1)) * (22 / 7),
      );
    },
  );

  const mTransformModifier: tAttributeModifier = {
    modID: 1,
    deps: [vSlowAngle],
    modifier: (input: tAttributeMap) => {
      "worklet";
      let diff = 1 - Math.abs(input.rotateZ - vSlowAngle.value) / arcLength;
      return {
        ...input,
        translateX: input.translateX + diff * radii[0] * 0.2,
        scaleX: 1 + Math.max(0, diff - 0.9),
        scaleY: 1 + Math.max(0, diff - 0.9),
        zIndex: eLayers.colorMixer + Math.round(diff * chord),
      };
    },
  };
  function fSectorModifier(sector: tSector) {
    const rgb = fCLARColorToRGB(
      {
        c: (sector.ring / (ring - 1)) * 0.4 + 0.4,
        l: (sector.ring / (ring - 1)) * 0.4 + 0.4,
        ar: 22 / 7 + (sector.chord / (chord - 1)) * (22 / 7),
      },
      "RYGB",
    );
    return {
      ...sector,
      arcLength: sector.arcLength,
      rgb,
    };
  }
  function fSectorGroupModifier(sectorGroup: tSectorGroup) {
    return {
      ...sectorGroup,
      children: (
        <Text
          fill="white"
          x={(radii[0] + radii[1]) * -0.5}
          y={7}
          fontSize={30}
          fontFamily="Outfit"
          textAnchor="middle"
          fontWeight={600}
          transform={[{ rotate: 22 / 7 + "rad" }]}
        >
          {options[sectorGroup.sectorGroupID]}
        </Text>
      ),
    };
  }
  return (
    <RadialContext
      value={{
        mTransformModifier,
        origin,
        totalRings: ring,
        totalChords: chord,
        radii,
      }}
    >
      <RadialGraphic
        radii={radii}
        chord={chord}
        ring={ring}
        arcLength={arcLength}
        rotationR={rotationR}
        fSectorModifier={fSectorModifier}
        fSectorGroupModifier={fSectorGroupModifier}
        origin={origin}
      />
    </RadialContext>
  );
}
