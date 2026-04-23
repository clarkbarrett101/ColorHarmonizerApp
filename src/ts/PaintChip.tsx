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
import { useAnimatedMatrix, tMatrix, AnimatedMatrix } from "./AnimatedMatrix";
import { runOnJS } from "react-native-worklets";
import { View } from "react-native";
import { useUserContext } from "./UserContext";
import { useVerseTransform } from "./Verse";

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
  collapsed?: boolean;
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
  collapsed = false,
}: tPaintChip) => {
  const { vPanX, vPanY, vVelocityX, vHeldChip, holdChip } = useUserContext();
  const vTilt = useSharedValue(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [grabbed, setGrabbed] = useState(false);
  const vTransform = useVerseTransform({
    t: startPosition,
    r: 22 / 7,
    s: { x: 1, y: 1 },
    offset: radialOffset,
    tilt: 0,
  });
  useEffect(() => {
    if (collapsed) {
      vTilt.value = withDelay(
        (1 - chipID[1]) * 100,
        withTiming(11 / 7, { duration: 500 }),
      );
    } else {
      vTilt.value = withDelay(
        chipID[1] * 100,
        withTiming(0, { duration: 500 }),
      );
    }
  }, [collapsed, chipID]);
  const panGesture = usePanGesture({
    onActivate: (event) => {
      const matrixPosition = vTransform.dPosition.value;
      runOnJS(setPosition)(matrixPosition);
      holdChip(chipID);
      runOnJS(setGrabbed)(true);
      vTransform.fUpate({});
    },
    onUpdate: (event) => {
      vPanX.value = (event.absoluteX + vPanX.value) / 2;
      vPanY.value = (event.absoluteY + vPanY.value) / 2;
      vVelocityX.value = event.velocityX;
    },
    onDeactivate: (event) => {
      holdChip();
      runOnJS(setGrabbed)(false);
      vTransform.fUpate({});
    },
    simultaneousWith: simultaneousHandlers,
  });
  const dMatrix = useDerivedValue(() => {
    const held =
      vHeldChip.value[0] === chipID[0] && vHeldChip.value[1] === chipID[1];
    if (held) {
      return {
        t: {
          x: vPanX.value - size[0] / 2,
          y: vPanY.value - size[1] / 2,
        },
        r: vVelocityX.value / 1000 + (startRotation > 0 ? 22 / 7 : 0),
        s: { x: 1.3, y: 1.3 },
        tilt: 0,
        offset: 0,
      };
    } else {
      return {
        t: startPosition,
        r: startRotation,
        s: { x: 1, y: 1 },
        offset: radialOffset,
        tilt: vTilt.value,
      };
    }
  }, [vPanX, vPanY, vVelocityX, vHeldChip.value, collapsed]);

  const animatedStyle = useAnimatedStyle(() => {
    vTransform.wSetMatrix(dMatrix.value);
    console.log(vTransform.vOffset.asShared.value);
    return vTransform.dTransform.value;
  }, [vTransform]);

  const rID = useRef(Math.random()).current;
  return (
    <GestureDetector gesture={panGesture} key={rID}>
      <Animated.View
        style={[
          {
            position: "absolute",
            zIndex: grabbed ? 1000 : zIndex,
            borderWidth: 1,
          },
          animatedStyle,
        ]}
      >
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
              x1={`${Math.cos(vTransform.vR.asState() + 11 / 7) * 50 + 50}%`}
              y1={`${Math.sin(vTransform.vR.asState() + 11 / 7) * 50 + 50}%`}
              x2={`${Math.cos(vTransform.vR.asState() - 11 / 7) * 50 + 50}%`}
              y2={`${Math.sin(vTransform.vR.asState() - 11 / 7) * 50 + 50}%`}
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
            transform={`rotate(${Math.abs(vTransform.vR.asState()) > 11 / 7 ? 180 : 0}, 16, 10)`}
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
      </Animated.View>
    </GestureDetector>
  );
};
function mMatrix(xR, zR, tX, tY) {
  const cosX = Math.cos(xR);
  const sinX = Math.sin(xR);
  const cosZ = Math.cos(zR);
  const sinZ = Math.sin(zR);
  return [
    cosZ,
    sinZ,
    0,
    0,
    -sinZ * cosX,
    cosZ * cosX,
    sinX,
    0,
    sinZ * sinX,
    -cosZ * sinX,
    cosX,
    -0.1,
    tX,
    tY,
    0,
    1,
  ];
}
