import React, { useRef, useEffect, useState, useMemo } from "react";
import { View, PanResponder, Dimensions } from "react-native";
import { Hsluv } from "./hsluv";
import { Svg, Path, G, Text } from "react-native-svg";
import {
  Gesture,
  GestureDetector,
  GestureStateManager,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useDerivedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";
export default function PaintCapsule({
  paint,
  startRotation,
  endRotation,
  width,
  radiusOffset,
  direction,
  onDragStart,
  onDrop,
  isSaved,
  style,
  isDragging,
  position = null,
  shadows = true,
  xOffset = 0,
}) {
  const startPos = position
    ? position
    : [
        Math.cos((startRotation * Math.PI) / 180) * radiusOffset,
        Math.sin((startRotation * Math.PI) / 180) * radiusOffset,
      ];

  const endPos = position
    ? position
    : [
        Math.cos((endRotation * Math.PI) / 180) * radiusOffset,
        Math.sin((endRotation * Math.PI) / 180) * radiusOffset,
      ];
  const middlePos = position
    ? position
    : [
        Math.cos((((startRotation + endRotation) / 2) * Math.PI) / 180) *
          radiusOffset,
        Math.sin((((startRotation + endRotation) / 2) * Math.PI) / 180) *
          radiusOffset,
      ];
  const screenHeight = Dimensions.get("window").height;
  const screenWidth = Dimensions.get("window").width;
  const isThisDragging = useSharedValue(false);
  const chipPan = useSharedValue([startPos[0], startPos[1]]);
  const rotation = useSharedValue(startRotation);
  const size = useSharedValue(width);

  useEffect(() => {
    rotation.value = startRotation;
    rotation.value = withTiming(endRotation, {
      duration: 250,
      easing: Easing.linear,
    });
    chipPan.value = [startPos[0], startPos[1]];
    chipPan.value = withSequence(
      withTiming([middlePos[0], middlePos[1]], {
        duration: 125,
        easing: Easing.linear,
      }),
      withTiming([endPos[0], endPos[1]], {
        duration: 125,
        easing: Easing.linear,
      })
    );
  }, [startRotation, endRotation]);
  useEffect(() => {
    if (!isDragging) {
      isThisDragging.value = false;
    }
  }, [isDragging]);

  const pan = React.useMemo(() =>
    Gesture.Pan()
      .shouldCancelWhenOutside(false)
      .minDistance(0)
      .onBegin((e) => {
        isThisDragging.value = true;
        console.log("begin");

        if (direction == -1) {
          chipPan.value[0] = screenWidth - e.absoluteX;
        } else {
          chipPan.value[0] = e.absoluteX + xOffset;
        }

        chipPan.value[1] = endPos[1] + e.translationY;
        rotation.value = withTiming(0, {
          duration: 100,
          easing: Easing.linear,
        });
        size.value = withTiming(width * 1.2, {
          duration: 100,
          easing: Easing.linear,
        });
        console.log(e);
      })

      .onUpdate((e) => {
        let x;
        if (direction == -1) {
          x = screenWidth - e.absoluteX;
        } else {
          x = e.absoluteX + xOffset;
        }
        const y = endPos[1] + e.translationY;
        chipPan.value = [x, y];
      })
      .onFinalize((e) => {
        chipPan.value[0] = withSpring(endPos[0]);
        chipPan.value[1] = withSpring(endPos[1]);
        isThisDragging.value = false;
        size.value = withTiming(width);
        rotation.value = withTiming(endRotation);
        runOnJS(onDrop)([e.absoluteX, e.absoluteY], paint, isSaved);
        console.log("end");
      })
  );
  const tap = React.useMemo(() =>
    Gesture.Tap()
      .runOnJS(true)
      .onBegin((e) => {
        console.log("tapped");
        onDragStart(paint, isSaved);
        console.log(pan);
      })
  );
  const simGesture = Gesture.Simultaneous(tap, pan);
  const animStyle = useAnimatedStyle(() => {
    return {
      position: "absolute",
      left: chipPan.value[0],
      top: chipPan.value[1],
      width: size.value,
      height: size.value / 2,

      transform: [
        {
          rotate: `${rotation.value}deg`,
        },
      ],
      shadowColor: "#000",
      shadowOffset: {
        width: isThisDragging.value
          ? (screenWidth / 2 - chipPan.value[0]) / 20
          : 0,
        height: isThisDragging.value
          ? (screenHeight / 2 - chipPan.value[1]) / 20
          : 0,
      },
      shadowOpacity: shadows ? 0.5 : 0,
      shadowRadius: isThisDragging.value ? 10 : 3,
      zIndex: isThisDragging.value ? 100 : 0,
    };
  });

  const hsluv = new Hsluv(paint.hsluv[0], paint.hsluv[1], 0);

  hsluv.hsluv_l = paint.hsluv[2] > 50 ? 15 : 85;
  hsluv.hsluvToHex();
  const textColor = hsluv.hex;
  return (
    <Animated.View style={animStyle}>
      <GestureDetector gesture={simGesture}>
        <Svg
          viewBox={`0 0 400 200`}
          style={{
            position: "absolute",

            transform: [{ scaleX: direction }],
          }}
        >
          <G>
            <Path
              d="M375.6,200H22.9C-28.6,106.4,22.9,0,22.9,0l352.9.3s54.6,81.2-.1,199.7Z"
              fill={paint.hex}
            />
            <Path
              d="M182.4,12.8l-35.3,1.7-35.3,1.6-35.3,1.6-17.6.8c-5.9.3-11.8.5-17.6.5l4.7-2.9c-1.6,3.1-2.9,6.4-4.5,9.6-.8,1.6-1.5,3.2-2.2,4.9-.7,1.7-1.3,3.3-1.9,5.1-1.2,3.4-2.2,6.9-3,10.5-.4,1.8-.8,3.6-1.1,5.5-.3,1.8-.6,3.7-.8,5.6h-1c-.4-1.8-.7-3.7-1-5.6-.3-1.9-.4-3.8-.5-5.8-.2-3.9-.1-7.8.3-11.7.4-3.9,1.1-7.8,2-11.7,1-3.9,2.6-7.5,4.4-11.1l1.4-2.8h3.3c5.9-.2,11.8,0,17.6,0l17.6.5,35.3.9,35.3.9,35.3,1v1Z"
              fill="#fff"
              opacity=".5"
            />
            <Path
              d="M22.9,199.5l349.1-9.5-4.4,2.7h0c8.1-14,14.5-29.1,19.1-44.8,2.3-7.8,4.2-15.8,5.5-23.8.7-4,1.2-8.1,1.7-12.2.4-4.1.8-8.2,1-12.2.8-16.4-.3-32.9-3.2-49.1-3-16.2-7.9-32.1-14.6-47.2l.9-.4c7.3,14.9,12.8,30.8,16.6,47.1,3.7,16.3,5.6,33,5.5,49.8,0,4.2-.2,8.4-.5,12.6-.3,4.2-.7,8.4-1.2,12.6-1,8.4-2.5,16.7-4.5,24.9-3.9,16.4-9.8,32.4-17.4,47.6h0s-1.5,2.7-1.5,2.7h-2.9s-349.3.3-349.3.3v-1Z"
              fill="#000"
              opacity=".2"
            />
          </G>
          <G scaleX={direction}>
            <Text
              adjustsFontSizeToFit={true}
              fill={textColor}
              fontSize="30"
              x="50%"
              y="25%"
              textAnchor="middle"
              fontFamily="Outfit"
              scaleX={direction}
            >
              {paint.name}
            </Text>
            <Text
              adjustsFontSizeToFit={true}
              fill={textColor}
              fontSize="30"
              x="50%"
              y="50%"
              textAnchor="middle"
              fontFamily="Outfit"
              scaleX={direction}
            >
              {"(" + paint.brand + ")"}
            </Text>
            <Text
              adjustsFontSizeToFit={true}
              fill={textColor}
              fontSize="25"
              x="50%"
              y="75%"
              textAnchor="middle"
              fontFamily="Outfit"
              scaleX={direction}
            >
              {"# " + paint.label}
            </Text>
          </G>
        </Svg>
      </GestureDetector>
    </Animated.View>
  );
}
