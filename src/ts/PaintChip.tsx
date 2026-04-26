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
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import { use, useEffect, useRef, useState } from "react";
import { useAnimatedMatrix, AnimatedMatrix } from "./AnimatedMatrix";
import { runOnJS } from "react-native-worklets";
import { View } from "react-native";
import { useUserContext } from "./UserContext";
import { useVerse, tMatrix, useVerseTransform } from "./Verse";

export type tPaintChip = {
  paintA: tPaint;
  paintB?: tPaint;
  startPosition: { x: number; y: number };
  size?: [number, number];
  startRotation?: number;
  zIndex?: number;
  radialOffset?: number;
  shadow?: boolean;
  chipID: [number, number];
  wMatrixModifier?: (matrix: Partial<tMatrix>) => Partial<tMatrix>;
  simultaneousHandlers?: any;
  collapsed?: boolean;
  sideA?: boolean;
};

export const PaintChip = ({
  paintA,
  paintB = {
    hex: "#ffffff",
    clar: { c: 0, l: 0, ar: 0 },
    name: "",
    brand: "",
  } as tPaint,
  startPosition,
  size = [120, 75],
  startRotation = 0,
  zIndex = 0,
  radialOffset = 0,
  shadow = true,
  wMatrixModifier,
  simultaneousHandlers,
  chipID,
  collapsed = false,
  sideA = true,
}: tPaintChip) => {
  const [isPaintA, setIsPaintA] = useState(false);
  useEffect(() => {
    vTilt.value = withDelay(
      sideA ? 500 * chipID[1] : (1 - chipID[1]) * 500,
      withTiming(11 / 7, { duration: 200 }, () => {
        runOnJS(setIsPaintA)(sideA);
        vTilt.value = sideA ? 9 / 7 : 13 / 7;
        vTilt.value = withTiming(
          sideA ? chipID[1] / 10 : 22 / 7 - chipID[1] / 10,
          {
            duration: 200,
          },
        );
      }),
    );
  }, [sideA]);
  const { vPanX, vPanY, vVelocityX, vHeldChip, holdChip } = useUserContext();
  const vR = useSharedValue(startRotation);
  const vTilt = useSharedValue(0);
  const [grabbed, setGrabbed] = useState(false);
  const [sRotation, setSRotation] = useState(startRotation);
  const panGesture = usePanGesture({
    simultaneousWith: simultaneousHandlers,
    onActivate: (event) => {
      holdChip(chipID);
      runOnJS(setGrabbed)(true);
      runOnJS(setSRotation)(22 / 7);
    },
    onUpdate: (event) => {
      vPanX.value = event.absoluteX;
      vPanY.value = event.absoluteY;
      vVelocityX.value = event.velocityX;
    },
    onDeactivate: (event) => {
      console.log("deactivate");
      holdChip();
      runOnJS(setGrabbed)(false);
      runOnJS(setSRotation)(startRotation);
    },
  });
  useEffect(() => {
    if (collapsed) {
    } else {
      vTilt.value = withDelay(
        500 * chipID[1],
        withTiming(0, { duration: 500 }),
      );
    }
  }, [collapsed]);

  const isHeld = useDerivedValue(() => {
    return vHeldChip.value[0] === chipID[0] && vHeldChip.value[1] === chipID[1];
  });

  const dTransform = useDerivedValue<{ transform: any[] }>(() => {
    if (isHeld.value) {
      const transform = {
        transform: [
          { translateX: vPanX.value - size[0] / 2 - startPosition.x },
          { translateY: vPanY.value - size[1] / 2 - startPosition.y },
          { rotateZ: `${vVelocityX.value / 1000 + 22 / 7}rad` },
          { scaleX: 1.3 },
          { scaleY: 1.3 },
        ],
      };
      return transform;
    }

    return {
      transform: [
        { perspective: 1000 },
        { rotateZ: `${vR.value ?? 0}rad` },
        { rotateX: `${vTilt.value}rad` },
        { translateX: radialOffset },
      ],
    };
  });

  const animatedStyle = useAnimatedStyle(() => {
    return dTransform.value;
  });
  const rID = useRef(Math.random()).current;
  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        zIndex: grabbed ? 1000 : isPaintA ? zIndex : 100 - zIndex,
      }}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            top: startPosition.y,
            left: startPosition.x,
          },
          animatedStyle,
        ]}
      >
        <GestureDetector gesture={panGesture} key={rID}>
          <Svg
            viewBox={`0 0 32 20`}
            style={{
              width: size[0],
              height: size[1],
              shadowColor: "#000",
              shadowOffset: {
                width: grabbed ? -10 : -1,
                height: grabbed ? -10 : -1,
              },
              shadowOpacity: 0.5,
              shadowRadius: shadow ? 5 : 1,
              transform: [{ scaleY: isPaintA ? 1 : -1 }],
            }}
          >
            <Defs>
              <LinearGradient
                id="grad"
                x1={`${Math.cos(sRotation + 11 / 7) * 50 + 50}%`}
                y1={`${Math.sin(sRotation + 11 / 7) * 50 + 50}%`}
                x2={`${Math.cos(sRotation - 11 / 7) * 50 + 50}%`}
                y2={`${Math.sin(sRotation - 11 / 7) * 50 + 50}%`}
              >
                <Stop offset="0%" stopColor="#fff" stopOpacity=".2" />
                <Stop
                  offset="50%"
                  stopColor={isPaintA ? paintA.hex : paintB.hex}
                  stopOpacity="0"
                />
                <Stop offset="100%" stopColor="#000" stopOpacity=".1" />
              </LinearGradient>
            </Defs>

            <G>
              <Path
                d="M0 4C8 0 24 0 32 4V16C24 20 8 20 0 16Z"
                fill={isPaintA ? paintA.hex : paintB.hex}
              />
              <Path
                d="M0 4C8 0 24 0 32 4V16C24 20 8 20 0 16Z"
                fill="url(#grad)"
              />
              <Path
                d="M1 5C12 1 20 1 31 5V15C20 19 12 19 1 15Z"
                fill={isPaintA ? paintA.hex : paintB.hex}
              />
            </G>
            <Text
              x="16"
              y="8"
              fontSize={`${(isPaintA ? paintA.name : paintB.name).length > 13 ? 55 / (isPaintA ? paintA.name : paintB.name).length : 4}px`}
              fontFamily="Outfit"
              fill={
                (isPaintA ? paintA.clar.l : paintB.clar.l) > 0.5
                  ? "#000"
                  : "#fff"
              }
              textAnchor="middle"
              alignmentBaseline="middle"
              transform={`rotate(${Math.abs(sRotation) > 11 / 7 ? 180 : 0}, 16, 10)`}
              fontWeight={500}
            >
              {isPaintA ? paintA.name : paintB.name}
              <TSpan
                x="16"
                dy="5"
                fontSize="3"
                fill={
                  (isPaintA ? paintA.clar.l : paintB.clar.l) > 0.5
                    ? "#000"
                    : "#fff"
                }
                fontWeight={100}
              >
                {isPaintA ? paintA.brand : paintB.brand}
              </TSpan>
            </Text>
          </Svg>
        </GestureDetector>
      </Animated.View>
    </View>
  );
};
