import React, { useEffect, useRef } from "react";
import { View } from "react-native";
import Svg, { G, Text, Path, Defs, TextPath, TSpan } from "react-native-svg";
import SectorPath from "./SectorPath";
import { Animated } from "react-native";
export default function MixerSector({
  hues,
  sats,
  lits,
  innerRadius,
  outerRadius,
  style,
  startAngle = 0,
  endAngle = 60,
  direction = 1,
  strokeWidth = 0,
  sat,
  lit,
  label = "",
  textStyles = {},
}) {
  let modifiedValue;
  if (sat) {
    modifiedValue =
      (sat - sats[0]) / ((sats[sats.length - 1] - sats[0]) / sats.length);
    modifiedValue = Math.floor(modifiedValue);
    if (modifiedValue > sats.length - 1) {
      modifiedValue = sats.length - 1;
    }
  } else if (lit) {
    modifiedValue =
      (lit - lits[0]) / ((lits[lits.length - 1] - lits[0]) / lits.length);
    modifiedValue = Math.floor(modifiedValue);
    if (modifiedValue > lits.length - 1) {
      modifiedValue = lits.length - 1;
    }
  }
  const sectorNumber = Math.max(hues.length, sats.length, lits.length);
  const anim = useRef(new Animated.Value(0)).current;
  const endPos = [
    Math.cos((endAngle * Math.PI) / 180) * outerRadius,
    Math.sin((endAngle * Math.PI) / 180) * outerRadius,
  ];
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [anim]);
  function getColors() {
    let sectorComponents = [];
    let angle = (endAngle - startAngle) / sectorNumber;
    for (let i = 0; i < sectorNumber; i++) {
      if (i === modifiedValue) {
        continue;
      }
      const pathEndPos = [
        Math.cos(
          ((180 - (endAngle - startAngle) / 2 - label.length * 0.7) * Math.PI) /
            180
        ) *
          (outerRadius * 0.95) +
          outerRadius,
        Math.sin(
          ((180 - (endAngle - startAngle) / 2 - label.length * 0.7) * Math.PI) /
            180
        ) *
          (outerRadius * 0.95) +
          outerRadius,
      ];
      sectorComponents.push(
        <Animated.View
          key={i}
          style={{
            zIndex: 0,
            width: outerRadius * 2,
            height: outerRadius * 2,
            position: "absolute",
            transform: [
              {
                translateX: -outerRadius,
              },
              {
                translateY: -outerRadius,
              },
              {
                rotate: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [
                    `${0}deg`,
                    `${90 - startAngle + i * angle * direction}deg`,
                  ],
                }),
              },
              {
                scaleX: direction,
              },
            ],
          }}
        >
          <Svg>
            <G>
              <SectorPath
                hue={hues.length > 1 ? hues[i] : hues[0]}
                saturation={sats.length > 1 ? sats[i] : sats[0]}
                lightness={lits.length > 1 ? lits[i] : lits[0]}
                angle={angle}
                innerRadius={innerRadius}
                outerRadius={outerRadius}
              />
            </G>
          </Svg>
          <View
            style={{
              position: "absolute",
              width: outerRadius * 2,
              height: outerRadius * 2,
              transform: [
                {
                  scaleX: direction,
                },
              ],
            }}
          >
            <Svg>
              <Defs>
                <Path
                  id="path"
                  d={`
                    M ${pathEndPos[0]},${pathEndPos[1]}
                 
                   A ${outerRadius},${outerRadius} 0,0,1  ${
                    outerRadius * 0.05
                  },${outerRadius * 0.95}`}
                />
              </Defs>
              <Text
                fill={lits[0] > 50 ? "black" : "white"}
                fontSize={textStyles.fontSize}
                fontFamily="-"
              >
                <TextPath href="#path">{label}</TextPath>
              </Text>
            </Svg>
          </View>
        </Animated.View>
      );
    }

    return sectorComponents;
  }

  return (
    <View
      style={{
        ...style,
      }}
    >
      {getColors()}
    </View>
  );
}
