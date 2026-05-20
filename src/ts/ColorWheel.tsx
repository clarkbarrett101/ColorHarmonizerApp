import { fCLARColorToRGB, fCLARColorToString, tPaint } from "./CLAcolor";
import { RadialGraphic } from "./RadialGraphic";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { fMakePetalPath } from "./Sector";
import { tRadialObject, tSectorGroup } from "./sectorTypes";
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
    direction,
    wAngleToChord,
    wChordToAngle,
    dC,
    dL,
    dAR,
    wUpdateState: fUpdateState,
  } = useRadialContext();
  const vPanPos = useSharedValue({ angle: 0, radius: 0 });
  const { registerZone } = usePanManager();

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
      const [r, g, b] = fCLARColorToRGB({ c, l, ar });
      return {
        ...input,
        red: r,
        green: g,
        blue: b,
      };
    },
  };
  const mTransformModifier: tAttributeModifier = {
    modID: 0,
    deps: [dAR, dL, dC],
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
      chord,
      0,
    );
    let nearestSectorAngle = wChordToAngle(nearestSector, arcLength, chord, 0);
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
  console.log("Rendering ColorWheel with selected ring", selectedRing);
  useEffect(() => {
    const unregisterZone = registerZone({
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
      unregisterZone();
    };
  }, []);

  return (
    <RadialContext
      value={{
        radii,
        fPathFunction: fMakePetalPath,
        mColorModifier,
        mTransformModifier,
      }}
    >
      <RadialGraphic
        arcLength={arcLength}
        rotationR={wheelCenter}
        fSectorGroupModifier={fSectorGroupModifier}
      />
    </RadialContext>
  );
}
export { ColorWheel };
