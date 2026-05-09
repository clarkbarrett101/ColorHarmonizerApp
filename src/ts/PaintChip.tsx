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
  DerivedValue,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { runOnJS } from "react-native-worklets";
import { View } from "react-native";
import { eLayers, useUserContext } from "./UserContext";
import { useVerse, useVerseRelay } from "./Verse";
const clarColorsList: tPaint[] = require("./clarColors.json");
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
  zIndex?: number;
  radialOffset?: number;
  chipID: [number, number];
  sideA?: boolean;
  groupLayer?: number;
  direction?: 1 | -1;
  nudge?: SharedValue<{ angle: number; distance: number }>;
};

export const PaintChip = ({
  paintA,
  paintB = paintA,
  origin = { x: 0, y: 0 },
  size = "default",
  startRotation = 0,
  zIndex = 0,
  radialOffset = 0,
  chipID,
  sideA = true,
  groupLayer = 0,
  direction = 1,
  nudge,
}: tPaintChip) => {
  /// O N  M O U N T ///

  let flag = "#0f0";
  const {
    vPanX,
    vPanY,
    vVelocityX,
    holdChip,
    vPanOverride,
    heldChipID,
    vHeldChipRoot,
    setHeldChipPaint,
  } = useUserContext();

  const [isPaintA, setIsPaintA] = useState(false);
  const paint = isPaintA ? paintA : paintB;

  const vLocalChipStatus = useVerse<tChipStatus>(["idle", "ready"]);
  const vHeldChipStatus = useVerseRelay(vHeldChipRoot);
  const anim = useSharedValue(0);
  const vTilt = useSharedValue(0);

  const vR = useSharedValue(startRotation);
  useEffect(() => {
    vR.value = withTiming(startRotation);
  }, [startRotation]);

  useEffect(() => {
    if (vLocalChipStatus.state[1] === "flippingUp") {
      vLocalChipStatus.dispatch(["idle", "flippingDown"]);
    } else {
      vLocalChipStatus.dispatch(["idle", "flippingUp"]);
    }
  }, [sideA]);

  useEffect(() => {
    if (
      heldChipID !== null &&
      heldChipID[0] === chipID[0] &&
      heldChipID[1] === chipID[1]
    ) {
      vLocalChipStatus.dispatch(vHeldChipStatus.state);
    } else if (vLocalChipStatus.state[0] === "grabbed") {
      vLocalChipStatus.dispatch(["idle", "returning"]);
    }
  }, [vHeldChipStatus.state]);

  useEffect(() => {
    if (
      heldChipID !== null &&
      heldChipID[0] === chipID[0] &&
      heldChipID[1] === chipID[1]
    ) {
      setHeldChipPaint(paint);
    }
  }, [heldChipID]);

  /// P A N  G E S T U R E///
  flag = "#ff0";
  const panGesture = usePanGesture({
    onActivate: (event) => {
      holdChip(chipID, ["grabbed", "pulled"]);
    },
    onUpdate: (event) => {
      vPanX.shared.value = event.absoluteX;
      vPanY.shared.value = event.absoluteY;
      vVelocityX.shared.value = event.velocityX;
    },
    onDeactivate: (event) => {
      holdChip();
    },
  });

  /// S T A T E  M A C H I N E ///

  flag = "#f00";
  useEffect(() => {
    if (vLocalChipStatus.state[0] === "grabbed") {
      vR.value = 0;
      if (vLocalChipStatus.state[1] === "inBucket") {
        anim.value = withTiming(1, { duration: 300 });
      } else {
        anim.value = withTiming(0, { duration: 300 });
      }
    } else if (
      vLocalChipStatus.state[0] === "idle" &&
      vLocalChipStatus.state[1] === "returning"
    ) {
      anim.value = 1;
      anim.value = withTiming(0, { duration: 300 }, (finished) => {
        finished && vLocalChipStatus.dispatch(["idle", "ready"]);
      });
    } else {
      vR.value = startRotation;
      anim.value = withTiming(0, { duration: 300 });
    }
    if (vLocalChipStatus.state[1] === "flippingUp") {
      vTilt.value = withDelay(
        sideA ? 500 * chipID[1] : (1 - chipID[1]) * 500,
        withTiming(11 / 7, { duration: 200 }, (finished) => {
          if (finished) {
            vLocalChipStatus.dispatch(["idle", "flippingDown"]);
          }
        }),
      );
    } else if (vLocalChipStatus.state[1] === "flippingDown") {
      runOnJS(setIsPaintA)(sideA);
      vTilt.value = sideA ? 9 / 7 : 13 / 7;
      vTilt.value = withTiming(
        sideA ? 1 / 7 : 21 / 7,
        {
          duration: 200,
        },
        (finished) => {
          finished && vLocalChipStatus.dispatch(["idle", "ready"]);
        },
      );
    }
  }, [vLocalChipStatus.state]);

  /// T R A N S F O R M ///
  flag = "#f0f";

  const fLerp = (a: number, b: number, t: number): number => {
    "worklet";
    return a * (1 - t) + b * t;
  };

  const startPosition = {
    x: origin.x + Math.cos(-direction * startRotation) * radialOffset,
    y: origin.y + Math.sin(-direction * startRotation) * radialOffset,
  };

  const dPosition = useDerivedValue(() => {
    if (vLocalChipStatus.shared.value[0] === "grabbed") {
      return {
        x:
          fLerp(vPanX.shared.value, vPanOverride.value.x, anim.value) -
          eChipSizes[size][0] / 2,
        y:
          fLerp(vPanY.shared.value, vPanOverride.value.y, anim.value) -
          eChipSizes[size][1] / 2,
      };
    } else {
      return {
        x: fLerp(startPosition.x, vPanX.shared.value, anim.value),
        y: fLerp(startPosition.y, vPanY.shared.value, anim.value),
      };
    }
  });

  const dTransform = useDerivedValue(() => {
    let rotation = vR.value * -direction - (vR.value > 11 / 7 ? 22 / 7 : 0);
    if (vLocalChipStatus.shared.value[0] === "grabbed") {
      rotation += vVelocityX.shared.value / 1000;
    }
    return {
      transform: [
        { perspective: 1000 },
        {
          translateX: dPosition.value.x,
        },
        {
          translateY: dPosition.value.y,
        },
        {
          rotateZ: `${rotation}rad`,
        },
        { rotateX: `${vTilt.value}rad` },
      ],
    };
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      ...dTransform.value,
    } as any;
  });

  /// R E N D E R ///
  flag = "#00f";
  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: eChipSizes.grabbed[0],
        height: eChipSizes.grabbed[1],
        zIndex:
          vLocalChipStatus.state[0] === "grabbed"
            ? eLayers.grabbedChip
            : isPaintA
              ? zIndex + groupLayer
              : groupLayer - zIndex,
      }}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
          },
          animatedStyle,
        ]}
      >
        <GestureDetector gesture={panGesture}>
          <Svg
            viewBox={`0 0 32 20`}
            style={{
              width:
                vLocalChipStatus.state[0] === "grabbed"
                  ? eChipSizes.grabbed[0]
                  : eChipSizes[size][0],
              height:
                vLocalChipStatus.state[0] === "grabbed"
                  ? eChipSizes.grabbed[1]
                  : eChipSizes[size][1],
              shadowColor: "#000",
              shadowOffset: {
                width: vLocalChipStatus.state[0] === "grabbed" ? -10 : 2,
                height: vLocalChipStatus.state[0] === "grabbed" ? -10 : 2,
              },
              shadowOpacity: 0.7,
              shadowRadius: 5,
              transform: [{ scaleY: isPaintA ? 1 : -1 }],
            }}
          >
            <Defs>
              <LinearGradient
                id="grad"
                x1={`${Math.cos(-(vLocalChipStatus.state[0] === "grabbed" ? 0 : startRotation) + 22 / 7) * 50 + 50}%`}
                y1={`${Math.sin(-(vLocalChipStatus.state[0] === "grabbed" ? 0 : startRotation) + 22 / 7) * 50 + 50}%`}
                x2={`${Math.cos(-(vLocalChipStatus.state[0] === "grabbed" ? 0 : startRotation)) * 50 + 50}%`}
                y2={`${Math.sin(-(vLocalChipStatus.state[0] === "grabbed" ? 0 : startRotation)) * 50 + 50}%`}
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
    </View>
  );
};
