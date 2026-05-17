import { fCLARColorToRGB, fCLARColorToString, tPaint } from "./CLAcolor";
import { RadialGraphic } from "./RadialGraphic";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { fMakePetalPath } from "./Sector";
import { tSectorGroup } from "./sectorTypes";
import {
  useSharedValue,
  SharedValue,
  withTiming,
  makeMutable,
} from "react-native-reanimated";
import { usePanManager } from "./PanManager";
import { RadialContext, useRadialContext } from "./RadialContext";
import { tAttributeMap, tAttributeModifier } from "./Actor";
import { eLayers } from "./UserContext";

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

  const colorModifier: tAttributeModifier = {
    modID: 0,
    deps: [dC, dL, dAR],
    modifier: (input: tAttributeMap) => {
      "worklet";
      const rdc = Math.pow(0.5, 1 / Math.max(rc.rings - 1, 1));
      const rdl = Math.pow(0.5, 1 / Math.max(rc.rings - 1, 1));
      let c = Math.pow(rdc, rc.rings - 1 - input.ring) * dC.value;
      let l = Math.pow(rdl, rc.rings - 1 - input.ring) * dL.value;
      let ar = wChordToAngle(input.chord, arcLength, rc.chords, 0);
      const [r, g, b] = fCLARColorToRGB({ c, l, ar });
      return {
        ...input,
        red: r,
        green: g,
        blue: b,
      };
    },
  };
  const transformModifier: tAttributeModifier = {
    modID: 0,
    deps: [dAR, dL, dC],
    modifier: (input: tAttributeMap) => {
      "worklet";
      const adjustedRotationROffset = dAR.value;
      const rotation = wChordToAngle(input.chord, arcLength, rc.chords, 0);
      let diff = Math.abs(rotation - adjustedRotationROffset) % (44 / 7);
      if (diff > 22 / 7) {
        diff = 44 / 7 - diff;
      }
      const selectedSector = wAngleToChord(dAR.value, arcLength, rc.chords, 0);
      let zDiff = Math.abs(input.chord - selectedSector) % rc.chords;
      if (zDiff > rc.chords / 2) {
        zDiff = rc.chords - zDiff;
      }
      const zIndex = Math.round(rc.chords / 2 - zDiff) + eLayers.colorMixer;
      diff =
        Math.max(0, (2 * arcLength) / rc.chords - diff) /
        ((2 * arcLength) / rc.chords);
      const vR = (input.rotateZ + -vRotationROffset.value) * direction;
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
  console.log("Rendering ColorWheel with selected ring", selectedRing);
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
        colorModifier,
        transformModifier,
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
