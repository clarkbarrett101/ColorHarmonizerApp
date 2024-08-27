import { Svg, Path, G } from "react-native-svg";
import React from "react";
import { useEffect, useRef } from "react";

import { Text, View, Animated } from "react-native";
export default function PaintSector({
  paint,
  angle,
  startRotation,
  endRotation,
  outerRadius,
  innerRadius,
  style,
  direction = 1,
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

  function annulusSectorPath(
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle
  ) {
    // Convert angles from degrees to radians
    const startRad = (Math.PI / 180) * startAngle;
    const endRad = (Math.PI / 180) * endAngle;

    // Calculate the start and end points for the outer arc
    const x1 = cx + outerRadius * Math.cos(startRad);
    const y1 = cy + outerRadius * Math.sin(startRad);
    const x2 = cx + outerRadius * Math.cos(endRad);
    const y2 = cy + outerRadius * Math.sin(endRad);

    // Calculate the start and end points for the inner arc
    const x3 = cx + innerRadius * Math.cos(endRad);
    const y3 = cy + innerRadius * Math.sin(endRad);
    const x4 = cx + innerRadius * Math.cos(startRad);
    const y4 = cy + innerRadius * Math.sin(startRad);

    // Determine if the arc should be large (greater than 180 degrees)
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    // Create the path string
    const path = `
            M ${x1} ${y1}                 
            A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} 
            L ${x3} ${y3}        
            A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}  
            Z                              
        `.trim();

    return path;
  }
  return (
    <Animated.View
      width={outerRadius * 2}
      height={outerRadius * 2}
      style={{
        position: "absolute",
        top: -outerRadius,
        left: -outerRadius,
        transform: [
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
        <G>
          <Path
            d={annulusSectorPath(
              outerRadius,
              outerRadius,
              innerRadius,
              outerRadius,
              0,
              angle
            )}
            fill={paint ? paint.hex : "transparent"}
          />
        </G>
      </Svg>
      {paint ? (
        <Text
          style={{
            ...textStyles,
            left: outerRadius + innerRadius,
            top: outerRadius + textStyles.fontSize / 2,
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
          {paint.name + `\n(${paint.brand})`}
        </Text>
      ) : null}
    </Animated.View>
  );
}
