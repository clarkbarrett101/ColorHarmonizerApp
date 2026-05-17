import { useCallback, useEffect, useState } from "react";
import { RadialGraphic } from "./RadialGraphic";
import { fMakePetalPath } from "./Sector";
import { usePanManager } from "./PanManager";
import { tSector, tSectorGroup } from "./sectorTypes";
import { SharedValue } from "react-native-reanimated";
import { RadialContext, useRadialContext } from "./RadialContext";
import { tAttributeMap, tAttributeModifier } from "./Actor";
import { eLayers } from "./UserContext";

export type tTintSelector = {
  rc?: { rings: number; chords: number };
  arcLength?: number;
  rotationR?: number;
  radii?: [number, number];
  fSectorModifier?: (sector: tSector) => tSector;
  fSectorGroupModifier?: (group: tSectorGroup) => any;
  vPanPos?: SharedValue<{ angle: number; radius: number }>;
  colorModifier?: tAttributeModifier;
};

export function TintSelector({
  rc = { rings: 6, chords: 4 },
  arcLength = 30,
  rotationR = 22 / 7,
  radii = [150, 300],
  vPanPos,
  fSectorModifier,
  fSectorGroupModifier,
  colorModifier,
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

  const transformModifier: tAttributeModifier = {
    modID: 0,
    deps: [vPanPos],
    modifier: (input: tAttributeMap) => {
      "worklet";
      let angle = wChordToAngle(input.chord, arcLength, rc.chords, rotationR);
      let diff = Math.min(
        Math.abs(angle - vPanPos.value.angle) / (arcLength / rc.chords),
        1,
      );
      diff = 1 - diff;
      const z = Math.round(diff * rc.chords) + eLayers.colorMixer;
      angle = angle * direction;
      const vs = 1 + (diff > 0.5 ? (diff - 0.5) * 0.1 : 0);
      return {
        ...input,
        rotateZ: angle,
        scaleX: vs,
        scaleY: vs,
        zIndex: z,
        shadowRadius: input.shadowRadius * vs,
        shadowX: input.shadowX * vs,
        shadowY: input.shadowY * vs,
      };
    },
  };
  return (
    <RadialContext
      value={{
        radii,
        fPathFunction: fMakePetalPath,
        colorModifier,
        transformModifier,
        vPanPos,
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
