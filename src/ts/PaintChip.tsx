import { opacity } from "react-native-reanimated/lib/typescript/Colors";
import Svg, { Path, G, Defs, LinearGradient, Stop } from "react-native-svg";
import { tCLARColor } from "./CLAcolor";
import Animated, {
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
import { use } from "react";
import { fMakePetalPath } from "./Sector";
import { useAnimatedMatrix } from "./AnimatedMatrix";
import { AnimatedSvg } from "./SectorGroup";

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
  rotationR?: number;
};

export const PaintChip = ({
  paint,
  startPosition,
  size = [120, 75],
  rotationR = 0,
}: tPaintChip) => {
  const animatedMatrix = useAnimatedMatrix({
    vT: { x: startPosition[0], y: startPosition[1] },
    vR: rotationR,
    vS: 1,
  });
  const animatedStyle = useAnimatedStyle(() => {
    return { transform: [{ matrix: animatedMatrix.style.value }] };
  }, [animatedMatrix.style]);

  const panGesture = usePanGesture({
    onBegin: (event) => {
      animatedMatrix.wS(1.25);
    },
    onUpdate: (event) => {
      animatedMatrix.wT({
        x: event.absoluteX - size[0] / 2,
        y: event.absoluteY - size[1] / 2,
      });
      animatedMatrix.wR(event.velocityX / 1000);
    },
    onFinalize: (event) => {
      animatedMatrix.wS(1);
      animatedMatrix.wR(rotationR);
    },
  });
  return (
    <Animated.View style={[{ position: "absolute" }, animatedStyle]}>
      <GestureDetector gesture={panGesture}>
        <AnimatedSvg
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
            <LinearGradient id="grad" x1="40%" y1="20%" x2="60%" y2="80%">
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
        </AnimatedSvg>
      </GestureDetector>
    </Animated.View>
  );
};

const tTransformMatrix = {
  scale: 1,
  rotate: 0,
  translate: [0, 0],
};
