import Svg, {
  Path,
  G,
  Defs,
  LinearGradient,
  Stop,
  Text,
  TSpan,
} from "react-native-svg";
import { tPaint } from "./CLAcolor";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import { useEffect } from "react";
import { Dimensions } from "react-native";
import { eLayers, useUserContext } from "./UserContext";
import { useVerse, useVerseRelay } from "./Verse";
import {
  fLerpModifierFactory,
  tAttributeMap,
  tAttributeModifier,
  useActor,
} from "./Actor";
import { useBucketContext } from "./BucketContext";
export const eChipMap = {
  idle: {
    ready: { idle: { ready: {} } },
    choosing: { idle: { choosing: {} } },
    returning: { idle: { returning: {} } },
    flippingUp: { idle: { flippingUp: {} } },
    flippingDown: { idle: { flippingDown: {} } },
  },
  grabbed: {
    pulled: { grabbed: { pulled: {} } },
    pushed: { grabbed: { pushed: {} } },
    inBucket: { grabbed: { inBucket: {} } },
  },
} as const;

export type tChipStatus =
  | ["idle", "ready" | "choosing" | "returning" | "flippingUp" | "flippingDown"]
  | ["grabbed", "pulled" | "pushed" | "inBucket"];

export const eChipSizes = {
  default: [150, 90],
  grabbed: [180, 108],
  outline: [210, 126],
};

export type tPaintChip = {
  paintA: tPaint;
  paintB?: tPaint;
  origin: { x: number; y: number };
  size?: keyof typeof eChipSizes;
  startRotation?: number;
  radialOffset?: number;
  chipID: [number, number];
  relativeZ?: number;
  sideA?: boolean;
  direction?: 1 | -1;
};

export const fLerp = (a: number, b: number, t: number): number => {
  "worklet";
  return a * (1 - t) + b * t;
};

