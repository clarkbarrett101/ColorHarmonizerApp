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
import { use, useEffect, useReducer, useState } from "react";
import { runOnJS } from "react-native-worklets";
import { DeviceEventEmitter, View } from "react-native";
import { eLayers, useUserContext } from "./UserContext";
import { useVerse } from "./Verse";

export type tChipStatus = {
  [key: string]: {} | tChipStatus;
};
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
};

export const PaintChip = ({
  paintA,
  paintB = {
    hex: "#ffffff",
    clar: { c: 0, l: 0, ar: 0 },
    name: "",
    brand: "",
  } as tPaint,
  origin = { x: 0, y: 0 },
  size = "default",
  startRotation = 0,
  zIndex = 0,
  radialOffset = 0,
  chipID,
  sideA = true,
  groupLayer = 0,
  direction = 1,
}: tPaintChip) => {
  /// FLIP ///
  const {
    vPanX,
    vPanY,
    vVelocityX,
    holdChip,
    vPanMix,
    vPanOverride,
    registerChip,
    unregisterChip,
  } = useUserContext();
  const vChipStatus = useVerse<tChipStatus>({ idle: {} });
  const anim = useSharedValue(0);
  const [isPaintA, setIsPaintA] = useState(false);
  function fGetPaint() {
    if (isPaintA) {
      return paintA;
    } else {
      return paintB;
    }
  }
  useEffect(() => {
    registerChip(
      chipID,
      vChipStatus.asState,
      vChipStatus.fUpdateState,
      fGetPaint,
    );
    return () => unregisterChip(chipID);
  }, []);

  const vTilt = useSharedValue(0);
  useEffect(() => {
    if (vChipStatus.asState["flipping"]) {
      vTilt.value = sideA ? 21 / 7 : 1 / 7;
    }
    vChipStatus.fUpdateState({ flipping: {} });
    vTilt.value = withDelay(
      sideA ? 500 * chipID[1] : (1 - chipID[1]) * 500,
      withTiming(11 / 7, { duration: 200 }, () => {
        runOnJS(setIsPaintA)(sideA);
        vTilt.value = sideA ? 9 / 7 : 13 / 7;
        vTilt.value = withTiming(
          sideA ? 1 / 7 : 21 / 7,
          {
            duration: 200,
          },
          () => {
            vChipStatus.fUpdateState({ idle: {} });
          },
        );
      }),
    );
  }, [sideA]);
  const vR = useSharedValue(startRotation);
  const fLerp = (a: number, b: number, t: number): number => {
    "worklet";
    return a * (1 - t) + b * t;
  };

  ///Event Dispatch///

  ///PAN GESTURE///
  const panGesture = usePanGesture({
    onActivate: (event) => {
      holdChip(chipID, "pulled");
    },
    onUpdate: (event) => {
      vPanX.asShared.value = event.absoluteX;
      vPanY.asShared.value = event.absoluteY;
      vVelocityX.asShared.value = event.velocityX;
    },
    onDeactivate: (event) => {
      holdChip();
    },
  });

  ///Transform Style///

  useEffect(() => {
    console.log("Chip Status:", vChipStatus.asState);
    if (vChipStatus.asState["grabbed"]) {
      vR.value = 0;
      if (vChipStatus.asState.grabbed["inBucket"]) {
        anim.value = withTiming(1, { duration: 300 });
      } else {
        anim.value = withTiming(0, { duration: 300 });
      }
    } else if (vChipStatus.asState["returning"]) {
      anim.value = 1;
      anim.value = withTiming(0, { duration: 300 }, () => {
        vChipStatus.fUpdateState({ idle: {} });
      });
    } else {
      vR.value = startRotation;
      anim.value = withTiming(0, { duration: 300 });
    }
  }, [vChipStatus.asState]);

  const startPosition = {
    x: origin.x + Math.cos(-direction * startRotation) * radialOffset,
    y: origin.y + Math.sin(-direction * startRotation) * radialOffset,
  };

  const dPosition = useDerivedValue(() => {
    if (vChipStatus.asState["grabbed"]) {
      return {
        x:
          fLerp(vPanX.asShared.value, vPanOverride.value.x, anim.value) -
          eChipSizes[size][0] / 2,
        y:
          fLerp(vPanY.asShared.value, vPanOverride.value.y, anim.value) -
          eChipSizes[size][1] / 2,
      };
    } else {
      return {
        x: fLerp(startPosition.x, vPanX.asShared.value, anim.value),
        y: fLerp(startPosition.y, vPanY.asShared.value, anim.value),
      };
    }
  });
  const dTransform = useDerivedValue(() => {
    let rotation = vR.value * -direction - (vR.value > 11 / 7 ? 22 / 7 : 0);
    if (vChipStatus.asState["grabbed"]) {
      rotation += vVelocityX.asShared.value / 1000;
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

  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        borderWidth: 1,
        width: eChipSizes.grabbed[0],
        height: eChipSizes.grabbed[1],
        zIndex: vChipStatus.asState["grabbed"]
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
              width: vChipStatus.asState["grabbed"]
                ? eChipSizes.grabbed[0]
                : eChipSizes[size][0],
              height: vChipStatus.asState["grabbed"]
                ? eChipSizes.grabbed[1]
                : eChipSizes[size][1],
              shadowColor: "#000",
              shadowOffset: {
                width: vChipStatus.asState["grabbed"] ? -10 : -1,
                height: vChipStatus.asState["grabbed"] ? -10 : -1,
              },
              shadowOpacity: 0.5,
              shadowRadius: 5,
              transform: [{ scaleY: isPaintA ? 1 : -1 }],
            }}
          >
            <Defs>
              <LinearGradient
                id="grad"
                x1={`${Math.cos(-(vChipStatus.asState["grabbed"] ? 0 : startRotation) + 22 / 7) * 50 + 50}%`}
                y1={`${Math.sin(-(vChipStatus.asState["grabbed"] ? 0 : startRotation) + 22 / 7) * 50 + 50}%`}
                x2={`${Math.cos(-(vChipStatus.asState["grabbed"] ? 0 : startRotation)) * 50 + 50}%`}
                y2={`${Math.sin(-(vChipStatus.asState["grabbed"] ? 0 : startRotation)) * 50 + 50}%`}
              >
                <Stop offset="0%" stopColor="#fff" stopOpacity=".2" />
                <Stop
                  offset="50%"
                  stopColor={
                    (isPaintA ? paintA.hex : paintB.hex) || "transparent"
                  }
                  stopOpacity="0"
                />
                <Stop offset="100%" stopColor="#000" stopOpacity=".1" />
              </LinearGradient>
            </Defs>
            <G>
              <Path
                d="M0 4C8 0 24 0 32 4V16C24 20 8 20 0 16Z"
                fill={fGetPaint().hex || "transparent"}
              />
              <Path
                d="M0 4C8 0 24 0 32 4V16C24 20 8 20 0 16Z"
                fill="url(#grad)"
              />
              <Path
                d="M1 5C12 1 20 1 31 5V15C20 19 12 19 1 15Z"
                fill={fGetPaint().hex || "transparent"}
              />
            </G>
            <Text
              x="16"
              y="8"
              fontSize={`${fGetPaint().name.length > 13 ? 55 / fGetPaint().name.length : 4}px`}
              fontFamily="Outfit"
              fill={fGetPaint().clar.l > 0.5 ? "#000" : "#fff"}
              textAnchor="middle"
              alignmentBaseline="middle"
              fontWeight={500}
            >
              {fGetPaint().name}
              <TSpan
                x="16"
                dy="5"
                fontSize="3"
                fill={fGetPaint().clar.l > 0.5 ? "#000" : "#fff"}
                fontWeight={100}
              >
                {fGetPaint().brand}
              </TSpan>
            </Text>
          </Svg>
        </GestureDetector>
      </Animated.View>
    </View>
  );
};
