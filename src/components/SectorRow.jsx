import { Svg, Path, G } from "react-native-svg";
import React from "react";
import { useEffect, useRef } from "react";
import { Text, View, Animated, Dimensions } from "react-native";
import { Hsluv } from "../hsluv.mjs";
export default function SectorRow({
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
  hsl,
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const hslCheckRange = 10;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [anim]);
  function isHSL(h, s, l) {
    if (!hsl) {
      return false;
    }
    let isHSL =
      h === hsl[0] &&
      s >= hsl[1] - hslCheckRange &&
      s <= hsl[1] + hslCheckRange &&
      l >= hsl[2] - hslCheckRange &&
      l <= hsl[2] + hslCheckRange;
    return isHSL;
  }

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

  function rgbString(hsluv) {
    if (hsluv.rgb_r < 0) {
      hsluv.rgb_r = 0;
    }
    if (hsluv.rgb_g < 0) {
      hsluv.rgb_g = 0;
    }
    if (hsluv.rgb_b < 0) {
      hsluv.rgb_b = 0;
    }
    if (hsluv.rgb_r > 1) {
      hsluv.rgb_r = 1;
    }
    if (hsluv.rgb_g > 1) {
      hsluv.rgb_g = 1;
    }
    if (hsluv.rgb_b > 1) {
      hsluv.rgb_b = 1;
    }

    return `rgb(${Math.round(hsluv.rgb_r * 255)}, ${Math.round(
      hsluv.rgb_g * 255
    )}, ${Math.round(hsluv.rgb_b * 255)})`;
  }
  function getSectors() {
    let sectorComponents = [];
    const innerWidthStep = -1 + (outerRadius - innerRadius) / sectors;
    for (let i = 0; i < sectors; i++) {
      let sats =
        satRange[0] + ((satRange[1] - satRange[0]) / (sectors - 1)) * i;

      let lits =
        litRange[0] + ((litRange[1] - litRange[0]) / (sectors - 1)) * i;

      const hsluv = new Hsluv(hue, sats, lits);
      hsluv.hsluvToRgb();
      let inner = innerRadius + innerWidthStep * i;
      let outer = inner + innerWidthStep;
      if (isHSL(hue, sats, lits)) {
        inner /= 1.02;
        outer *= 1.02;
      }
      //`hsl(${hue}, ${50 + sats / 2}%, ${50 + lits / 2}%)`
      sectorComponents.push(
        <Svg
          style={{
            shadowColor: isHSL(hue, sats, lits) ? "black" : "transparent",
            shadowOpacity: 0.5,
            shadowRadius: 5,
            zIndex: isHSL(hue, sats, lits) ? 10 : 0,
            position: "absolute",
          }}
          width={outerRadius * 2}
          height={outerRadius * 2}
          key={i}
        >
          <Path
            d={annulusSectorPath(
              outerRadius,
              outerRadius,
              inner,
              outer,
              -angle * (isHSL(hue, sats, lits) ? 0.6 : 0.5),
              angle * (isHSL(hue, sats, lits) ? 0.6 : 0.5)
            )}
            fill={rgbString(hsluv)}
          />
        </Svg>
      );
    }

    return sectorComponents;
  }

  return (
    <Animated.View
      width={outerRadius * 2}
      height={outerRadius * 2}
      style={{
        position: "absolute",

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
      {getSectors()}
      {label ? (
        <Text
          adjustsFontSizeToFit={true}
          numberOfLines={1}
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
