import { useState } from "react";
import * as React from "react";
import Svg, { Path, Text, TSpan } from "react-native-svg";

function RGB({ rgb, setRgb }) {
  return (
    <Svg
      onPress={() => setRgb(false)}
      id="Layer_1"
      data-name="Layer 1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 501 501"
      {...props}
    >
      <Path
        d="M250.5.5v250L34.01 375.61C12.7 338.82.5 296.08.5 250.5.5 112.43 112.43.5 250.5.5z"
        fill="red"
        stroke="#231f20"
        strokeMiterlimit={10}
      />
      <Path
        d="M500.5 250.5c0 45.54-12.18 88.24-33.46 125.02L250.5 250.5V.5c138.07 0 250 111.93 250 250z"
        fill="#0f0"
        stroke="#231f20"
        strokeMiterlimit={10}
      />
      <Path
        d="M467.04 375.52c-6.94 12-14.85 23.37-23.62 34-45.86 55.56-115.25 90.98-192.92 90.98-92.49 0-173.25-50.23-216.49-124.89L250.5 250.5l216.54 125.02z"
        stroke="#231f20"
        strokeMiterlimit={10}
        fill="#00f"
      />
      <Text
        transform="translate(91.98 306.07)"
        fill="#000"
        fontFamily="MyriadPro-Regular,'Myriad Pro'"
        fontSize="180px"
      >
        <TSpan x={0} y={0} letterSpacing={0}>
          {"R"}
        </TSpan>
        <TSpan x={97.38} y={0} letterSpacing={0}>
          {"GB"}
        </TSpan>
      </Text>
    </Svg>
  );
}

export default RGB;
