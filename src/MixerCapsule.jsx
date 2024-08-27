import React, { useRef, useEffect, useState } from "react";
import { View, Animated, PanResponder, Dimensions } from "react-native";
import { Hsluv } from "./hsluv";
import { Svg, Path, G, Text } from "react-native-svg";
export default function MixerCapsule({
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
  position,
  chipPosition,
  setChipPosition,
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
  const anim = useRef(new Animated.Value(0)).current;
  const [isThisDragging, setIsThisDragging] = useState(false);
  useEffect(() => {
    if (!isDragging) {
      setIsThisDragging(false);
    }
  }, [isDragging]);
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [anim]);
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    panResponderTerminationRequest: () => false,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (e, gestureState) => {
      onDragStart(paint, isSaved, [e.nativeEvent.pageX, e.nativeEvent.pageY]);
      setIsThisDragging(true);
      setChipPosition([
        e.nativeEvent.pageX - width / 2,
        (position ? position[1] : endPos[1]) - width / 8,
      ]);
    },
    onPanResponderMove: (e, gestureState) => {
      setChipPosition([
        e.nativeEvent.pageX - width / 2,
        chipPosition[1] + gestureState.dy,
      ]);
    },
    onPanResponderTerminate: (e) => {
      onDrop([e.nativeEvent.pageX, e.nativeEvent.pageY], paint, isSaved);
      setChipPosition([0, 0]);
      setIsThisDragging(false);
    },
    onPanResponderRelease: (e) => {
      onDrop([e.nativeEvent.pageX, e.nativeEvent.pageY], paint, isSaved);
      setChipPosition([0, 0]);
      setIsThisDragging(false);
    },
  });

  const hsluv = new Hsluv(paint.hsluv[0], paint.hsluv[1], 0);

  hsluv.hsluv_l = paint.hsluv[2] > 50 ? 15 : 85;
  hsluv.hsluvToHex();
  const textColor = hsluv.hex;
  return (
    <Animated.View
      style={{
        position: "absolute",
        left: isThisDragging
          ? chipPosition[0] - screenWidth
          : anim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [startPos[0], middlePos[0], endPos[0]],
            }),
        top: isThisDragging
          ? chipPosition[1]
          : anim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [startPos[1], middlePos[1], endPos[1]],
            }),
        height: width / 2,

        width: width,
        transform: [
          {
            rotate: isThisDragging
              ? "0deg"
              : anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [`${startRotation}deg`, `${endRotation}deg`],
                }),
          },
        ],
        ...style,
        shadowColor: "black",
        shadowOffset: {
          width: isThisDragging ? (direction * -chipPosition[0]) / 10 : 0,
          height: isThisDragging ? (direction * -chipPosition[1]) / 10 : 0,
        },
        shadowOpacity: 0.3,
        shadowRadius: isThisDragging ? 10 : 5,
      }}
      {...panResponder.panHandlers}
    >
      <Svg
        viewBox={`0 0 400 200`}
        style={{
          position: "absolute",
          width: width * (isThisDragging ? 1.2 : 1),
          height: (width / 2) * (isThisDragging ? 1.2 : 1),
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
        </G>
      </Svg>
    </Animated.View>
  );
}
