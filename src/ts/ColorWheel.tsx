import { View, Dimensions, PanResponder } from "react-native";
import { CLARColor, tCLARColor } from "./CLAcolor";
import {
  RadialGraphic,
  tColorRange,
  fGetColorsFromGrid,
} from "./RadialGraphic";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { fMakePetalPath } from "./Sector";
import { tSectorGroup } from "./sectorTypes";
import {
  DerivedValue,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { usePanManager } from "./PanManager";
import {
  RadialContext,
  useRadialContext,
  wDefaultAngleToChord,
} from "./RadialContext";
import { SharedValue } from "react-native-gesture-handler/lib/typescript/v3/types";
type tColorWheel = {
  radii?: [number, number];
  rc?: { rings: number; chords: number };
  vRotationROffset?: SharedValue<number>;
  wheelCenter?: number;
  colorState?: tCLARColor;
};
function ColorWheel({
  radii = [20, 200],
  rc = { rings: 5, chords: 18 },
  vRotationROffset,
  wheelCenter = 11 / 7,
  colorState,
}: tColorWheel) {
  const arcLength = 43.9 / 7;
  const context = useRadialContext();
  const {
    origin,
    direction,
    wAngleToChord,
    wChordToAngle,
    vSelectColor,
    setSelectColor,
  } = context;
  const wGetColor = useCallback(
    (src: { rings: number; chords: number }) => {
      "worklet";
      const rdc = Math.pow(0.5, 1 / Math.max(rc.rings - 1, 1));
      const rdl = Math.pow(0.5, 1 / Math.max(rc.rings - 1, 1));
      let c = Math.pow(rdc, rc.rings - 1 - src.rings) * vSelectColor.value.c;
      let l = Math.pow(rdl, rc.rings - 1 - src.rings) * vSelectColor.value.l;
      let ar = wChordToAngle(src.chords, arcLength, rc.chords, 0);
      return { c, l, ar };
    },
    [vSelectColor, rc.rings, rc.chords, arcLength],
  );

  const wGetZIndex = useCallback(
    (src: { rings: number; chords: number }) => {
      "worklet";
      const selectedSector = wAngleToChord(
        vSelectColor.value.ar,
        arcLength,
        rc.chords,
        0,
      );
      let diff = Math.abs(src.chords - selectedSector) % rc.chords;
      if (diff > rc.chords / 2) {
        diff = rc.chords - diff;
      }
      return Math.round((rc.chords / 2 - diff) * 100);
    },
    [rc.rings, rc.chords],
  );

  const groupModifier = useMemo(() => {
    return (group: tSectorGroup) => {
      return group;
    };
  }, [direction, rc.chords, colorState]);

  const fOnLeave = () => {
    let nearestSectorAngle = wChordToAngle(
      wAngleToChord(vRotationROffset.value, arcLength, rc.chords, 0),
      arcLength,
      rc.chords,
      0,
    );
    vRotationROffset.value = nearestSectorAngle;
    setSelectColor({ ...vSelectColor.value });
  };
  const vPanPos = useSharedValue({ angle: 0, radius: 0 });
  useEffect(() => {
    console.log("Selected Chord:", colorState.ar);
  }, [colorState]);
  const { registerZone } = usePanManager();
  useEffect(() => {
    registerZone({
      fOnLeave,
      radii,
      rotationR: wheelCenter,
      arcLength,
      vPanPos,
      vDrag: vRotationROffset,
      origin: origin,
      travelLimit: (arcLength / rc.chords) * 2,
      priority: 10,
    });
    fOnLeave();
  }, []);
  const wMatrix = useCallback(
    (src: { rings: number; chords: number }, rotationR: number) => {
      "worklet";
      /*  const adjustedRotationROffset =
        (((vRotationROffset.value + wheelCenter) % (44 / 7)) + 44 / 7) %
        (44 / 7);
        */
      const adjustedRotationROffset = vSelectColor.value.ar;
      const rotation = wChordToAngle(src.chords, arcLength, rc.chords, 0);
      let diff = Math.abs(rotation - adjustedRotationROffset) % (44 / 7);
      if (diff > 22 / 7) {
        diff = 44 / 7 - diff;
      }
      diff =
        Math.max(0, (2 * arcLength) / rc.chords - diff) /
        ((2 * arcLength) / rc.chords);
      if (diff > 1) {
        console.log({ diff, rotationR, adjustedRotationROffset });
      }
      const vR = (rotationR + -vRotationROffset.value) * direction;
      const vT = { x: Math.cos(vR) * diff * 10, y: Math.sin(vR) * diff * 10 };
      return { vT, vR, vS: 1 + diff * 0.3 };
    },
    [direction, rc.chords],
  );

  return (
    <RadialContext
      value={{
        radii,
        fPathFunction: fMakePetalPath,
        wGetColor,
        wTransformMatrix: wMatrix,
        wGetZIndex,
      }}
    >
      <RadialGraphic
        rc={rc}
        arcLength={arcLength}
        rotationR={wheelCenter}
        fSectorGroupModifier={groupModifier}
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 20 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
          zIndex: 10,
        }}
      />
    </RadialContext>
  );
}
export { ColorWheel };
