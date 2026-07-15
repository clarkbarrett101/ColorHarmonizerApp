import {
  fCLARColorToRGB,
  fCLARColorToString,
  fRGBToCLARColor,
  tCLARColor,
} from "../utils/CLAcolor";
import { RadialGraphic } from "../Radials/RadialGraphic";
import { use, useCallback, useEffect, useState } from "react";
import { tRadialObject, tSector, tSectorGroup } from "../Radials/SectorTypes";
import {
  useSharedValue,
  SharedValue,
  withTiming,
  useAnimatedReaction,
} from "react-native-reanimated";
import { ePanEvent, usePanManager } from "../Contexts/PanManager";
import { RadialContext, useRadialContext } from "../Radials/RadialContext";
import { tAttributeMap, tAttributeModifier } from "../utils/Actor";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { tVerse } from "../utils/Verse";

type tColorWheel = tRadialObject & {
  vRotationROffset?: SharedValue<number>;
  wheelCenter?: number;
  vSecondColor?: tVerse<number | null>;
  draggable?: boolean;
};

function ColorWheel({
  radii = [0, 200],
  ring = 5,
  chord = 18,
  vRotationROffset,
  arcLength = 44 / 7,
  wheelCenter = 11 / 7,
  draggable,
}: tColorWheel) {
  const { origin, wAngleToChord, wChordToAngle, dC, dL, dAR, wUpdateState } =
    useRadialContext();
  const { vColorModel } = useUserContext();
  const mColorModifier: tAttributeModifier = {
    modID: 0,
    deps: [dC, dL, dAR],
    modifier: (input: tAttributeMap) => {
      "worklet";
      let c = ((input.ring / ring) * 0.5 + 0.5) * dC.value;
      let l = ((input.ring / ring) * 0.5 + 0.5) * dL.value;
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

  const mTransformModifier: tAttributeModifier = {
    modID: 0,
    deps: [dAR, dL, dC, vRotationROffset, vPanPos, vStartAngle, dragStartAngle],
    modifier: (input: tAttributeMap) => {
      "worklet";
      let chords = chord;
      const chordLength = (2 * arcLength) / chords;
      let startRotation = wChordToAngle(input.chord, arcLength, chords, 0);
      let rotation = input.rotateZ + -vRotationROffset.value;
      const selectedSector = wAngleToChord(dAR.value, arcLength, chords, 0);
      let diff = Math.abs(startRotation - dAR.value) % (44 / 7);
      if (diff > 22 / 7) diff = 44 / 7 - diff;
      let zDiff = Math.abs(input.chord - selectedSector) % chords;
      if (zDiff > chords / 2) zDiff = chords - zDiff;
      diff = Math.max(0, chordLength - diff) / chordLength;
      if (diff > 0.9) {
        diff = 1;
      }
      let tx = input.translateX + diff * 50;
      let zIndex = 2 * Math.round(chords / 2 - zDiff) + eLayers.colorMixer;
      let vS = 1 + Math.max(0, diff - 0.8);

      return {
        ...input,
        zIndex,
        rotateZ: rotation,
        scaleX: vS,
        scaleY: vS,
        translateX: tx,
        shadowRadius: input.shadowRadius * vS,
        shadowX: input.shadowX * vS,
        shadowY: input.shadowY * vS,
      };
    },
  };

  const fOnLeave = (angleOffset = 0) => {
    "worklet";
    let nearestSector = wAngleToChord(
      vRotationROffset.value + angleOffset,
      arcLength,
      chord,
      0,
    );
    let nearestSectorAngle = wChordToAngle(nearestSector, arcLength, chord, 0);
    vRotationROffset.value = withTiming(nearestSectorAngle);
    console.log(
      "Wheel leaving, rotating to nearest sector",
      nearestSector,
      nearestSectorAngle,
    );
    if (wUpdateState) {
      wUpdateState();
    }
  };
  const fOnTap = useCallback(() => {
    "worklet";
    const offsetAngle = vPanPos.value.angle - 22 / 7;

    if (Math.abs(offsetAngle) > 0.4) {
      fOnLeave(offsetAngle);
    }
    console.log(
      "Tapped wheel," + offsetAngle + " rotating to " + vRotationROffset.value,
    );
  }, []);
  useAnimatedReaction(
    () => vPanPos.value,
    (pos) => {
      if (vPanState.value === "drag") {
        const angleDiff = vPanPos.value.angle - vStartAngle.value;
        vRotationROffset.value = dragStartAngle.value - angleDiff;
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
          dragStartAngle.value = vRotationROffset.value;
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
    </RadialContext>
  );
}
export { ColorWheel };
