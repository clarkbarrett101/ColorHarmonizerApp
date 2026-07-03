import { Dimensions, PanResponder, View } from "react-native";
import { fCLARColorToRGB, fRGBToCLARColor, tCLARColor } from "./CLAcolor";
import { RadialGraphic } from "./RadialGraphic";
import { use, useEffect, useMemo, useState } from "react";
import { Text } from "react-native-svg";
import {
  useDerivedValue,
  useSharedValue,
  withTiming,
  Easing,
  useAnimatedReaction,
} from "react-native-reanimated";
import { tRadialObject, tSector, tSectorGroup } from "./sectorTypes";
import { tAttributeModifier, tAttributeMap } from "./Actor";
import {
  RadialContext,
  wDefaultAngleToChord,
  wDefaultChordToAngle,
} from "./RadialContext";
import { tVerse, useVerse } from "./Verse";
import { ePanEvent, usePanManager } from "./PanManager";
import { eLayers } from "./UserContext";
import { useSoundContext } from "./SoundContext";
import { scheduleOnRN } from "react-native-worklets";
import { ePages } from "./Driver";

export type tMenu = tRadialObject & {
  vSelection?: tVerse<ePages>;
  options?: ePages[];
};
export function Menu({
  vSelection,
  options = [
    "Menu",
    "WallPaint",
    "ColorWheel",
    "ColorMixer",
    "ColorCamera",
    "ColorHarmony",
  ],
  radii = [250, 550],
  rotationR = 22 / 7,
  arcLength = 7 / 7,
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
  const { fShepardNotes } = useSoundContext();
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
  useAnimatedReaction(
    () => vPanState.value,
    (state) => {
      if (state === "leave" || state === "tap") {
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
      vSlowAngle.value = withTiming(pos.angle, {
        duration: 100,
        easing: Easing.bezier(0.5, 0, 0.5, 1),
      });
    },
  );
  const mColorModifier: tAttributeModifier = {
    modID: 0,
    deps: [],
    modifier: (input: tAttributeMap) => {
      "worklet";
      const rdc = Math.pow(0.5, 1 / Math.max(ring - 1, 1));
      const rdl = Math.pow(0.5, 1 / Math.max(ring - 1, 1));
      let c = Math.pow(rdc, ring - 1 - input.ring) * 0.8;
      let l = Math.pow(rdl, ring - 1 - input.ring) * 0.8;
      let ar = 22 / 7 + (input.chord / (chord - 1)) * (22 / 7);
      let [r, g, b] = fCLARColorToRGB({ c, l, ar });
      return {
        ...input,
        red: r,
        green: g,
        blue: b,
      };
    },
  };
  const mTransformModifier: tAttributeModifier = {
    modID: 1,
    deps: [vSlowAngle],
    modifier: (input: tAttributeMap) => {
      "worklet";
      let diff = 1 - Math.abs(input.rotateZ - vSlowAngle.value) / arcLength;
      return {
        ...input,
        translateY: input.translateY + (0.5 - input.chord / (chord - 1)) * 100,
        translateX: input.translateX + (diff - 0.5) * 50,
        scaleX: 1 + Math.max(0, diff - 0.8),
        scaleY: 1 + Math.max(0, diff - 0.8),
        zIndex: eLayers.colorMixer + Math.round(diff * chord),
      };
    },
  };
  function fSectorModifier(sector: tSector) {
    return {
      ...sector,
      arcLength: sector.arcLength * 1.26,
    };
  }
  function fSectorGroupModifier(sectorGroup: tSectorGroup) {
    return {
      ...sectorGroup,
      children: (
        <Text
          fill="white"
          x={-(radii[1] * 0.7 - options[sectorGroup.sectorGroupID].length * 5)}
          fontSize={30}
          fontFamily="Outfit"
          textAnchor="end"
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
        mColorModifier,
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
