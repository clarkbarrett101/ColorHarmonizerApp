import Svg, {
  Path,
  G,
  Defs,
  LinearGradient,
  Stop,
  Text,
  TSpan,
  Circle,
  Rect,
} from "react-native-svg";
import { tPaint } from "../utils/CLAcolor";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import {
  GestureDetector,
  useLongPressGesture,
  usePanGesture,
  useSimultaneousGestures,
  useTapGesture,
} from "react-native-gesture-handler";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions } from "react-native";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { useVerse } from "../utils/Verse";
import {
  fLerpModifierFactory,
  tAttributeMap,
  tAttributeModifier,
  useActor,
} from "../utils/Actor";
import { useBucketContext } from "../Buckets/BucketContext";
import { tRadialObject } from "../Radials/SectorTypes";
import { AudioContext, OscillatorNode } from "react-native-audio-api";
import { tChordReturn, useSoundContext } from "../Contexts/SoundContext";
import { AnyGesture } from "react-native-gesture-handler/lib/typescript/v3/types";
import { translate } from "@shopify/react-native-skia";
import { scheduleOnRN } from "react-native-worklets";

export type tChipStatus =
  | ["idle", "ready" | "choosing" | "returning" | "flippingUp" | "flippingDown"]
  | ["grabbed", "pulled" | "pushed" | "inBucket"];

export const eChipSizes = {
  default: [150, 100],
  grabbed: [180, 120],
  outline: [210, 140],
};

export type tPaintChip = tRadialObject & {
  paintA: tPaint;
  paintB?: tPaint;
  size?: keyof typeof eChipSizes;
  radialOffset?: number;
  chipID: [number, number];
  relativeZ?: number;
  sideA?: boolean;
  rotationOffset?: number;
};

export const fLerp = (a: number, b: number, t: number): number => {
  "worklet";
  return a * (1 - t) + b * t;
};

