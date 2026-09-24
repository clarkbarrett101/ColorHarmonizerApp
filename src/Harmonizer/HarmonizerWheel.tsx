import Svg, { G, Text, Circle, Path } from "react-native-svg";
import { Dimensions } from "react-native";
import React, { useEffect, useState } from "react";
import Animated, {
  useAnimatedProps,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withDelay,
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
import { fCLARColorToString, tPaint } from "../utils/CLAcolor";
import { useBucketContext } from "../Buckets/BucketContext";
import { PetalBox } from "../Buttons/PetalBox";
import { usePanHitBox } from "../Buttons/PanHitBox";
import { CurvedText } from "../Buttons/CurvedText";
import { SweepDisplay } from "../Buttons/SweepDisplay";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function HarmonizerWheel({
  radii = [210, 420],
  origin = [
    Dimensions.get("window").width,
    Dimensions.get("window").height / 2,
  ],
  rotationR = 22 / 7,
  arcLength = 44 / 7,
  ring = 5,
  chord = 24,
  draggable = true,
}: tRadialObject & { draggable?: boolean }) {
  const chordLength = arcLength / chord;

  const { vAccentAR, vSelected, vPage, vColorModel, vAccentC, vAccentL } =
    useUserContext();
  useEffect(() => {
    vAccentC.dispatch(0.5);
    vAccentL.dispatch(0.9);
  }, []);
  const vPageRelay = useVerseRelay(vPage);
  console.log(vPageRelay.state, vPage.shared.value);
  const { registerBucket, unregisterBucket } = useBucketContext();
  const vIntroAnim = useVerse(0);
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
    vIntroAnim.shared.value = withDelay(500, withTiming(1, { duration: 500 }));
    setTimeout(() => {
      vIntroAnim.dispatch(1);
    }, 1000);

    registerBucket({
      id: 31,
      callback: (paint: tPaint) => {
        SelectColor(paint.clar.ar);
      },
      origin: [origin[0] - 100, origin[1]],
      radii: [200, 300],
      targetLayerRange: [eLayers.chipHand, eLayers.chipHand + 10],
      icon: "search",
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
      console.log("Color: ", secondColor, transitionAnim.value);
    },
    [],
  );

  function fLerp(a: number, b: number, t: number) {
    "worklet";
    return a + (b - a) * t;
  }

  const mTransitionModifier: tAttributeModifier = {
    modID: 1,
    deps: [vIntroAnim.shared],
    modifier: (input: tAttributeMap) => {
      "worklet";
      return {
        ...input,
        rotateZ: fLerp(0, rotationR, vIntroAnim.shared.value),
      };
    },
  };

  const secondTransformModifier: tAttributeModifier = {
    modID: 2,
    deps: [transitionAnim, vIntroAnim.shared],
    modifier: (input: tAttributeMap) => {
      "worklet";
      return {
        ...input,
        shadowOpacity: transitionAnim.value > 0.5 ? input.shadowOpacity : 0,
        rotateZ:
          fLerp(0, rotationR, vIntroAnim.shared.value) -
          transitionAnim.value * chordLength,
        translateX: input.translateX + transitionAnim.value * -10,
        alpha: vIntroAnim.shared.value > 0.5 ? input.alpha : 0,
      };
    },
  };
  const color = useDerivedValue(() =>
    fCLARColorToString(
      { ar: vAccentAR.shared.value, c: 0.4, l: 0.7 },
      vColorModel.state,
    ),
  );
  const animProps = useAnimatedProps(() => ({
    fill: color.value,
  }));
  const linkRaduius = 100;
  const linkOrigin = [
    Dimensions.get("window").width - linkRaduius * 0.75,
    linkRaduius * 1.75,
  ];
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
          mTransformModifier={mTransitionModifier}
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
        {vPageRelay.state == "Color Harmonizer" && (
          <>
            <Svg
              width={linkRaduius}
              height={linkRaduius}
              style={{
                position: "absolute",
                top: linkOrigin[1] - linkRaduius / 2,
                left: linkOrigin[0] - linkRaduius / 2,
                zIndex: eLayers.buckets - 5,
                shadowColor: "black",
                shadowOffset: { width: -2, height: 2 },
                shadowOpacity: 0.5,
                shadowRadius: 2,
              }}
              viewBox={`-${85} -${85} ${170} ${170}`}
              onTouchStart={() => vPageRelay.dispatch("Undertone Camera")}
            >
              <AnimatedCircle cx={0} cy={0} r={85} animatedProps={animProps} />
              <Path
                d="M40-25H28L18-35H-18L-28-25H-40C-47-25-50-22-50-15V20C-50 27-47 30-40 30H40C47 30 50 27 50 20V-15C50-22 47-25 40-25ZM45 20C45 23 43 25 40 25H-40C-43 25-45 23-45 20V-15C-45-18-43-20-40-20H-25L-15-30H15L25-20H40C43-20 45-18 45-15V20ZM0-22C-12-22-22-12-22 0S-12 22 0 22 22 12 22 0 12-22 0-22ZM0 16C-9 16-16 9-16 0S-9-16 0-16 16-9 16 0 9 16 0 16Z"
                fill={"white"}
              />
            </Svg>
            <CurvedText
              text="Undertone"
              radii={[0, linkRaduius / 2]}
              convex={true}
              rotationR={3 / 7}
              origin={linkOrigin as [number, number]}
              layer={eLayers.buckets - 5}
              color="white"
              fontSize={16}
              drawCurve={false}
            />
            <CurvedText
              text="C a m e r a"
              radii={[0, linkRaduius * 0.45]}
              convex={false}
              rotationR={-5 / 7}
              origin={linkOrigin as [number, number]}
              layer={eLayers.buckets - 5}
              color="white"
              fontSize={16}
              drawCurve={false}
            />
          </>
        )}
      </RadialContext>
    </>
  );
}
