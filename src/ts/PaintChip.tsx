import Svg, {
  Path,
  G,
  Defs,
  LinearGradient,
  Stop,
  Text,
  TSpan,
} from "react-native-svg";
import { fCLARColorToString, tCLARColor } from "./CLAcolor";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import { useEffect, useState } from "react";
import { useAnimatedMatrix } from "./AnimatedMatrix";
import { runOnJS } from "react-native-worklets";
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

export const fRandomPaints = (count: number) => {
  const paints = [];
  for (let i = 0; i < count; i++) {
    const color = {
      c: Math.random(),
      l: Math.random(),
      ar: (Math.random() * 44) / 7,
    };
    const randomPaint: tPaint = {
      name: "Random Paint",
      brand: "Random Brand",
      rgb: [0, 0, 0],
      ryb: [0, 0, 0],
      hsluv: [0, 0, 0],
      clarColor: color,
      hex: fCLARColorToString(color),
      yuv: [0, 0, 0],
      label: "Random Paint",
    };
    paints.push(randomPaint);
  }
  return paints;
};

export type tPaintChip = {
  paint: tPaint;
  startPosition: [number, number];
  size?: [number, number];
  startRotation?: number;
  zIndex?: number;
  radialOffset?: number;
  origin?: [number, number];
};

export const PaintChip = ({
  paint,
  startPosition,
  size = [120, 75],
  startRotation = 0,
  zIndex = 0,
  radialOffset = 0,
  origin = [0, 0],
}: tPaintChip) => {
  const [position, setPosition] = useState({
    x: startPosition[0],
    y: startPosition[1],
  });
  const [grabbed, setGrabbed] = useState(false);
  const animatedMatrix = useAnimatedMatrix({
    vT: { x: origin[0], y: origin[1] },
    vR: 0,
    vS: { x: 1, y: 1 },
  });
  const animatedStyle = useAnimatedStyle(() => {
    return { transform: [{ matrix: animatedMatrix.style.value }] };
  }, [animatedMatrix.style, startPosition, startRotation]);
  useEffect(() => {
    animatedMatrix.wOrbit({
      center: { x: origin[0], y: origin[1] },
      radius: radialOffset,
      startAngle: 0,
      endAngle: startRotation,
    });
  }, [startRotation]);
  const [sRotation, setSRotation] = useState(() => startRotation);
  const panGesture = usePanGesture({
    onBegin: (event) => {
      runOnJS(setPosition)(animatedMatrix.vT.value);
      animatedMatrix.wMatrix({
        vT: {
          x: event.absoluteX - size[0] / 2,
          y: event.absoluteY - size[1] / 2,
        },
        vR: startRotation > 0 ? 22 / 7 : -22 / 7,
        vS: { x: 1.3, y: 1.3 },
      });
      runOnJS(setSRotation)(0);
      runOnJS(setGrabbed)(true);
    },
    onUpdate: (event) => {
      animatedMatrix.wMatrix({
        vT: {
          x: event.absoluteX - size[0] / 2,
          y: event.absoluteY - size[1] / 2,
        },
        vR: event.velocityX / 1000 + (startRotation > 0 ? 22 / 7 : -22 / 7),
        vS: { x: 1.3, y: 1.3 },
      });
    },
    onFinalize: (event) => {
      animatedMatrix.wT(position);
      animatedMatrix.wR(startRotation);
      animatedMatrix.wS({ x: 1, y: 1 });
      runOnJS(setSRotation)(startRotation);
      runOnJS(setGrabbed)(false);
    },
  });

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
            shadowRadius: 5,
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
            fontSize="4"
            fontFamily="Outfit"
            fill={paint.clarColor.l > 0.5 ? "#000" : "#fff"}
            textAnchor="middle"
            alignmentBaseline="middle"
            transform={`rotate(${Math.abs(startRotation) > 11 / 7 ? 180 : 0}, 16, 10)`}
            fontWeight={500}
          >
            {paint.label}
            <TSpan
              x="16"
              dy="5"
              fontSize="3"
              fill={paint.clarColor.l > 0.5 ? "#000" : "#fff"}
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
