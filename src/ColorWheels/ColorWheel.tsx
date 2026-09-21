import {
  fCLARColorToRGB,
  fCLARColorToString,
  fRGBToCLARColor,
  tCLARColor,
  tPaint,
} from "../utils/CLAcolor";
import { RadialGraphic } from "../Radials/RadialGraphic";
import { use, useCallback, useEffect, useState } from "react";
import { tRadialObject, tSector, tSectorGroup } from "../Radials/SectorTypes";
import {
  useSharedValue,
  SharedValue,
  withTiming,
  useAnimatedReaction,
  withDelay,
} from "react-native-reanimated";
import { ePanEvent, usePanManager } from "../Contexts/PanManager";
import { RadialContext, useRadialContext } from "../Radials/RadialContext";
import { tAttributeMap, tAttributeModifier } from "../utils/Actor";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { tVerse, useVerse } from "../utils/Verse";
import React from "react";
import { View } from "react-native";

type tColorWheel = tRadialObject & {
  wheelCenter?: number;
  draggable?: boolean;
  offsetLevel?: number;
  vSecondColor?: tVerse<number | null>;
  transitionAnim?: SharedValue<number>;
};

function ColorWheel({
  radii = [0, 200],
  ring = 5,
  chord = 18,
  arcLength = 44 / 7,
  wheelCenter = 11 / 7,
  draggable,
  offsetLevel = 50,
  vSecondColor,
  transitionAnim,
}: tColorWheel) {
  const vIntroAnim = useSharedValue(0);
  const secondColor = useVerse(null);
  vSecondColor = vSecondColor || secondColor;
  const transitionA = useSharedValue(0);
  const turnAnim = useSharedValue(0);
  transitionAnim = transitionAnim || transitionA;
  const { origin, wAngleToChord, wChordToAngle, wUpdateState } =
    useRadialContext();
  const { vColorModel } = useUserContext();
  const { vAccentC, vAccentL, vAccentAR } = useUserContext();
  const mColorModifier: tAttributeModifier = {
    modID: 0,
    deps: [vAccentC.shared, vAccentL.shared, vAccentAR.shared],
    modifier: (input: tAttributeMap) => {
      "worklet";
      let c = ((input.ring / ring) * 0.5 + 0.5) * vAccentC.shared.value;
      let l = ((input.ring / ring) * 0.5 + 0.5) * vAccentL.shared.value;
      let ar = wChordToAngle(input.chord, arcLength, chord, 0);
      let [r, g, b] = fCLARColorToRGB({ c, l, ar }, vColorModel.shared.value);
      return {
        ...input,
        red: r,
        green: g,
        blue: b,
      };
    },
  };
  const { registerHitBox: registerZone, unregisterHitBox } = usePanManager();
  const vPanPos = useSharedValue({ angle: 0, radius: 0 });
  const vPanState = useSharedValue<ePanEvent>("leave");
  const vStartAngle = useSharedValue(0);
  const dragStartAngle = useSharedValue(0);
  function fLerp(a: number, b: number, t: number): number {
    "worklet";
    return a + (b - a) * t;
  }
  const mTransformModifier: tAttributeModifier = {
    modID: 0,
    deps: [
      vAccentAR.shared,
      vAccentL.shared,
      vAccentC.shared,
      vPanPos,
      vStartAngle,
      dragStartAngle,
      vIntroAnim,
    ],
    modifier: (input: tAttributeMap) => {
      "worklet";
      let chords = chord;
      const chordLength = (2 * arcLength) / chords;
      let startRotation = wChordToAngle(input.chord, arcLength, chords, 0);
      let rotation = input.rotateZ - vAccentAR.shared.value;
      const selectedSector = wAngleToChord(
        vAccentAR.shared.value,
        arcLength,
        chords,
        0,
      );
      let diff = Math.abs(startRotation - vAccentAR.shared.value) % (44 / 7);
      if (diff > 22 / 7) diff = 44 / 7 - diff;
      let zDiff = Math.abs(input.chord - selectedSector) % chords;
      if (zDiff > chords / 2) zDiff = chords - zDiff;
      diff = Math.max(0, chordLength - diff) / chordLength;
      if (diff > 0.9) {
        diff = 1;
      }
      let tx = input.translateX + diff * offsetLevel;
      let zIndex = 2 * Math.round(chords / 2 - zDiff) + eLayers.colorMixer;
      let vS = 1 + Math.max(0, diff - 0.8);
      return {
        ...input,
        zIndex,
        rotateZ: fLerp(-22 / 7, rotation, vIntroAnim.value),
        scaleX: fLerp(1, vS, vIntroAnim.value),
        scaleY: fLerp(1, vS, vIntroAnim.value),
        translateX: fLerp(input.translateX - 100, tx, vIntroAnim.value),
        shadowRadius: fLerp(0, input.shadowRadius * vS, vIntroAnim.value),
        shadowX: fLerp(0.1, input.shadowX * vS, vIntroAnim.value),
        shadowY: fLerp(0.1, input.shadowY * vS, vIntroAnim.value),
      };
    },
  };

  const fOnLeave = (angleOffset = 0) => {
    "worklet";
    let nearestSector = wAngleToChord(
      vAccentAR.shared.value + angleOffset,
      arcLength,
      chord,
      0,
    );
    let nearestSectorAngle = wChordToAngle(nearestSector, arcLength, chord, 0);
    vAccentAR.shared.value = withTiming(
      nearestSectorAngle,
      { duration: 500 },
      wUpdateState,
    );
    console.log(
      "Wheel leaving, rotating to nearest sector",
      nearestSector,
      nearestSectorAngle,
    );
  };
  const fOnTap = useCallback(() => {
    "worklet";
    const offsetAngle = vPanPos.value.angle - 22 / 7;

    if (Math.abs(offsetAngle) > 0.4) {
      fOnLeave(offsetAngle);
    }
    console.log(
      "Tapped wheel," + offsetAngle + " rotating to " + vAccentAR.shared.value,
    );
  }, []);
  useAnimatedReaction(
    () => vPanPos.value,
    (pos) => {
      if (vPanState.value === "drag") {
        const angleDiff = vPanPos.value.angle - vStartAngle.value;
        vAccentAR.shared.value = dragStartAngle.value - angleDiff;
      }
    },
    [],
  );
  useAnimatedReaction(
    () => vPanState.value,
    (state) => {
      console.log("Wheel pan state changed:", state);
      switch (state) {
        case "enter":
          vStartAngle.value = vPanPos.value.angle;
          dragStartAngle.value = vAccentAR.shared.value;
          break;
        case "leave":
          fOnLeave();
          break;
        case "release":
          fOnLeave();
          break;
        case "drag":
          break;
        case "tap":
          fOnTap();
          break;
      }
    },
    [],
  );
  useEffect(() => {
    vIntroAnim.value = withDelay(500, withTiming(1, { duration: 500 }));
    if (!draggable) return;
    const id = `${ring}-${chord}`;
    registerZone({
      origin,
      id,
      radii,
      rotationR: wheelCenter,
      arcLength: 22 / 7,
      vPanPos,
      vPanState,
      priority: 5,
    });
    fOnLeave();
    return () => {
      unregisterHitBox(id);
    };
  }, []);
  const chordLength = arcLength / chord;
  const secondTransformModifier: tAttributeModifier = {
    modID: 2,
    deps: [vSecondColor.shared, vAccentAR.shared, transitionAnim],
    modifier: (input: tAttributeMap) => {
      "worklet";
      const offsetAngle = Math.abs(vAccentAR.shared.value) % chordLength;
      return {
        ...input,
        rotateZ:
          input.rotateZ - offsetAngle * transitionAnim.value - chordLength / 2,
        scaleX: 1.2,
        scaleY: 1.2,
        translateX: input.translateX - (1 - transitionAnim.value) * offsetLevel,
        zIndex: vSecondColor.shared.value !== null ? eLayers.chipFan + 1 : 0,
        shadowRadius: input.shadowRadius * 1.2,
        shadowX: input.shadowX * 1.2,
        shadowY: input.shadowY * 1.2,
      };
    },
  };

  const secondColorModifier: tAttributeModifier = {
    modID: 1,
    deps: [
      vSecondColor.shared,
      vColorModel.shared,
      vAccentC.shared,
      vAccentL.shared,
    ],
    modifier: (input: tAttributeMap) => {
      "worklet";
      let c = ((input.ring / ring) * 0.5 + 0.5) * vAccentC.shared.value;
      let l = ((input.ring / ring) * 0.5 + 0.5) * vAccentL.shared.value;
      let [r, g, b] = fCLARColorToRGB(
        { c, l, ar: vSecondColor.shared.value },
        vColorModel.shared.value,
      );
      return {
        ...input,
        red: r,
        green: g,
        blue: b,
      };
    },
  };

  return (
    <RadialContext
      value={{
        radii,
        mColorModifier,
        mTransformModifier,
        totalArcLength: arcLength,
        mainRotationR: wheelCenter,
        totalRings: ring,
        totalChords: chord,
        origin,
      }}
    >
      <RadialGraphic />
      {
        <RadialContext
          value={{
            mColorModifier: secondColorModifier,
            mTransformModifier: secondTransformModifier,
            totalChords: 1,
            totalArcLength: chordLength,
            mainRotationR: wheelCenter,
          }}
        >
          <RadialGraphic />
        </RadialContext>
      }
    </RadialContext>
  );
}
export { ColorWheel };
