import { fCLARColorToString, tPaint } from "./CLAcolor";
import { RadialGraphic } from "./RadialGraphic";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { fMakePetalPath } from "./Sector";
import { tSectorGroup } from "./sectorTypes";
import {
  useSharedValue,
  SharedValue,
  withTiming,
} from "react-native-reanimated";
import { usePanManager } from "./PanManager";
import { RadialContext, useRadialContext } from "./RadialContext";

type tColorWheel = {
  radii?: [number, number];
  rc?: { rings: number; chords: number };
  vRotationROffset?: SharedValue<number>;
  wheelCenter?: number;
};

function ColorWheel({
  radii = [20, 200],
  rc = { rings: 5, chords: 18 },
  vRotationROffset,
  wheelCenter = 11 / 7,
}: tColorWheel) {
  const arcLength = 43.9 / 7;
  const {
    origin,
    direction,
    wAngleToChord,
    wChordToAngle,
    dC,
    dL,
    dAR,
    wUpdateState: fUpdateState,
  } = useRadialContext();
  const vPanPos = useSharedValue({ angle: 0, radius: 0 });
  const { registerZone, unregisterZone } = usePanManager();

  const wGetColor = useCallback(
    (src: { rings: number; chords: number }) => {
      "worklet";
      const rdc = Math.pow(0.5, 1 / Math.max(rc.rings - 1, 1));
      const rdl = Math.pow(0.5, 1 / Math.max(rc.rings - 1, 1));
      let c = Math.pow(rdc, rc.rings - 1 - src.rings) * dC.value;
      let l = Math.pow(rdl, rc.rings - 1 - src.rings) * dL.value;
      let ar = wChordToAngle(src.chords, arcLength, rc.chords, 0);
      return fCLARColorToString({ c, l, ar });
    },
    [dC, dL, rc.rings, rc.chords, arcLength],
  );
  const wGetZIndex = useCallback(
    (src: { rings: number; chords: number }) => {
      "worklet";
      const selectedSector = wAngleToChord(dAR.value, arcLength, rc.chords, 0);
      let diff = Math.abs(src.chords - selectedSector) % rc.chords;
      if (diff > rc.chords / 2) {
        diff = rc.chords - diff;
      }
      return Math.round(rc.chords / 2 - diff);
    },
    [dAR, rc.chords, arcLength],
  );
  const wTransformMatrix = useCallback(
    (src: { rings: number; chords: number }, rotationR: number) => {
      "worklet";
      const adjustedRotationROffset = dAR.value;
      const rotation = wChordToAngle(src.chords, arcLength, rc.chords, 0);
      let diff = Math.abs(rotation - adjustedRotationROffset) % (44 / 7);
      if (diff > 22 / 7) {
        diff = 44 / 7 - diff;
      }

      diff =
        Math.max(0, (2 * arcLength) / rc.chords - diff) /
        ((2 * arcLength) / rc.chords);
      const vR = (rotationR + -vRotationROffset.value) * direction;
      const vS = 1 + (diff > 0.8 ? 0.3 : 0);
      return {
        r: vR,
        s: { x: vS, y: vS },
        offset: diff * 25,
      };
    },
    [],
  );
  const [selectedRing, setSelectedRing] = useState(-1);
  const fOnLeave = (angleOffset = 0) => {
    let nearestSector = wAngleToChord(
      vRotationROffset.value + angleOffset,
      arcLength,
      rc.chords,
      0,
    );
    let nearestSectorAngle = wChordToAngle(
      nearestSector,
      arcLength,
      rc.chords,
      0,
    );
    vRotationROffset.value = withTiming(nearestSectorAngle);
    setSelectedRing(nearestSector);
    fUpdateState();
  };
  const fSectorGroupModifier = (sectorGroup: tSectorGroup) => {
    return sectorGroup;
  };
  const fOnTap = useCallback(() => {
    const offsetAngle = vPanPos.value.angle - 22 / 7;

    if (Math.abs(offsetAngle) > 0.4) {
      fOnLeave(offsetAngle);
    }
    console.log(
      "Tapped wheel," + offsetAngle + " rotating to " + vRotationROffset.value,
    );
  }, []);
  const [zoneID, setZoneID] = useState(-10);

  useEffect(() => {
    registerZone({
      fOnLeave,
      radii,
      rotationR: wheelCenter,
      arcLength,
      vPanPos,
      vDrag: vRotationROffset,
      origin: origin,
      priority: 10,
      fOnTap,
    });
    fOnLeave();
    return () => {
      if (zoneID !== -10) {
        unregisterZone(zoneID);
      }
    };
  }, []);

  return (
    <RadialContext
      value={{
        radii,
        fPathFunction: fMakePetalPath,
        wGetColor,
        wTransformMatrix,
        wGetZIndex,
        deps: [dC, dL],
        selectedRing,
      }}
    >
      <RadialGraphic
        rc={rc}
        arcLength={arcLength}
        rotationR={wheelCenter}
        fSectorGroupModifier={fSectorGroupModifier}
      />
    </RadialContext>
  );
}
export { ColorWheel };
