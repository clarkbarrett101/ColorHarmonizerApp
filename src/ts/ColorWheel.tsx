import { fCLARColorToRGB, fRGBToCLARColor } from "./CLAcolor";
import { RadialGraphic } from "./RadialGraphic";
import { use, useCallback, useEffect, useState } from "react";
import { tRadialObject } from "./sectorTypes";
import {
  useSharedValue,
  SharedValue,
  withTiming,
  useAnimatedReaction,
} from "react-native-reanimated";
import { ePanEvent, usePanManager } from "./PanManager";
import { RadialContext, useRadialContext } from "./RadialContext";
import { tAttributeMap, tAttributeModifier } from "./Actor";
import { eLayers } from "./UserContext";
import { scheduleOnRN } from "react-native-worklets";

type tColorWheel = tRadialObject & {
  vRotationROffset?: SharedValue<number>;
  wheelCenter?: number;
};

function ColorWheel({
  radii = [20, 200],
  ring = 5,
  chord = 18,
  vRotationROffset,
  arcLength = 43.9 / 7,
  wheelCenter = 11 / 7,
}: tColorWheel) {
  const {
    origin,
    wAngleToChord,
    wChordToAngle,
    dC,
    dL,
    dAR,
    wUpdateState: fUpdateState,
  } = useRadialContext();

  const mColorModifier: tAttributeModifier = {
    modID: 0,
    deps: [dC, dL, dAR],
    modifier: (input: tAttributeMap) => {
      "worklet";
      const rdc = Math.pow(0.5, 1 / Math.max(ring - 1, 1));
      const rdl = Math.pow(0.5, 1 / Math.max(ring - 1, 1));
      let c = Math.pow(rdc, ring - 1 - input.ring) * dC.value;
      let l = Math.pow(rdl, ring - 1 - input.ring) * dL.value;
      let ar = wChordToAngle(input.chord, arcLength, chord, 0);
      let [r, g, b] = fCLARColorToRGB({ c, l, ar });
      if (input.ring > 1) {
        [r, g, b] = fCLARColorToRGB(fRGBToCLARColor([r, g, b]));
      }
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
      const adjustedRotationROffset = dAR.value;
      const rotation = wChordToAngle(input.chord, arcLength, chord, 0);
      let diff = Math.abs(rotation - adjustedRotationROffset) % (44 / 7);
      if (diff > 22 / 7) {
        diff = 44 / 7 - diff;
      }
      const selectedSector = wAngleToChord(dAR.value, arcLength, chord, 0);
      let zDiff = Math.abs(input.chord - selectedSector) % chord;
      if (zDiff > chord / 2) {
        zDiff = chord - zDiff;
      }
      const zIndex = Math.round(chord / 2 - zDiff) + eLayers.colorMixer;
      diff =
        Math.max(0, (2 * arcLength) / chord - diff) / ((2 * arcLength) / chord);
      const vR = input.rotateZ + -vRotationROffset.value;
      const vS = 1 + Math.max(0, diff - 0.8);
      return {
        ...input,
        zIndex,
        rotateZ: vR,
        scaleX: vS,
        scaleY: vS,
        translateX: diff * 25,
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
    fUpdateState();
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
    const id = `${ring}-${chord}`;
    registerZone({
      origin,
      id,
      radii,
      rotationR: wheelCenter,
      arcLength,
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
      }}
    >
      <RadialGraphic />
    </RadialContext>
  );
}
export { ColorWheel };
