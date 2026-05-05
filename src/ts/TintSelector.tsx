import { useCallback, useEffect, useState } from "react";
import { RadialGraphic } from "./RadialGraphic";
import { fMakePetalPath } from "./Sector";
import { usePanManager } from "./PanManager";
import { tSector, tSectorGroup } from "./sectorTypes";
import { SharedValue } from "react-native-reanimated";
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
  const { registerZone, unregisterZone } = usePanManager();
  const [isSelected, setIsSelected] = useState(false);
  const context = useRadialContext();
  const {
    origin,
    wAngleToChord,
    wChordToAngle,
    direction,
    dAR,
    dL,
    dC,
    wUpdateState,
  } = context;
  const [zoneId, setZoneId] = useState<number>(-10);
  const [lastAngle, setAngle] = useState<number>(0);
  const fOnEnter = () => {
    let nearestSectorAngle = wChordToAngle(
      wAngleToChord(vPanPos.value.angle, arcLength, rc.chords, rotationR),
      arcLength,
      rc.chords,
      rotationR,
    );
    if (nearestSectorAngle !== lastAngle) {
      vPanPos.value = { ...vPanPos.value, angle: nearestSectorAngle };
      setAngle(nearestSectorAngle);
      wUpdateState();
    }
  };

  useEffect(() => {
    registerZone({
      vPanPos,
      radii,
      arcLength: (arcLength * (rc.chords - 1)) / rc.chords,
      rotationR,
      origin,
      fOnEnter,
      fOnLeave: fOnEnter,
    });
    return () => {
      if (zoneId !== -10) {
        unregisterZone(zoneId);
      }
    };
  }, []);

  const wTransformMatrix = useCallback(
    (src: { rings: number; chords: number }, r: number) => {
      "worklet";
      let angle = wChordToAngle(src.chords, arcLength, rc.chords, rotationR);
      let diff = Math.min(
        Math.abs(angle - vPanPos.value.angle) / (arcLength / rc.chords),
        1,
      );
      diff = 1 - diff;
      angle = angle * direction;
      const vs = 1 + (diff > 0.5 ? (diff - 0.5) * 0.1 : 0);
      return {
        r: angle,
        s: { x: vs, y: vs },
      };
    },
    [vPanPos, rc.chords, arcLength, direction],
  );
  const wGetZIndex = useCallback(
    (src: { rings: number; chords: number }) => {
      "worklet";
      let angle = wChordToAngle(src.chords, arcLength, rc.chords, rotationR);
      let diff = Math.max(
        Math.abs(vPanPos.value.angle - angle) / (arcLength / rc.chords),
        0,
      );
      return Math.round((1 - diff) * rc.chords);
    },
    [rc.rings, rc.chords],
  );

  return (
    <RadialContext
      value={{
        radii,
        fPathFunction: fMakePetalPath,
        wGetColor,
        wTransformMatrix,
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
