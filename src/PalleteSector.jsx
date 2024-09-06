import { Svg, Path, G } from "react-native-svg";
import React from "react";
import { useEffect, useRef } from "react";
import SectorPath from "./SectorPath";
import { Text, View, Animated, Dimensions, TSpan } from "react-native";
export default function PalleteSector({
  paints,
  angle,
  startRotation,
  endRotation,
  outerRadius,
  innerRadius,
  style,
  direction = 1,
  strokeWidth = 0,
  textStyles = { fontSize: 12 },
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [anim]);

  const innerWidthStep = (outerRadius - innerRadius) / paints.length;
  function getSectors() {
    let sectorComponents = [];
    for (let i = 0; i < paints.length; i++) {
      sectorComponents.push(
        <SectorPath
          key={i}
          hue={paints[i].hsluv[0]}
          saturation={paints[i].hsluv[1]}
          lightness={paints[i].hsluv[2]}
          angle={angle}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          style={{ zIndex: i, position: "absolute" }}
        />
      );
    }
    return sectorComponents;
  }
  const screenHeight = Dimensions.get("window").height;
  let midpoint = (outerRadius + innerRadius) / 2;

  const endPos = [
    Math.cos((angle * Math.PI) / 180) * innerRadius,
    Math.sin((angle * Math.PI) / 180) * innerRadius,
  ];

  return (
    <Animated.View
      width={outerRadius * 2}
      height={outerRadius * 2}
      style={{
        position: "absolute",
        top: 0,
        left: style.left,
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
              outputRange: [`${startRotation}deg`, `${endRotation}deg`],
            }),
          },
        ],
        ...style,
      }}
    >
      <Svg>
        {getSectors()}
        <View
          style={{
            left: outerRadius + endPos[0],
            top: outerRadius + endPos[1],
            width: innerWidthStep,
            position: "absolute",
            textAlign: "center",
            fontFamily: "-",
            transform: [
              {
                scaleX: direction,
              },
              {
                rotate: `${-angle / 2}deg`,
              },
            ],
            display: "flex",
            flexDirection: "row",
          }}
        >
          <Text
            style={{
              ...textStyles,
              fontWeight: "bold",
              fontSize: textStyles.fontSize * 1.2,
              color: paints[0].hsluv[2] > 50 ? "black" : "white",
            }}
          >
            {paints[0].name}
          </Text>
          {paints.length == 1 ? (
            <>
              <Text
                style={{
                  ...textStyles,
                  color: paints[0].hsluv[2] > 50 ? "black" : "white",
                }}
              >
                {paints[0].brand}
              </Text>
              <Text
                style={{
                  ...textStyles,
                  color: paints[0].hsluv[2] >= 50 ? "black" : "white",
                }}
              >
                {paints[0].label}
              </Text>
            </>
          ) : null}
        </View>
      </Svg>
    </Animated.View>
  );
}
