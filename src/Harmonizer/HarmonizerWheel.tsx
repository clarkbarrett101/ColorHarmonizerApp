import { View, Text, Dimensions } from "react-native";
import React, { use, useEffect } from "react";
import type { tHarmonizerPhase } from "./ColorHarmonizer";
import {
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  RadialContext,
  wDefaultAngleToChord,
  wDefaultChordToAngle,
} from "../Radials/RadialContext";
import { BGGradient } from "../ColorWheels/BGGradient";
import { ColorWheel } from "../ColorWheels/ColorWheel";
import { tRadialObject } from "../Radials/SectorTypes";
import { tVerse, useVerse } from "../utils/Verse";
import { RadialGraphic } from "../Radials/RadialGraphic";
import { PetalButton } from "../Buttons/PetalButton";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { ePanEvent } from "../Contexts/PanManager";
import { tAttributeMap, tAttributeModifier } from "../utils/Actor";
import { fCLARColorToRGB, tCLARColor } from "../utils/CLAcolor";
export type tHarmonizerWheel = tRadialObject & {
  draggable?: boolean;
  vSelectedAngles?: tVerse<number[]>;
  vPhase?: tVerse<tHarmonizerPhase>;
};
export function HarmonizerWheel({
  radii = [0, 250],
  origin = [
    Dimensions.get("window").width + radii[0],
    Dimensions.get("window").height / 2,
  ],
  rotationR = 22 / 7,
  arcLength = 44 / 7,
  ring = 5,
  chord = 24,
  draggable = true,
  vSelectedAngles,
  vPhase,
}: tHarmonizerWheel) {
  const vWheelRotation = useSharedValue(22 / 7);
  const vSecondColor = useVerse<number | null>(null);
  const vPanState = useSharedValue<ePanEvent>("leave");
  const vSecondPanState = useSharedValue<ePanEvent>("leave");
  const chordLength = arcLength / chord;
  const fOnLeave = (angleOffset = 0) => {
    "worklet";
    let nearestSector = wDefaultAngleToChord(
      vWheelRotation.value + angleOffset,
      arcLength,
      chord,
      0,
    );
    let nearestSectorAngle = wDefaultChordToAngle(
      nearestSector,
      arcLength,
      chord,
      0,
    );
    vWheelRotation.value = withTiming(nearestSectorAngle);
  };
  useAnimatedReaction(
    () => vWheelRotation.value,
    (wheelRotation, prevWheelRotation) => {
      "worklet";
      const secondColor = vSecondColor.shared.value;
      if (secondColor !== null) {
        vSelectedAngles.shared.value = [wheelRotation, secondColor];
      } else {
        vSelectedAngles.shared.value = [wheelRotation];
      }
    },
  );
  useAnimatedReaction(
    () => vPanState.value,
    (panState, prevPanState) => {
      "worklet";
      if (panState === "tap") {
        if (vSecondColor.shared.value === null) {
          vSecondColor.dispatch(vWheelRotation.value);
          fOnLeave(chordLength);
          vPanState.value = "leave";
        } else {
          vSelectedAngles.dispatch([
            Math.round(vWheelRotation.value * 100) / 100,
            Math.round(vSecondColor.shared.value * 100) / 100,
          ]);
          vPhase?.dispatch("scheme");
        }
      }
    },
  );
  useAnimatedReaction(
    () => vSecondPanState.value,
    (panState, prevPanState) => {
      "worklet";
      if (panState === "tap") {
        vSecondColor.dispatch(null);
        fOnLeave(-chordLength);
        vSecondPanState.value = "leave";
      }
    },
  );
  const transitionAnim = useSharedValue(0);
  useEffect(() => {
    if (!vSecondColor.state) {
      transitionAnim.value = 1;
      transitionAnim.value = withTiming(0, { duration: 300 });
    } else {
      transitionAnim.value = 0;
      transitionAnim.value = withTiming(1, { duration: 300 });
    }
  }, [vSecondColor.state]);

  const transformModifier: tAttributeModifier = {
    modID: 2,
    deps: [vSecondColor.shared, vWheelRotation, transitionAnim],
    modifier: (input: tAttributeMap) => {
      "worklet";
      const offsetAngle = Math.abs(vWheelRotation.value) % chordLength;
      return {
        ...input,
        rotateZ:
          input.rotateZ - offsetAngle * transitionAnim.value + chordLength / 2,
        scaleX: 1.2,
        scaleY: 1.2,
        translateX: input.translateX,
        zIndex: eLayers.colorMixer + chord,
        shadowRadius: input.shadowRadius * 1.2,
        shadowX: input.shadowX * 1.2,
        shadowY: input.shadowY * 1.2,
      };
    },
  };
  const { vColorModel } = useUserContext();
  const secondColorModifier: tAttributeModifier = {
    modID: 1,
    deps: [vSecondColor.shared, vColorModel.shared],
    modifier: (input: tAttributeMap) => {
      "worklet";
      let c = (input.ring / ring) * 0.5 + 0.5;
      let l = (input.ring / ring) * 0.5 + 0.5;
      let [r, g, b] = fCLARColorToRGB(
        { c, l, ar: vSecondColor.shared.value },
        vColorModel.shared.value,
      );
      return {
        ...input,
        red: r,
        green: g,
        blue: b,
      };
    },
  };
  const dC = useDerivedValue(() => 1);
  const dL = useDerivedValue(() => 1);
  const dAR = useDerivedValue(() => vWheelRotation.value);
  return (
    <RadialContext
      value={{
        radii,
        origin,
        mainRotationR: rotationR,
        dAR,
        dC,
        dL,
      }}
    >
      <ColorWheel
        radii={radii}
        ring={ring}
        chord={chord}
        vRotationROffset={vWheelRotation}
        wheelCenter={rotationR}
        vSecondColor={vSecondColor}
        draggable={draggable}
      />
      <PetalButton
        id={vSecondColor.state ? `Add Second Color` : "Add First Color"}
        origin={origin}
        radii={[radii[1] * 1.1, radii[1] * 1.8]}
        rotationR={rotationR}
        arcLength={2 / 7}
        zIndex={eLayers.colorMixer - 1}
        vPanState={vPanState}
        fontSize={20}
      />
      {vSecondColor.state !== null && (
        <>
          <RadialContext
            value={{
              mColorModifier: secondColorModifier,
              mTransformModifier: transformModifier,
              totalArcLength: chordLength,
              mainRotationR: 22 / 7 - chordLength,
              totalRings: ring,
              totalChords: 1,
              origin,
              dAR: vSecondColor.shared,
            }}
          >
            <RadialGraphic />
            <PetalButton
              id="Remove First Color"
              origin={origin}
              radii={[radii[1] * 1, radii[1] * 1.65]}
              rotationR={rotationR - chordLength}
              arcLength={2 / 7}
              zIndex={eLayers.colorMixer - 1}
              vPanState={vSecondPanState}
              fontSize={20}
            />
          </RadialContext>
        </>
      )}
    </RadialContext>
  );
}
