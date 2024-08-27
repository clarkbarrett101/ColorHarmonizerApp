import { Svg, Path, G } from "react-native-svg";
import React from "react";
import { useEffect, useRef } from "react";
import SectorPath from "./SectorPath";
import { Text, View, Animated, Dimensions } from "react-native";
export default function ButtonSector({
  hue,
  label,
  angle,
  startRotation,
  endRotation,
  outerRadius,
  innerRadius,
  style,
  direction = 1,
  strokeWidth = 0,
  textStyles = { fontSize: 12 },
  sectors,
  satRange = [75, 75],
  litRange = [40, 95],
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [anim]);

  function getSectors() {
    let sectorComponents = [];
    const innerWidthStep = (outerRadius - innerRadius) / sectors;
    for (let i = 0; i < sectors; i++) {
      sectorComponents.push(
        <SectorPath
          key={i}
          hue={hue}
          saturation={satRange[0] + ((satRange[1] - satRange[0]) / sectors) * i}
          lightness={litRange[0] + ((litRange[1] - litRange[0]) / sectors) * i}
          angle={angle}
          innerRadius={innerRadius + innerWidthStep * i}
          outerRadius={outerRadius}
          style={{ zIndex: i, position: "absolute" }}
        />
      );
    }
    return sectorComponents;
  }
  const screenHeight = Dimensions.get("window").height;

  const endPos = [
    Math.cos((endRotation * Math.PI) / 180) * outerRadius,
    Math.sin((endRotation * Math.PI) / 180) * outerRadius - screenHeight / 2,
  ];

  return (
    <Animated.View
      width={outerRadius * 2}
      height={outerRadius * 2}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        transform: [
          {
            translateX: -outerRadius,
          },
          {
            translateY: -outerRadius,
          },
          {
            scaleX: direction,
          },

          {
            rotate: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [`${startRotation}deg`, `${endRotation - 5}deg`],
            }),
          },
        ],
        ...style,
      }}
    >
      <Svg>{getSectors()}</Svg>
      {label ? (
        <Text
          style={{
            ...textStyles,
            fontSize: textStyles.fontSize * (1 + strokeWidth / 5),
            left: outerRadius + innerRadius,
            top: outerRadius * 1.05,
            width: outerRadius - innerRadius,
            position: "absolute",
            textAlign: "center",
            fontFamily: "-",
            transform: [
              {
                scaleX: direction,
              },
              {
                rotate: "-8deg",
              },
            ],
          }}
        >
          {label}
        </Text>
      ) : null}
    </Animated.View>
  );
}