export const PaintChip = ({
  paintA,
  paintB = paintA,
  origin = { x: 0, y: 0 },
  size = "default",
  startRotation = 0,
  relativeZ = 0,
  radialOffset = 0,
  chipID,
  sideA = true,
  direction = 1,
}: tPaintChip) => {
  /// O N  M O U N T ///

  let flag = "#0f0";
  const id = chipID[0] + chipID[1];
  const {
    holdChip,
    vHeldChipID,
    // vHeldChipRoot,
    setHeldChipPaint,
    registerChipActor,
    unregisterChipActor,
    vPanX,
    vPanY,
    vVelocityX,
  } = useUserContext();
  const { vDropScreen } = useBucketContext();
  const rotateZ =
    Math.abs(startRotation) > 11 / 7 ? -22 / 7 + startRotation : startRotation;
  const startPosition = {
    x: origin.x + Math.cos(-direction * startRotation) * radialOffset,
    y: origin.y + Math.sin(-direction * startRotation) * radialOffset,
  };
  const actor = useActor({
    rotateZ: rotateZ * -direction,
    translateX: startPosition.x,
    translateY: startPosition.y,
    id,
    rotateX: 0,
    shadowRadius: 3,
    shadowX: -2,
    shadowY: 2,
  });
  const vPaintA = useVerse(false);
  const paint = vPaintA.state ? paintA : paintB;
  const vHeldChipIDRelay = useVerseRelay(vHeldChipID);
  const panWeight = useSharedValue(0);
  const flipAnim = useSharedValue(0);

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
    deps: [flipAnim],
    modifier: (input: tAttributeMap) => {
      "worklet";
      const rx = fLerp(0.5 / 7, 21.5 / 7, flipAnim.value);
      return {
        ...input,
        rotateX: rx,
        zIndex:
          flipAnim.value > 0.5 ? chipID[0] + chipID[1] : chipID[0] - chipID[1],
      };
    },
  };

  const dPanx = useDerivedValue(() => {
    return vPanX.shared.value - eChipSizes[size][0] / 2;
  });
  const dPany = useDerivedValue(() => {
    return vPanY.shared.value - eChipSizes[size][1] / 2;
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

  /// P A N  G E S T U R E///
  flag = "#ff0";
  const panGesture = usePanGesture({
    onActivate: (event) => {
      console.log("Dispatch start:", performance.now());
      panWeight.value = withTiming(1, { duration: 300 });
      holdChip(id);
      vDropScreen.dispatch(true);
    },
    onUpdate: (event) => {
      vPanX.shared.value = event.absoluteX;
      vPanY.shared.value = event.absoluteY;
      vVelocityX.shared.value = event.velocityX;
    },
    onDeactivate: (event) => {
      panWeight.value = withTiming(0, { duration: 300 });
      holdChip();
      vDropScreen.dispatch(false);
    },
  });

  /// S T A T E  M A C H I N E ///
  flag = "#f00";

  useEffect(() => {
    if (vHeldChipIDRelay.state !== null && vHeldChipIDRelay.state === id) {
      setHeldChipPaint(paint);
    }
  }, [vHeldChipIDRelay.state]);
  /// T R A N S F O R M ///
  flag = "#f0f";
  const animatedStyle = useAnimatedStyle(() => {
    return actor.get((attributes) => {
      return {
        transform: [
          { perspective: 1000 },
          { translateX: attributes.translateX || 0 },
          { translateY: attributes.translateY || 0 },
          { rotateZ: `${attributes.rotateZ || 0}rad` },
          { scaleX: attributes.scaleX || 1 },
          { scaleY: attributes.scaleY || 1 },
          { rotateX: `${attributes.rotateX || 0}rad` },
        ],
      };
    });
  });
  const zStyle = useAnimatedStyle(() => {
    return actor.get((attributes) => {
      return {
        zIndex:
          panWeight.value > 0 ? eLayers.grabbedChip : attributes.zIndex || 0,
        shadowOffset: {
          width: attributes.shadowX || 0,
          height: attributes.shadowY || 0,
        },
        shadowRadius: attributes.shadowRadius || 0,
      };
    });
  });
  const grabbed = vHeldChipIDRelay.state === id;
  const highlightAngle =
    Math.atan2(startPosition.y, -startPosition.x) -
    (grabbed ? 22 / 7 : startRotation);
  /// R E N D E R ///
  flag = "#00f";
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: 0,
          top: 0,
          width: eChipSizes.grabbed[0],
          height: eChipSizes.grabbed[1],
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
            left: 0,
            top: 0,
            width: eChipSizes.grabbed[0],
            height: eChipSizes.grabbed[1],
          },
          animatedStyle,
          zStyle,
        ]}
      >
        <GestureDetector gesture={panGesture}>
          <Svg
            viewBox={`0 0 32 20`}
            style={{
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
                d="M0 4C8 0 24 0 32 4V16C24 20 8 20 0 16Z"
                fill={paint?.hex || "transparent"}
              />
              <Path
                d="M0 4C8 0 24 0 32 4V16C24 20 8 20 0 16Z"
                fill="url(#grad)"
              />
              <Path
                d="M1 5C12 1 20 1 31 5V15C20 19 12 19 1 15Z"
                fill={paint?.hex || "transparent"}
              />
            </G>
            <Text
              x="16"
              y="8"
              fontSize={`${paint?.name.length > 13 ? 55 / paint.name.length : 4}px`}
              fontFamily="Outfit"
              fill={paint?.clar.l > 0.5 ? "#000" : "#fff"}
              textAnchor="middle"
              alignmentBaseline="middle"
              fontWeight={500}
            >
              {paint?.name}
              <TSpan
                x="16"
                dy="5"
                fontSize="3"
                fill={paint?.clar.l > 0.5 ? "#000" : "#fff"}
                fontWeight={100}
              >
                {paint?.brand}
              </TSpan>
            </Text>
          </Svg>
        </GestureDetector>
      </Animated.View>
    </Animated.View>
  );
};
