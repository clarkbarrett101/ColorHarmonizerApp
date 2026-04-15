import { useCallback, useEffect, useState } from "react";
import { tCLARColor } from "./CLAcolor";
import { fGetColorsFromGrid, RadialGraphic } from "./RadialGraphic";
import { fMakePetalPath } from "./Sector";
import { usePanManager } from "./PanManager";
import { tSector, tSectorGroup } from "./sectorTypes";
import {
  DerivedValue,
  SharedValue,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { RadialContext, useRadialContext } from "./RadialContext";

export type tTintSelector = {
  rc?: { rings: number; chords: number };
  arcLength?: number;
  rotationR?: number;
  radii?: [number, number];
  fSectorModifier?: (sector: tSector) => tSector;
  fSectorGroupModifier?: (group: tSectorGroup) => any;
  vPanPos?: SharedValue<{ angle: number; radius: number }>;
  wGetColor?: (rc: { rings: number; chords: number }) => string;
};

export function TintSelector({
  rc = { rings: 6, chords: 4 },
  arcLength = 30,
  rotationR = 22 / 7,
  radii = [150, 300],
  vPanPos,
  fSectorModifier,
  fSectorGroupModifier,
  wGetColor,
}: tTintSelector) {
  const { registerZone, unregisterZone, selectedZone } = usePanManager();
  const [isSelected, setIsSelected] = useState(false);
  const context = useRadialContext();
  const { origin, wAngleToChord, wChordToAngle, direction, dAR, dL, dC } =
    context;
  const [zoneId, setZoneId] = useState<number>(-10);
  const fOnEnter = () => {
    let nearestSectorAngle = wChordToAngle(
      wAngleToChord(vPanPos.value.angle, arcLength, rc.chords, rotationR),
      arcLength,
      rc.chords,
      rotationR,
    );
    vPanPos.value = { ...vPanPos.value, angle: nearestSectorAngle };
  };
  function fAssignZoneID(id: number) {
    setZoneId(id);
  }
  useEffect(() => {
    registerZone({
      vPanPos,
      radii,
      arcLength: (arcLength * (rc.chords - 1)) / rc.chords,
      rotationR,
      origin,
      fOnEnter: () => (setIsSelected(true), fOnEnter()),
      fOnLeave: () => (setIsSelected(false), fOnEnter()),
      travelLimit: (arcLength / rc.chords) * 2,
    });
    return () => {
      if (zoneId !== -10) {
        unregisterZone(zoneId);
      }
    };
  }, []);
  const wMatrix = useCallback((src: { rings: number; chords: number }) => {
    "worklet";
    let angle = wChordToAngle(src.chords, arcLength, rc.chords, rotationR);
    let diff = Math.min(
      Math.abs(angle - vPanPos.value.angle) / (arcLength / rc.chords),
      1,
    );
    diff = 1 - diff;
    angle = angle * direction;
    return {
      vT: { x: 0, y: 0 },
      vR: angle,
      vS: 1 + (diff > 0.5 ? (diff - 0.5) * 0.1 : 0),
    };
  }, []);
  const wGetZIndex = useCallback(
    (src: { rings: number; chords: number }) => {
      "worklet";
      let angle = wChordToAngle(src.chords, arcLength, rc.chords, rotationR);
      let diff = Math.max(
        Math.abs(vPanPos.value.angle - angle) / (arcLength / rc.chords),
        0,
      );
      return Math.round((1 - diff) * 100);
    },
    [rc.rings, rc.chords],
  );

  return (
    <RadialContext
      value={{
        radii,
        fPathFunction: fMakePetalPath,
        wGetColor,
        wTransformMatrix: wMatrix,
        vPanPos,
        wGetZIndex,
        deps: [dAR, dL, dC],
        isSelected,
      }}
    >
      <RadialGraphic
        rotationR={rotationR}
        arcLength={arcLength}
        rc={rc}
        fSectorModifier={fSectorModifier}
        fSectorGroupModifier={fSectorGroupModifier}
      />
    </RadialContext>
  );
}
