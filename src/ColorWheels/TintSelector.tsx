import { use, useCallback, useEffect, useState } from "react";
import { RadialGraphic } from "../Radials/RadialGraphic";
import { ePanEvent, usePanManager } from "../Contexts/PanManager";
import { tRadialObject, tSector, tSectorGroup } from "../Radials/SectorTypes";
import {
  SharedValue,
  useAnimatedReaction,
  useSharedValue,
} from "react-native-reanimated";
import { RadialContext, useRadialContext } from "../Radials/RadialContext";
import { tAttributeMap, tAttributeModifier } from "../utils/Actor";
import { eLayers } from "../Contexts/UserContext";
import { scheduleOnRN } from "react-native-worklets";

export type tTintSelector = tRadialObject & {
  fSectorModifier?: (sector: tSector) => tSector;
  fSectorGroupModifier?: (group: tSectorGroup) => any;
  vPanPos?: SharedValue<{ angle: number; radius: number }>;
  colorModifier?: tAttributeModifier;
};

export function TintSelector({
  ring = 6,
  chord = 4,
  arcLength = 5.5 / 7,
  rotationR = 22 / 7,
  radii = [150, 300],
  vPanPos,
  fSectorModifier,
  fSectorGroupModifier,
  colorModifier,
}: tTintSelector) {
  const { registerHitBox: registerZone, unregisterHitBox } = usePanManager();
  const vPanState = useSharedValue<ePanEvent>("leave");
  const context = useRadialContext();
  const { origin, wAngleToChord, wChordToAngle } = context;
  const lastAngle = useSharedValue(vPanPos?.value.angle ?? 0);

  useEffect(() => {
    const id = "" + ring + "-" + chord;
    registerZone({
      id,
      radii,
      arcLength,
      rotationR,
      origin,
      vPanPos,
      vPanState,
    });
    return () => {
      unregisterHitBox(id);
    };
  }, []);

  const transformModifier: tAttributeModifier = {
    modID: 0,
    deps: [vPanPos],
    modifier: (input: tAttributeMap) => {
      "worklet";
      let angle = wChordToAngle(input.chord, arcLength, chord, rotationR);
      let diff = Math.abs(angle - vPanPos.value.angle) / (arcLength / 2);
      diff = 1 - diff;
      const z = Math.round(diff * chord) + eLayers.colorMixer;
      const vs = 1 + (diff > 1 / chord ? (diff - 1 / chord) * 0.1 : 0);
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
