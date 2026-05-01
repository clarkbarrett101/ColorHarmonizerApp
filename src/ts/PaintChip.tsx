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
import { useEffect, useState } from "react";
import { runOnJS } from "react-native-worklets";
import { DeviceEventEmitter, View } from "react-native";
import { eLayers, useUserContext } from "./UserContext";

export type tChipEvent = "idle" | "onPush" | "onPull" | "onDrop";

export type tPaintChip = {
  paintA: tPaint;
  paintB?: tPaint;
  startPosition: { x: number; y: number };
  size?: [number, number];
  startRotation?: number;
  zIndex?: number;
  radialOffset?: number;
  chipID: [number, number];
  simultaneousHandlers?: any;
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
  startPosition,
  size = [120, 75],
  startRotation = 0,
  zIndex = 0,
  radialOffset = 0,
  simultaneousHandlers,
  chipID,
  sideA = true,
  groupLayer = 0,
  direction = 1,
}: tPaintChip) => {
  /// FLIP ///
  const [isPaintA, setIsPaintA] = useState(false);
  const vTilt = useSharedValue(0);
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

  ///Enter Spin///
  const vR = useSharedValue(0);
  useEffect(() => {
    vR.value = withTiming(-direction * startRotation, { duration: 1000 });
  }, [chipID, direction, startRotation]);

  const {
    vPanX,
    vPanY,
    vVelocityX,
    vHeldChip,
    holdChip,
    vHeldPaint,
    eventDispatch,
    vPanMix,
    vPanOverride,
  } = useUserContext();

  ///Event Dispatch///
  const [grabbed, setGrabbed] = useState(false);
  const isHeld = useDerivedValue(() => {
    return (
      vHeldChip.asShared.value[0] === chipID[0] &&
      vHeldChip.asShared.value[1] === chipID[1]
    );
  });
  useEffect(() => {
    const paint = isPaintA ? paintA : paintB;
    if (
      vHeldChip.asState()[0] === chipID[0] &&
      vHeldChip.asState()[1] === chipID[1]
    ) {
      setGrabbed(true);
      vHeldPaint.fUpdateState(paint);
    } else if (
      (vHeldChip.asState()[0] == -1 || vHeldChip.asState()[1] == -1) &&
      grabbed
    ) {
      eventDispatch?.({ event: "onDrop", paint });
      setGrabbed(false);
    }
  }, [vHeldChip.asState]);

  ///PAN GESTURE///
  const panGesture = usePanGesture({
    simultaneousWith: simultaneousHandlers,
    onActivate: (event) => {
      holdChip(chipID, "onPull");
    },
    onUpdate: (event) => {
      vPanX.setValue(event.absoluteX);
      vPanY.setValue(event.absoluteY);
      vVelocityX.setValue(event.velocityX);
    },
    onDeactivate: (event) => {
      holdChip();
    },
  });
  const mix = (a, b, t) => {
    "worklet";
    return a * (1 - t) + b * t;
  };
  ///Transform Style///
  const dTransform = useDerivedValue<{ transform: any[] }>(() => {
    let transform = { transform: [] } as any;
    const zFlipped = startRotation > 11 / 7 ? -1 : 1;
    const vFlipped = vTilt.value > 11 / 7 ? -1 : 1;

    if (isHeld.value) {
      transform = {
        transform: [
          {
            translateX:
              mix(vPanX.asShared.value, vPanOverride.value[0], vPanMix.value) -
              size[0] / 2 -
              startPosition.x,
          },
          {
            translateY:
              mix(vPanY.asShared.value, vPanOverride.value[1], vPanMix.value) -
              size[1] / 2 -
              startPosition.y,
          },
          {
            rotateZ: `${vVelocityX.asShared.value / 1000}rad`,
          },
          { scaleX: 1.3 },
          { scaleY: vTilt.value > 11 / 7 ? -1.3 : 1.3 },
        ],
      };
    } else {
      transform = {
        transform: [
          { perspective: 1000 },
          { rotateZ: `${vR.value ?? 0}rad` },
          { rotateX: `${vTilt.value}rad` },
          { translateX: radialOffset },
          { rotateZ: `${zFlipped > 0 ? 0 : 22 / 7}rad` },
        ],
      };
    }
    return transform;
  });
  const animatedStyle = useAnimatedStyle(() => {
    return dTransform.value;
  });

  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        zIndex: grabbed
          ? eLayers.dropScreen + 10
          : isPaintA
            ? zIndex + groupLayer
            : groupLayer - zIndex,
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
              transform: [{ scaleY: isPaintA ? 1 : -1 }],
            }}
          >
            <Defs>
              <LinearGradient
                id="grad"
                x1={`${Math.cos(-(grabbed ? 0 : startRotation) + 22 / 7) * 50 + 50}%`}
                y1={`${Math.sin(-(grabbed ? 0 : startRotation) + 22 / 7) * 50 + 50}%`}
                x2={`${Math.cos(-(grabbed ? 0 : startRotation)) * 50 + 50}%`}
                y2={`${Math.sin(-(grabbed ? 0 : startRotation)) * 50 + 50}%`}
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
                fill={(isPaintA ? paintA.hex : paintB.hex) || "transparent"}
              />
              <Path
                d="M0 4C8 0 24 0 32 4V16C24 20 8 20 0 16Z"
                fill="url(#grad)"
              />
              <Path
                d="M1 5C12 1 20 1 31 5V15C20 19 12 19 1 15Z"
                fill={(isPaintA ? paintA.hex : paintB.hex) || "transparent"}
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
