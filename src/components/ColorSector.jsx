import React, { useEffect, useRef } from "react";
import { View } from "react-native";
import Svg, { G } from "react-native-svg";
import SectorPath from "../SectorPath";
import { Animated } from "react-native";
export default function ColorSector({
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
                    `${90 - startAngle}deg`,
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
        </Animated.View>
      );
    }
    sectorComponents.push(
      <View
        key={modifiedValue}
        style={{
          zIndex: 1,
          width: outerRadius * 2.2,
          height: outerRadius * 2.2,
          position: "absolute",
          shadowColor: "black",
          shadowRadius: 3,
          shadowOpacity: 0.5,
          shadowOffset: {
            width: 0,
            height: 0,
          },
          transform: [
            {
              translateX: -outerRadius * 1.1,
            },
            {
              translateY: -outerRadius * 1.1,
            },
            {
              rotate:
                90 - startAngle + modifiedValue * angle * direction + "deg",
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
              hue={hues.length > 1 ? hues[modifiedValue] : hues[0]}
              saturation={sats.length > 1 ? sats[modifiedValue] : sats[0]}
              lightness={lits.length > 1 ? lits[modifiedValue] : lits[0]}
              angle={angle}
              innerRadius={innerRadius}
              outerRadius={outerRadius * 1.1}
            />
          </G>
        </Svg>
      </View>
    );
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
