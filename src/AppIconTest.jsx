import React from "react";
import ButtonSector from "./ButtonSector";
import { Dimensions } from "react-native";
import { Hsluv } from "./hsluv.mjs";
import { Svg, Stop, RadialGradient, Rect } from "react-native-svg";
export default function AppIconTest() {
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  let sizeMod = 1;
  if (screenHeight < 2 * screenWidth) {
    sizeMod = screenHeight * 0.4;
  } else {
    sizeMod = screenWidth;
  }
  const totalSectors = 5;
  const selected = 2;
  const startHue = 180;
  const endHue = 0;
  let startAngle = -30;
  const endAngle = 30;
  const innerRadius = sizeMod * 0.7;
  const outerRadius = sizeMod * 1.7;
  const gap = 0;
  const direction = -1;
  const textStyles = {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
  };
  function getSectors() {
    let sectors = [];
    let hueStep = (endHue - startHue) / (totalSectors - 1);
    let angleStep = (endAngle - startAngle) / totalSectors;
    angleStep -= gap;
    for (let i = 0; i < totalSectors; i++) {
      let hue = startHue + hueStep * i;
      const hsluv = new Hsluv(hue, 100, 50);
      hsluv.hsluvToHex();
      sectors.push(
        <ButtonSector
          key={i}
          hue={hue}
          angle={angleStep * (i === selected ? 1.2 : 1)}
          startRotation={-90}
          endRotation={
            startAngle +
            (angleStep + gap) * (i + 0.5) -
            (i === selected ? angleStep * 0.1 : 0)
          }
          outerRadius={outerRadius * (i === selected ? 1.1 : 1)}
          innerRadius={innerRadius * (i === selected ? 0.9 : 1)}
          direction={-1}
          style={{
            position: "absolute",
            top: screenHeight / 2,
            left: 1.2 * screenWidth,
            zIndex: i === selected ? 10 : i,
            shadowColor: hsluv.hex,
            shadowOffset: {
              width: 0,
              height: 2 - i,
            },
            shadowOpacity: i === selected ? 1 : 1,
            shadowRadius: 30,
            zIndex: 3 - Math.abs(i - selected),
          }}
          textStyles={{ ...textStyles }}
          strokeWidth={0}
          sectors={4}
          litRange={i == selected ? [60, 110] : [60, 107]}
          satRange={[100, 75]}
        />
      );
    }
    return sectors;
  }

  return (
    <>
      <Svg
        style={{
          top: 0,
          left: 0,
          width: screenWidth * 2,
          height: screenHeight,
        }}
        width={screenWidth * 2}
        height={screenHeight}
      >
        <RadialGradient
          id="grad"
          cx="50%"
          cy="50%"
          rx="50%"
          ry="100%"
          fx="50%"
          fy="50%"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0%" stopColor="#8800aa" stopOpacity="1" />
          <Stop offset="100%" stopColor="#0088aa" stopOpacity="1" />
        </RadialGradient>
        <Rect
          x={0}
          y={0}
          width={screenWidth * 2}
          height={screenHeight}
          fill="url(#grad)"
        />
      </Svg>
      {getSectors()}
    </>
  );
}