export const PaintChip = ({
  paintA,
  paintB = paintA,
  origin = [0, 0],
  size = "default",
  rotationR = 0,
  relativeZ = 0,
  radialOffset = 0,
  chipID,
  sideA = true,
  rotationOffset = 0,
}: tPaintChip) => {
  /// O N  M O U N T ///

  let flag = "#0f0";
  const id = chipID[0] + chipID[1];
  const {
    holdChip,
    vHeldChipID,
    setHeldChipPaint,
    registerChipActor,
    unregisterChipActor,
    vPanX,
    vPanY,
    vVelocityX,
  } = useUserContext();
  const { vDropScreen } = useBucketContext();
  const { fStartChord, fPlaySFX } = useSoundContext();
  const rotateZ =
    Math.abs(rotationR) > 11 / 7
      ? -22 / 7 + rotationR + rotationOffset
      : rotationR + rotationOffset;
  const startPosition = {
    x: origin[0] + Math.cos(rotationR) * radialOffset,
    y: origin[1] + Math.sin(rotationR) * radialOffset,
  };
  const initialAttributes = useMemo(
    () => ({
      rotateZ: rotateZ,
      translateX: startPosition.x,
      translateY: startPosition.y,
      id,
      rotateX: 0,
      shadowRadius: 3,
      shadowX: -2,
      shadowY: 2,
    }),
    [startPosition.x, startPosition.y, rotateZ, id],
  );
  const actor = useActor(initialAttributes);
  const vPaintA = useVerse(false);
  const paint = vPaintA.state ? paintA : paintB;
  const vGrabbed = useVerse(false);
  const panWeight = useSharedValue(0);
  const flipAnim = useSharedValue(0);
  /// S T A T E  M A C H I N E ///
  flag = "#ff0";

  useEffect(() => {
    return vHeldChipID.subscribe?.((newID) => {
      const isGrabbed = newID === id;
      vGrabbed.dispatch(isGrabbed);
    });
  }, []);
  const chord = useRef<tChordReturn | null>(null);
  useEffect(() => {
    if (vGrabbed.state) {
      setHeldChipPaint?.(paint);
      chord.current?.(0);
      chord.current = fStartChord?.(paint.clar);
      fPlaySFX?.("grab");
    } else {
      chord.current?.(0);
      chord.current = null;
      fPlaySFX?.("drop");
    }
  }, [vGrabbed.state]);

  function flipDown(isSideA) {
    "worklet";
    flipAnim.value = isSideA ? 0.4 : 0.6;
    vPaintA.dispatch(isSideA);
    flipAnim.value = withTiming(isSideA ? 0 : 1, {
      duration: 200,
    });
  }
  function flipUp(isSideA) {
    "worklet";
    flipAnim.value = withDelay(
      isSideA ? 500 * relativeZ : (1 - relativeZ) * 500,
      withTiming(0.5, { duration: 200 }, (finished) => {
        if (finished) {
          scheduleOnRN(fPlaySFX, "grab");
          flipDown(isSideA);
        }
      }),
    );
  }
  useEffect(() => {
    if (flipAnim.value > 0 && flipAnim.value < 1) {
      flipDown(sideA);
    } else {
      flipUp(sideA);
    }
  }, [sideA]);

  const flipModifier: tAttributeModifier = {
    modID: 0,
    deps: [flipAnim, vGrabbed.shared],
    modifier: (input: tAttributeMap) => {
      "worklet";
      const rx = fLerp(0.5 / 7, 21.5 / 7, flipAnim.value);
      return {
        ...input,
        rotateX: rx,
        zIndex:
          flipAnim.value > 0.5 ? chipID[0] + chipID[1] : chipID[0] - chipID[1],
        held: vGrabbed.shared.value ? 1 : 0,
      };
    },
  };

  /// P A N  G E S T U R E///
  flag = "#f00";
  const dPanx = useDerivedValue(() => {
    return vPanX.shared.value;
  });
  const dPany = useDerivedValue(() => {
    return vPanY.shared.value;
  });
  const dRotation = useDerivedValue(() => {
    return vVelocityX.shared.value * 0.0005;
  });
  const dScale = useDerivedValue(() => {
    return 1.3;
  });
  const panMod = fLerpModifierFactory(
    1,
    {
      translateX: dPanx,
      translateY: dPany,
      rotateZ: dRotation,
      scaleX: dScale,
      scaleY: dScale,
    },
    panWeight,
    [vPanX.shared, vPanY.shared, vVelocityX.shared, panWeight],
  );

  const dimensions = Dimensions.get("window");
  const shadowModifier: tAttributeModifier = {
    modID: 2,
    deps: [panWeight, vPanX.shared, vPanY.shared],
    modifier: (input: tAttributeMap) => {
      "worklet";
      const x = -0.25 + input.translateX / dimensions.width;
      const y = -0.5 + input.translateY / dimensions.height;
      return {
        ...input,
        shadowX: fLerp(input.shadowX || 0, -x * 10, panWeight.value),
        shadowY: fLerp(input.shadowY || 0, y * 10, panWeight.value),
        shadowRadius: fLerp(input.shadowRadius || 3, 6, panWeight.value),
      };
    },
  };
  useEffect(() => {
    actor.addModifier(flipModifier);
    actor.addModifier(panMod);
    actor.addModifier(shadowModifier);
    registerChipActor(id, actor);
    return () => {
      actor.removeModifier(flipModifier.modID);
      actor.removeModifier(panMod.modID);
      actor.removeModifier(shadowModifier.modID);
      unregisterChipActor(id);
    };
  }, []);
  const panGesture = usePanGesture({
    minDistance: 0,
    onActivate: (event) => {
      panWeight.value = withTiming(1, { duration: 300 });
      vPanX.shared.value = event.absoluteX;
      vPanY.shared.value = event.absoluteY;
      holdChip(id);
      vDropScreen.shared.value = true;
    },
    onUpdate: (event) => {
      vPanX.shared.value = event.absoluteX;
      vPanY.shared.value = event.absoluteY;
      vVelocityX.shared.value = event.velocityX;
    },
    onDeactivate: (event) => {
      panWeight.value = withTiming(0, { duration: 300 });
      holdChip();
      vDropScreen.shared.value = false;
    },
  });
  const touchGesture = useLongPressGesture({
    minDuration: 100,
    onActivate: (event) => {
      panWeight.value = withTiming(1, { duration: 200 });
      vPanX.shared.value = event.absoluteX;
      vPanY.shared.value = event.absoluteY;
      holdChip(id);
      vDropScreen.shared.value = true;
    },
    onTouchesUp: (event) => {
      panWeight.value = withTiming(0, { duration: 200 });
      holdChip();
      vDropScreen.shared.value = false;
    },
  });
  const compGesture = useSimultaneousGestures(panGesture, touchGesture);

  /// T R A N S F O R M ///
  flag = "#f0f";
  const animatedStyle = useAnimatedStyle(() => {
    return actor.get((attributes) => {
      return {
        transform: [
          { perspective: 1000 },
          { translateY: attributes.translateY || 0 },
          { translateX: attributes.translateX || 0 },
          { translateX: -eChipSizes[size][0] / 2 },
          { translateY: -eChipSizes[size][1] / 2 },
          { scaleY: attributes.scaleY || 1 },
          { scaleX: attributes.scaleX || 1 },
          { rotateZ: `${attributes.rotateZ || 0}rad` },
          { rotateX: `${attributes.rotateX || 0}rad` },
        ],
      };
    });
  });
  const zStyle = useAnimatedStyle(() => {
    const style = actor.get((attributes) => {
      return {
        zIndex: vGrabbed.shared.value
          ? eLayers.grabbedChip
          : attributes.zIndex || 0,
        shadowOffset: {
          width: attributes.shadowX || 0,
          height: attributes.shadowY || 0,
        },
        shadowRadius: attributes.shadowRadius || 0,
      };
    });
    return style;
  });
  const highlightAngle =
    Math.atan2(startPosition.y, -startPosition.x) -
    (vGrabbed.state ? 22 / 7 : 44 / 7 - rotateZ);
  /// R E N D E R ///
  flag = "#00f";
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: 0,
          top: 0,
          width: eChipSizes[size][0],
          height: eChipSizes[size][1],
          shadowColor: "#000",
          shadowOpacity: 0.7,
        },
        zStyle,
      ]}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            width: eChipSizes[size][0],
            height: eChipSizes[size][1],
          },
          animatedStyle,
        ]}
      >
        <GestureDetector gesture={compGesture}>
          <Svg
            viewBox={`3 0 26 24`}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: eChipSizes[size][0],
              height: eChipSizes[size][1],
              transform: [{ scaleY: vPaintA.state ? 1 : -1 }],
            }}
          >
            <Defs>
              <LinearGradient
                id="grad"
                x1={`${Math.cos(highlightAngle) * 50 + 50}%`}
                y1={`${Math.sin(highlightAngle) * 50 + 50}%`}
                x2={`${Math.cos(highlightAngle + 22 / 7) * 50 + 50}%`}
                y2={`${Math.sin(highlightAngle + 22 / 7) * 50 + 50}%`}
              >
                <Stop offset="0%" stopColor="#fff" stopOpacity=".2" />
                <Stop
                  offset="50%"
                  stopColor={paint?.hex || "transparent"}
                  stopOpacity="0"
                />
                <Stop offset="100%" stopColor="#000" stopOpacity=".1" />
              </LinearGradient>
            </Defs>
            <G>
              <Path
                d="M 0 4 C 8 0 24 0 32 4 V 20 C 24 24 8 24 0 20 Z"
                fill={paint?.hex || "transparent"}
              />
              <Path
                d="M 0 4 C 8 0 24 0 32 4 V 20 C 24 24 8 24 0 20 Z"
                fill="url(#grad)"
              />
              <Path
                d="M 1 5 C 12 1 20 1 31 5 V 19 C 20 23 12 23 1 19 Z"
                fill={paint?.hex || "transparent"}
              />
            </G>
            <Text
              x="16"
              dy="9"
              fontSize={`${paint?.name.length > 13 ? 55 / paint.name.length : 3.5}px`}
              fontFamily="Outfit"
              fill={paint?.clar.l > 0.5 ? "#000" : "#fff"}
              textAnchor="middle"
              alignmentBaseline="middle"
              fontWeight={500}
            >
              {paint?.name}
              <TSpan
                x="16"
                dy="3.5"
                fontSize="3"
                fill={paint?.clar.l > 0.5 ? "#000" : "#fff"}
                fontWeight={200}
                textAnchor="middle"
              >
                {paint?.brand}
              </TSpan>
              <TSpan
                x="16"
                dy="3"
                fontSize="2.5"
                fill={paint?.clar.l > 0.5 ? "#000" : "#fff"}
                fontWeight={100}
                textAnchor="middle"
              >
                {"( " + paint?.label + " )"}
              </TSpan>
            </Text>
          </Svg>
        </GestureDetector>
      </Animated.View>
    </Animated.View>
  );
};
