import { useCallback, useEffect, useState } from "react";
import { RadialGraphic } from "./RadialGraphic";
import { fMakePetalPath } from "./Sector";
import { usePanManager } from "./PanManager";
import { tRadialObject, tSector, tSectorGroup } from "./sectorTypes";
import { SharedValue } from "react-native-reanimated";
import { RadialContext, useRadialContext } from "./RadialContext";
import { tAttributeMap, tAttributeModifier } from "./Actor";
import { eLayers } from "./UserContext";

export type tTintSelector = tRadialObject & {
  fSectorModifier?: (sector: tSector) => tSector;
  fSectorGroupModifier?: (group: tSectorGroup) => any;
  vPanPos?: SharedValue<{ angle: number; radius: number }>;
  colorModifier?: tAttributeModifier;
};

export function TintSelector({
  ring = 6,
  chord = 4,
  arcLength = 30,
  rotationR = 22 / 7,
  radii = [150, 300],
  vPanPos,
  fSectorModifier,
  fSectorGroupModifier,
  colorModifier,
}: tTintSelector) {
  const { registerZone } = usePanManager();
  const context = useRadialContext();
  const { origin, wAngleToChord, wChordToAngle, direction, wUpdateState } =
    context;
  const [lastAngle, setAngle] = useState<number>(0);
  const fOnEnter = () => {
    let nearestSectorAngle = wChordToAngle(
      wAngleToChord(vPanPos.value.angle, arcLength, chord, rotationR),
      arcLength,
      chord,
      rotationR,
    );
    if (nearestSectorAngle !== lastAngle) {
      vPanPos.value = { ...vPanPos.value, angle: nearestSectorAngle };
      setAngle(nearestSectorAngle);
      wUpdateState();
    }
  };

  useEffect(() => {
    const unregisterZone = registerZone({
      vPanPos,
      radii,
      arcLength: (arcLength * (chord - 1)) / chord,
      rotationR,
      origin,
      fOnEnter,
      fOnLeave: fOnEnter,
    });
    return () => {
      unregisterZone();
    };
  }, []);

  const transformModifier: tAttributeModifier = {
    modID: 0,
    deps: [vPanPos],
    modifier: (input: tAttributeMap) => {
      "worklet";
      let angle = wChordToAngle(input.chord, arcLength, chord, rotationR);
      let diff = Math.min(
        Math.abs(angle - vPanPos.value.angle) / (arcLength / chord),
        1,
      );
      diff = 1 - diff;
      const z = Math.round(diff * chord) + eLayers.colorMixer;
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
        mColorModifier: colorModifier,
        mTransformModifier: transformModifier,
        vPanPos,
      }}
    >
      <RadialGraphic
        rotationR={rotationR}
        arcLength={arcLength}
        ring={ring}
        chord={chord}
        fSectorModifier={fSectorModifier}
        fSectorGroupModifier={fSectorGroupModifier}
      />
    </RadialContext>
  );
}
