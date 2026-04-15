import { opacity } from "react-native-reanimated/lib/typescript/Colors";
import Svg, { Path, G, Defs, LinearGradient, Stop } from "react-native-svg";
import { tCLARColor } from "./CLAcolor";
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  usePanGesture,
} from "react-native-gesture-handler";
import { use, useEffect, useState } from "react";
import { fMakePetalPath } from "./Sector";
import { useAnimatedMatrix } from "./AnimatedMatrix";
import { AnimatedSvg } from "./SectorGroup";
import { transform } from "@babel/core";
import { runOnJS } from "react-native-worklets";
const AnimatedPath = Animated.createAnimatedComponent(Path);
export type tPaint = {
  name: string;
  brand: string;
  rgb: [number, number, number];
  ryb: [number, number, number];
  hsluv: [number, number, number];
  clarColor: tCLARColor;
  hex: string;
  yuv: [number, number, number];
  label: string;
};

export type tPaintChip = {
  paint: tPaint;
  startPosition: [number, number];
  grabbed: boolean;
  size?: [number, number];
  startRotation?: number;
};

export const PaintChip = ({
  paint,
  startPosition,
  size = [120, 75],
  startRotation = 0,
}: tPaintChip) => {
  const animatedMatrix = useAnimatedMatrix({
    vT: { x: startPosition[0], y: startPosition[1] },
    vR: 0,
    vS: 1,
  });
  const animatedStyle = useAnimatedStyle(() => {
    return { transform: [{ matrix: animatedMatrix.style.value }] };
  }, [animatedMatrix.style, startPosition, startRotation]);
  useEffect(() => {
    setSRotation(startRotation);
    animatedMatrix.wMatrix({
      vT: { x: startPosition[0], y: startPosition[1] },
      vR: startRotation,
      vS: 1,
    });
  }, [startRotation]);
  const [sRotation, setSRotation] = useState(() => startRotation);
  const panGesture = usePanGesture({
    onBegin: (event) => {
      animatedMatrix.wMatrix({
        vT: {
          x: event.absoluteX - size[0] / 2,
          y: event.absoluteY - size[1] / 2,
        },
        vR: 0,
        vS: 1,
      });
      runOnJS(setSRotation)(0);
    },
    onUpdate: (event) => {
      animatedMatrix.wT({
        x: event.absoluteX - size[0] / 2,
        y: event.absoluteY - size[1] / 2,
      });
      animatedMatrix.wR(event.velocityX / 1000);
    },
    onFinalize: (event) => {
      animatedMatrix.wMatrix({
        vT: { x: startPosition[0], y: startPosition[1] },
        vR: startRotation,
        vS: 1,
      });
      runOnJS(setSRotation)(startRotation);
    },
  });

  return (
    <Animated.View style={[{ position: "absolute" }, animatedStyle]}>
      <GestureDetector gesture={panGesture}>
        <Svg
          viewBox={`0 0 32 20`}
          style={{
            width: size[0],
            height: size[1],
            shadowColor: "#000",
            shadowOffset: { width: 10, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 10,
          }}
        >
          <Defs>
            <LinearGradient
              id="grad"
              x1={`${Math.cos(sRotation) * 50 + 50}%`}
              y1={`${Math.sin(sRotation) * 50 + 50}%`}
              x2={`${Math.cos(sRotation + Math.PI) * 50 + 50}%`}
              y2={`${Math.sin(sRotation + Math.PI) * 50 + 50}%`}
            >
              <Stop offset="0%" stopColor="#fff" stopOpacity=".4" />
              <Stop offset="50%" stopColor={paint.hex} stopOpacity="0" />
              <Stop offset="100%" stopColor="#000" stopOpacity=".2" />
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
        </Svg>
      </GestureDetector>
    </Animated.View>
  );
};

const tTransformMatrix = {
  scale: 1,
  rotate: 0,
  translate: [0, 0],
};
