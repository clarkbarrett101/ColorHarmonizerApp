import { useCallback, useEffect, useState } from "react";
import { CLARColor, tCLARColor } from "./CLAcolor";
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
import {
  fDefaultAngleToChord,
  fDefaultChordToAngle,
  RadialContext,
  useRadialContext,
} from "./RadialContext";

export type tTintSelector = {
  rc?: { rings: number; chords: number };
  arcLength?: number;
  rotationR?: number;
  radii?: [number, number];
  sectorModifier?: (sector: tSector) => tSector;
  sectorGroupModifier?: (group: tSectorGroup) => any;
  panPos?: SharedValue<{ angle: number; radius: number }>;
  onSelect?: (color: CLARColor) => void;
  getColor?: (rc: { rings: number; chords: number }) => tCLARColor;
};

export function TintSelector({
  rc = { rings: 6, chords: 4 },
  arcLength = 30,
  rotationR = 22 / 7,
  radii = [150, 300],
  panPos,
  sectorModifier,
  sectorGroupModifier,
  getColor,
}: tTintSelector) {
  const { registerZone, unregisterZone } = usePanManager();
  const context = useRadialContext();
  const { origin, selectColor, angleToChord, chordToAngle } = context;
  const [zoneId, setZoneId] = useState<number | null>(null);
  const onEnter = () => {
    let nearestSectorAngle = chordToAngle(
      angleToChord(panPos.value.angle, arcLength, rc.chords, rotationR),
      arcLength,
      rc.chords,
      rotationR,
    );
    panPos.value = { ...panPos.value, angle: nearestSectorAngle };
  };
  useEffect(() => {
    const id = registerZone({
      panPos,
      radii,
      arcLength,
      rotationR,
      origin,
      onEnter,
      onLeave: onEnter,
      travelLimit: 1,
    });
    setZoneId(id);
    return () => {
      if (zoneId !== null) {
        unregisterZone(zoneId);
      }
    };
  }, []);
  const offset = useCallback(
    (src: { rings: number; chords: number }, rotation: number) => {
      "worklet";
      let angle =
        (src.chords + 0.5) * (arcLength / rc.chords) +
        rotationR -
        arcLength / 2;
      let diff = Math.abs(panPos.value.angle - angle);
      if (diff > arcLength / rc.chords / 2) {
        return 0;
      }
      diff = (1 - diff / (arcLength / rc.chords / 2)) * 20;
      return diff;
    },
    [],
  );
  return (
    <RadialContext
      value={{
        radii,
        pathFunction: fMakePetalPath,
        getColor,
        offset: offset,
        panPos,
      }}
    >
      <RadialGraphic
        rotationR={rotationR}
        arcLength={arcLength}
        rc={rc}
        sectorModifier={sectorModifier}
        sectorGroupModifier={sectorGroupModifier}
      />
    </RadialContext>
  );
}
