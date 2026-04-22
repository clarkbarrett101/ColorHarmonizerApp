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
} from "react-native-reanimated";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import { useEffect, useRef, useState } from "react";
import { useAnimatedMatrix, tMatrix, AnimatedMatrix } from "./AnimatedMatrix";
import { runOnJS } from "react-native-worklets";
import { View } from "react-native";
import { useUserContext } from "./UserContext";

export type tPaintChip = {
  paint: tPaint;
  startPosition: { x: number; y: number };
  size?: [number, number];
  startRotation?: number;
  zIndex?: number;
  radialOffset?: number;
  shadow?: boolean;
  chipID?: [number, number];
  wMatrixModifier?: (matrix: Partial<tMatrix>) => Partial<tMatrix>;
  simultaneousHandlers?: any;
};

export const PaintChip = ({
  paint,
  startPosition,
  size = [120, 75],
  startRotation = 0,
  zIndex = 0,
  radialOffset = 0,
  shadow = true,
  wMatrixModifier,
  simultaneousHandlers,
  chipID = [0, 0],
}: tPaintChip) => {
  const { vPanX, vPanY, vVelocityX, vHeldChip, holdChip } = useUserContext();

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [grabbed, setGrabbed] = useState(false);
  const animatedMatrix = useAnimatedMatrix({
    vT: startPosition,
    vR: 22 / 7,
    vS: { x: 1, y: 1 },
    vRadialOffset: radialOffset,
    mass: 0.1,
    duration: 500,
  });

  const [sRotation, setSRotation] = useState(() => startRotation);

  const panGesture = usePanGesture({
    onActivate: (event) => {
      const matrixPosition = animatedMatrix.wGetPosition();
      runOnJS(setPosition)(matrixPosition);
      holdChip(chipID);
      runOnJS(setSRotation)(0);
      runOnJS(setGrabbed)(true);
    },
    onUpdate: (event) => {
      vPanX.value = event.absoluteX;
      vPanY.value = event.absoluteY;
      vVelocityX.value = event.velocityX;
    },
    onDeactivate: (event) => {
      holdChip();
      animatedMatrix.wMatrixSpring(
        {
          vT: position,
          vR: startRotation,
          vS: { x: 1, y: 1 },
          vRadialOffset: 0,
          duration: 500,
          mass: 0.1,
        },
        () => {
          "worklet";
          animatedMatrix.wMatrixInstant({
            vT: startPosition,
            vR: startRotation,
            vS: { x: 1, y: 1 },
            vRadialOffset: radialOffset,
          });
        },
      );
      runOnJS(setSRotation)(startRotation);
      runOnJS(setGrabbed)(false);
    },
    simultaneousWith: simultaneousHandlers,
  });
  const dMatrix = useDerivedValue(() => {
    const held =
      vHeldChip.value[0] === chipID[0] && vHeldChip.value[1] === chipID[1];
    if (held) {
      return {
        vT: {
          x: vPanX.value - size[0] / 2,
          y: vPanY.value - size[1] / 2,
        },
        vR: vVelocityX.value / 1000 + (startRotation > 0 ? 22 / 7 : 0),
        vS: { x: 1.3, y: 1.3 },
        vRadialOffset: 0,
        duration: 1,
      };
    } else {
      return {
        vT: startPosition,
        vR: startRotation,
        vS: { x: 1, y: 1 },
        vRadialOffset: radialOffset,
        duration: 500,
        mass: 0.1,
      };
    }
  }, [vPanX, vPanY, vVelocityX, vHeldChip.value]);
  /*
   */
  const animatedStyle = useAnimatedStyle(() => {
    animatedMatrix.wMatrixSpring(dMatrix.value);
    return { transform: [{ matrix: animatedMatrix.style.value }] };
  }, [animatedMatrix]);

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          zIndex: grabbed ? 1000 : zIndex,
        },
        animatedStyle,
      ]}
    >
      <GestureDetector gesture={panGesture}>
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
              <Stop offset="50%" stopColor={paint.hex} stopOpacity="0" />
              <Stop offset="100%" stopColor="#000" stopOpacity=".1" />
            </LinearGradient>
          </Defs>
          <G>
            <Path d="M0 4C8 0 24 0 32 4V16C24 20 8 20 0 16Z" fill={paint.hex} />
            <Path
              d="M0 4C8 0 24 0 32 4V16C24 20 8 20 0 16Z"
              fill="url(#grad)"
            />
            <Path
              d="M1 5C12 1 20 1 31 5V15C20 19 12 19 1 15Z"
              fill={paint.hex}
            />
          </G>
          <Text
            x="16"
            y="8"
            fontSize={`${paint.name.length > 13 ? 55 / paint.name.length : 4}px`}
            fontFamily="Outfit"
            fill={paint.clar.l > 0.5 ? "#000" : "#fff"}
            textAnchor="middle"
            alignmentBaseline="middle"
            transform={`rotate(${Math.abs(startRotation) > 11 / 7 ? 180 : 0}, 16, 10)`}
            fontWeight={500}
          >
            {paint.name}
            <TSpan
              x="16"
              dy="5"
              fontSize="3"
              fill={paint.clar.l > 0.5 ? "#000" : "#fff"}
              fontWeight={100}
            >
              {paint.brand}
            </TSpan>
          </Text>
        </Svg>
      </GestureDetector>
    </Animated.View>
  );
};
