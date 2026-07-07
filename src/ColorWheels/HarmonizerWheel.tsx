import { View, Text, Dimensions } from "react-native";
import React, { use, useEffect } from "react";
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
import { BGGradient } from "./BGGradient";
import { ColorWheel } from "./ColorWheel";
import { tRadialObject } from "../Radials/SectorTypes";
import { tVerse, useVerse } from "../utils/Verse";
import { RadialGraphic } from "../Radials/RadialGraphic";
import { PetalButton } from "../Chips/PetalButton";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { ePanEvent } from "../Contexts/PanManager";
import { tAttributeMap, tAttributeModifier } from "../utils/Actor";
import { fCLARColorToRGB, tCLARColor } from "../utils/CLAcolor";
export type tHarmonizerWheel = tRadialObject & {
  draggable?: boolean;
  vSelectedColors?: tVerse<tCLARColor[]>;
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
  vSelectedColors,
}: tHarmonizerWheel) {
  useEffect(() => {
    if (vSelectedColors.state.length > 2) {
      vSelectedColors.dispatch(vSelectedColors.state.slice(0, 2));
    }
  }, [vSelectedColors.state]);
  const vWheelRotation = useSharedValue(22 / 7);
  const dC = useDerivedValue(() => 1);
  const dL = useDerivedValue(() => 1);
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
    () => vPanState.value,
    (panState, prevPanState) => {
      "worklet";
      if (panState === "tap") {
        if (vSecondColor.shared.value === null) {
          vSecondColor.dispatch(vWheelRotation.value);
          fOnLeave(chordLength);
          vPanState.value = "leave";
        } else {
          vSelectedColors.dispatch([
            { c: 1, l: 1, ar: vWheelRotation.value },
            { c: 1, l: 1, ar: vSecondColor.shared.value },
          ]);
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

  const secondColorModifier: tAttributeModifier = {
    modID: 1,
    deps: [vSecondColor.shared],
    modifier: (input: tAttributeMap) => {
      "worklet";
      let c = ((input.ring / ring) * 0.5 + 0.5) * dC.value;
      let l = ((input.ring / ring) * 0.5 + 0.5) * dL.value;
      let [r, g, b] = fCLARColorToRGB({ c, l, ar: vSecondColor.shared.value });
      return {
        ...input,
        red: r,
        green: g,
        blue: b,
      };
    },
  };
  return (
    <RadialContext
      value={{
        radii,
        origin,
        dC,
        dL,
        dAR: vWheelRotation,
        mainRotationR: rotationR,
      }}
    >
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
        }}
      >
        <BGGradient />
      </View>
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
