import { G, Text } from "react-native-svg";
import React, { useEffect } from "react";
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
import { ColorWheel } from "../ColorWheels/ColorWheel";
import { tRadialObject } from "../Radials/SectorTypes";
import { useVerse, useVerseRelay } from "../utils/Verse";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { tAttributeMap, tAttributeModifier } from "../utils/Actor";
import { tPaint } from "../utils/CLAcolor";
import { useBucketContext } from "../Buckets/BucketContext";
import { PetalBox } from "../Buttons/PetalBox";
import { usePanHitBox } from "../Buttons/PanHitBox";
import { Paths } from "../utils/Paths";
import { cDimH, cDimW } from "../utils/ScreenDimensions";

export function HarmonizerWheel({
  radii = [210, 420],
  origin = [cDimW(), cDimH(0.5)],
  rotationR = 22 / 7,
  arcLength = 44 / 7,
  ring = 5,
  chord = 24,
  draggable = true,
}: tRadialObject & { draggable?: boolean }) {
  const chordLength = arcLength / chord;

  const { vAccentAR, vSelected, vPage, vAccentC, vAccentL } = useUserContext();
  useEffect(() => {
    vAccentC.dispatch(0.5);
    vAccentL.dispatch(0.9);
  }, []);
  const { registerBucket, unregisterBucket } = useBucketContext();
  const transitionAnim = useSharedValue(0);
  const vSelectedRelay = useVerseRelay(vSelected);
  const vSecondColor = useVerse<number | null>(
    vSelectedRelay?.state.length > 1 ? vSelectedRelay.state[1] : null,
  );

  const fOnLeave = (angleOffset = 0) => {
    "worklet";
    let nearestSector = wDefaultAngleToChord(
      vAccentAR.shared.value + angleOffset,
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
    vAccentAR.shared.value = withTiming(nearestSectorAngle);
  };

  useAnimatedReaction(
    () => vAccentAR.shared.value,
    (wheelRotation, prevWheelRotation) => {
      "worklet";
      const secondColor = vSecondColor.shared.value;
      if (secondColor !== null) {
        vSelected.shared.value = [wheelRotation, secondColor];
      } else {
        vSelected.shared.value = [wheelRotation];
      }
    },
  );

  function SelectColor(angle: number) {
    "worklet";
    if (vSecondColor.shared.value === null) {
      vSecondColor.dispatch(angle);
      fOnLeave(chordLength);
    } else {
      vSelected.dispatch([
        Math.round(angle * 100) / 100,
        Math.round(vSecondColor.shared.value * 100) / 100,
      ]);
      vPage.dispatch("Scheme Selector");
    }
  }

  useEffect(() => {
    registerBucket({
      id: 31,
      callback: (paint: tPaint) => {
        SelectColor(paint.clar.ar);
      },
      origin: [origin[0] - 100, origin[1]],
      radii: [200, 300],
      targetLayerRange: [eLayers.chipHand, eLayers.chipHand + 10],
      path: Paths.search,
    });
    return () => {
      unregisterBucket(31 + "");
    };
  }, []);

  usePanHitBox({
    id: "harmonizerWheelPan",
    origin,
    radii,
    rotationR: 21 / 7,
    arcLength: 4 / 7,
    fOnUpdate: (state, pos) => {
      "worklet";
      if (state.value === "tap" || state.value === "release") {
        if (pos.value.angle > 21 / 7) {
          SelectColor(vAccentAR.shared.value);
        } else {
          if (vSecondColor.shared.value !== null) {
            vSecondColor.dispatch(null);
            fOnLeave(-chordLength);
          }
        }
        state.value = "leave";
      }
    },
  });

  const dAR = useDerivedValue(() => {
    if (vSecondColor.shared.value !== null) {
      return vSecondColor.shared.value;
    } else {
      return vAccentAR.shared.value;
    }
  });

  useAnimatedReaction(
    () => vSecondColor.shared.value,
    (secondColor) => {
      if (secondColor !== null && transitionAnim.value < 0.5) {
        transitionAnim.value = withTiming(1, { duration: 200 });
      } else if (secondColor === null && transitionAnim.value > 0.5) {
        transitionAnim.value = withTiming(0, { duration: 200 });
      }
    },
    [],
  );

  function fLerp(a: number, b: number, t: number) {
    "worklet";
    return a + (b - a) * t;
  }

  const secondTransformModifier: tAttributeModifier = {
    modID: 2,
    deps: [transitionAnim],
    modifier: (input: tAttributeMap) => {
      "worklet";
      return {
        ...input,
        shadowOpacity: transitionAnim.value > 0.5 ? input.shadowOpacity : 0,
        rotateZ: rotationR - transitionAnim.value * chordLength,
        translateX: input.translateX + transitionAnim.value * -10,
      };
    },
  };

  const fontSize = radii[0] * 0.08;
  const fill = "rgba(0,0,0,0.75)";

  return (
    <>
      <RadialContext
        value={{
          radii: [0, radii[0]],
          origin,
          mainRotationR: rotationR,
        }}
      >
        <ColorWheel
          radii={[0, radii[0]]}
          ring={ring}
          chord={chord}
          wheelCenter={rotationR}
          vSecondColor={vSecondColor}
          draggable={draggable}
          offsetLevel={30}
          transitionAnim={transitionAnim}
        />
        <PetalBox
          origin={origin}
          radii={radii}
          rotationR={0}
          arcLength={3 / 7}
          layer={eLayers.colorMixer - 2}
        >
          <G
            transform={[
              { scale: -1 },
              { translateX: -fLerp(radii[0], radii[1], 0.7) },
            ]}
          >
            <Text
              fill={fill}
              fontSize={fontSize}
              fontFamily="Outfit"
              y={-1.5 * fontSize}
              alignmentBaseline="middle"
              textAnchor="middle"
            >
              {"Select " + (vSecondColor.state === null ? "First" : "Second")}
            </Text>
            <Text
              fill={fill}
              fontSize={fontSize}
              fontFamily="Outfit"
              alignmentBaseline="middle"
              textAnchor="middle"
            >
              Color To
            </Text>
            <Text
              fill={fill}
              fontSize={fontSize}
              fontFamily="Outfit"
              y={1.5 * fontSize}
              alignmentBaseline="middle"
              textAnchor="middle"
            >
              Harmonize
            </Text>
          </G>
        </PetalBox>
        <PetalBox
          origin={origin}
          radii={radii}
          rotationR={0}
          arcLength={3 / 7}
          layer={eLayers.colorMixer - 5}
          dAR={dAR}
          mTransformModifier={secondTransformModifier}
        >
          <G
            transform={[
              { scale: -1 },
              { translateX: -fLerp(radii[0], radii[1], 0.7) },
            ]}
          >
            <Text
              fill={fill}
              fontSize={fontSize}
              fontFamily="Outfit"
              y={-1.5 * fontSize}
              alignmentBaseline="middle"
              textAnchor="middle"
            >
              Remove
            </Text>
            <Text
              fill={fill}
              fontSize={fontSize}
              fontFamily="Outfit"
              alignmentBaseline="middle"
              textAnchor="middle"
            >
              First
            </Text>
            <Text
              fill={fill}
              fontSize={fontSize}
              fontFamily="Outfit"
              y={1.5 * fontSize}
              alignmentBaseline="middle"
              textAnchor="middle"
            >
              Color
            </Text>
          </G>
        </PetalBox>
      </RadialContext>
    </>
  );
}
