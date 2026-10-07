import Svg, {
  Path,
  G,
  Defs,
  LinearGradient,
  Stop,
  Text,
  TSpan,
} from "react-native-svg";
import { tPaint } from "../utils/CLAcolor";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import {
  GestureDetector,
  useLongPressGesture,
  usePanGesture,
  useSimultaneousGestures,
} from "react-native-gesture-handler";
import { useEffect, useMemo, useRef } from "react";
import { Dimensions } from "react-native";
import { eLayers } from "../Contexts/UserContext";
import { useVerse } from "../utils/Verse";
import { tAttributeMap, tAttributeModifier, useActor } from "../utils/Actor";
import { useBucketContext } from "../Buckets/BucketContext";
import { tRadialObject } from "../Radials/SectorTypes";
import { tChordReturn, useSoundContext } from "../Contexts/SoundContext";
import { scheduleOnRN } from "react-native-worklets";
import { useChipContext } from "./ChipContext";
import { Paths } from "../utils/Paths";
import { cDimH, cRaxelH } from "../utils/ScreenDimensions";

export type tChipStatus =
  | ["idle", "ready" | "choosing" | "returning" | "flippingUp" | "flippingDown"]
  | ["grabbed", "pulled" | "pushed" | "inBucket"];
const cChipHeight = cRaxelH(0.1, 0.11);
export const eChipSizes = {
  default: [cChipHeight * 1.5, cChipHeight],
  grabbed: [cChipHeight * 1.5 * 1.2, cChipHeight * 1.2],
  outline: [cChipHeight * 1.5 * 1.4, cChipHeight * 1.4],
  small: [cChipHeight, cChipHeight * 0.7],
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
  labels?: boolean;
  draggable?: boolean;
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
  labels = true,
  draggable = true,
}: tPaintChip) => {
  /// O N  M O U N T ///

  const id = chipID[0] + chipID[1];
  const {
    holdChip,
    vHeldChipID,
    vHeldChipPaint,
    registerChipActor,
    unregisterChipActor,
    vPanX,
    vPanY,
    vVelocityX,
    vSwayTimer,
  } = useChipContext();
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
  const offset = Math.abs(rotationR) > 11 / 7 ? -radialOffset : radialOffset;
  const initialAttributes = useMemo(
    () => ({
      rotateZ: rotateZ,
      translateX: origin[0],
      translateY: origin[1],
      radialOffsetX: offset,
      zIndex: id,
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
  const dimensions = Dimensions.get("window");

  /// S T A T E  M A C H I N E ///

  useEffect(() => {
    return vHeldChipID.subscribe?.((newID) => {
      const isGrabbed = newID === id;
      if (isGrabbed) {
        console.log("PaintChip grabbed:", id, "chipID:", chipID);
      }
      vGrabbed.dispatch(isGrabbed);
    });
  }, []);
  const chord = useRef<tChordReturn | null>(null);
  useEffect(() => {
    if (vGrabbed.state) {
      panWeight.value = 1;
      vHeldChipPaint.dispatch(paint);
      chord.current?.(0.05);
      chord.current = fStartChord?.(paint.clar);
      fPlaySFX?.("grab");
    } else {
      panWeight.value = withTiming(0, { duration: 300 });
      chord.current?.(0.05);
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
          scheduleOnRN(fPlaySFX, "fan");
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

  /// P A N  G E S T U R E///

  const panGesture = usePanGesture({
    minDistance: 0,
    onActivate: (event) => {
      if (!draggable) return;

      vPanX.shared.value = event.absoluteX;
      vPanY.shared.value = event.absoluteY;
      holdChip(id);
      vDropScreen.shared.value = true;
    },
    onUpdate: (event) => {
      if (!draggable) return;
      vPanX.shared.value = event.absoluteX;
      vPanY.shared.value = event.absoluteY;
      vVelocityX.shared.value = event.velocityX;
    },
    onDeactivate: (event) => {
      if (!draggable) return;
      holdChip();
      vDropScreen.shared.value = false;
    },
  });

  const touchGesture = useLongPressGesture({
    minDuration: 100,
    onActivate: (event) => {
      if (!draggable) return;
      panWeight.value = withTiming(1, { duration: 200 });
      vPanX.shared.value = event.absoluteX;
      vPanY.shared.value = event.absoluteY;
      holdChip(id);
      vDropScreen.shared.value = true;
    },
    onTouchesUp: (event) => {
      if (!draggable) return;
      panWeight.value = withTiming(0, { duration: 200 });
      holdChip();
      vDropScreen.shared.value = false;
    },
  });
  const compGesture = useSimultaneousGestures(panGesture, touchGesture);

  /// M O D I F I E R S ///

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

  const panMod: tAttributeModifier = {
    modID: 1,
    deps: [vPanX.shared, vPanY.shared, vVelocityX.shared, panWeight],
    modifier: (input: tAttributeMap) => {
      "worklet";
      const x = fLerp(
        input.translateX || 0,
        vPanX.shared.value,
        panWeight.value,
      );
      const y = fLerp(
        input.translateY || 0,
        vPanY.shared.value,
        panWeight.value,
      );
      return {
        ...input,
        translateX: x,
        translateY: y,
        rotateZ: fLerp(
          input.rotateZ || 0,
          vVelocityX.shared.value * 0.0005,
          panWeight.value,
        ),
        scaleX: fLerp(input.scaleX || 1, 1.3, panWeight.value),
        scaleY: fLerp(input.scaleY || 1, 1.3, panWeight.value),
        zIndex: input.held > 0 ? eLayers.grabbedChip : input.zIndex || 0,
        radialOffsetX: fLerp(input.radialOffsetX || 0, 0, panWeight.value),
      };
    },
  };

  const shadowModifier: tAttributeModifier = {
    modID: 2,
    deps: [panWeight, vPanX.shared, vPanY.shared],
    modifier: (input: tAttributeMap) => {
      "worklet";
      const x = -0.25 + input.translateX / dimensions.width;
      const y = -0.5 + input.translateY / dimensions.height;
      return {
        ...input,
        shadowX: fLerp(input.shadowX || 0, x * 10, panWeight.value),
        shadowY: fLerp(input.shadowY || 0, y * 10, panWeight.value),
        shadowRadius: fLerp(input.shadowRadius || 3, 6, panWeight.value),
        shadowOpacity: fLerp(input.shadowOpacity || 0.5, 0.9, panWeight.value),
      };
    },
  };
  useEffect(() => {
    actor.addModifier(flipModifier);
    actor.addModifier(panMod);
    actor.addModifier(shadowModifier);
    registerChipActor(id, actor, [paintA, paintB]);
    return () => {
      actor.removeModifier(flipModifier.modID);
      actor.removeModifier(panMod.modID);
      actor.removeModifier(shadowModifier.modID);
      unregisterChipActor(id);
    };
  }, []);

  /// T R A N S F O R M ///

  const animatedStyle = useAnimatedStyle(() => {
    return actor.get((attributes) => {
      const output = {
        transform: [
          { perspective: 1000 },
          { translateY: attributes.translateY || 0 },
          { translateX: attributes.translateX || 0 },
          { translateX: -eChipSizes[size][0] / 2 },
          { translateY: -eChipSizes[size][1] / 2 },
          { scaleY: attributes.scaleY || 1 },
          { scaleX: attributes.scaleX || 1 },
          { rotateZ: `${attributes.rotateZ || 0}rad` },
          { translateX: attributes.radialOffsetX || 0 },
          { translateY: attributes.radialOffsetY || 0 },
          { rotateX: `${attributes.rotateX || 0}rad` },
        ],
      };
      return output;
    });
  });

  const zStyle = useAnimatedStyle(() => {
    const style = actor.get((attributes) => {
      return {
        opacity: attributes.alpha || 0,
        zIndex: attributes.zIndex || 0,
        shadowOffset: {
          width: attributes.shadowX || 0,
          height: attributes.shadowY || 0,
        },
        shadowRadius: attributes.shadowRadius || 0,
        shadowOpacity: attributes.shadowOpacity || 0,
      };
    });
    return style;
  });
  const highlightAngle =
    Math.atan2(startPosition.y, -startPosition.x) -
    (vGrabbed.state ? 22 / 7 : 44 / 7 - rotateZ);

  /// R E N D E R ///

  return (
    <Animated.View
      style={[
        {
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
            viewBox={`-16 -12 32 24`}
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
              <Path d={Paths.chipOutline} fill={paint?.hex || "transparent"} />
              <Path d={Paths.chipOutline} fill="url(#grad)" />
              <Path d={Paths.chip} fill={paint?.hex || "transparent"} />
            </G>
            <Text
              x="0"
              dy="-3"
              fontSize={`${paint?.name.length > 13 ? 55 / paint.name.length : 3.5}px`}
              fontFamily="Outfit"
              fill={paint?.clar.l > 0.5 ? "#000" : "#fff"}
              textAnchor="middle"
              alignmentBaseline="middle"
              fontWeight={500}
            >
              {paint?.name}
              {labels && (
                <>
                  <TSpan
                    x="0"
                    dy="3.5"
                    fontSize="3"
                    fill={paint?.clar.l > 0.5 ? "#000" : "#fff"}
                    fontWeight={200}
                    textAnchor="middle"
                  >
                    {paint?.brand}
                  </TSpan>
                  <TSpan
                    x="0"
                    dy="3"
                    fontSize="2.5"
                    fill={paint?.clar.l > 0.5 ? "#000" : "#fff"}
                    fontWeight={100}
                    textAnchor="middle"
                  >
                    {"( " + paint?.label + " )"}
                  </TSpan>
                </>
              )}
            </Text>
          </Svg>
        </GestureDetector>
      </Animated.View>
    </Animated.View>
  );
};
export function PaintChipPlaceholder({
  size,
  paintA,
  origin,
  chipID,
  text,
  rotationR,
  onPress,
}: tPaintChip & { text?: string; onPress?: () => void }) {
  /// R E N D E R ///
  const paint = paintA;
  return (
    <Svg
      viewBox={`-16 -12 32 24`}
      style={{
        position: "absolute",
        top: origin[1] - eChipSizes[size][1] / 2,
        left: origin[0] - eChipSizes[size][0] / 2,
        width: eChipSizes[size][0],
        height: eChipSizes[size][1],
        transform: [{ scaleY: 1 }, { rotate: `${rotationR}rad` }],
        zIndex: chipID[0] + chipID[1],
        shadowColor: "#000",
        shadowOpacity: 0.7,
        shadowRadius: 5,
        shadowOffset: { width: -2, height: 2 },
      }}
      onPress={onPress}
    >
      <Defs>
        <LinearGradient id="grad" x1={`50%`} y1={`0%`} x2={`50%`} y2={`100%`}>
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
          d="M-16-8C-8-12 8-12 16-8V8C8 12-8 12-16 8Z"
          fill={paint?.hex || "transparent"}
        />
        <Path d="M-16-8C-8-12 8-12 16-8V8C8 12-8 12-16 8Z" fill="url(#grad)" />
        <Path
          d="M-15-7C-4-11 4-11 15-7V7C4 11-4 11-15 7Z"
          fill={paint?.hex || "transparent"}
        />
      </G>
      <Text
        fontSize="5"
        fill={paint?.clar.l > 0.5 ? "#000" : "#fff"}
        fontWeight={500}
        textAnchor="middle"
        alignmentBaseline="middle"
      >
        {text}
      </Text>
    </Svg>
  );
}
