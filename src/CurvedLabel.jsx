import * as React from "react";
import Svg, { Defs, Path, Text, TextPath } from "react-native-svg";
import { View, Image } from "react-native";

export function Analogous({ width, height, style }) {
  return (
    <Svg viewBox="0 0 250 100" width={width} height={height} style={style}>
      <Defs>
        <Path id="a" d="M 25 75 C 75 25 175 25 225 75" />
      </Defs>
      <Text
        style={{
          lineHeight: "57.8292px",
          whiteSpace: "pre",
          transformOrigin: "left center",
        }}
        fill="#333"
        fontFamily="Outfit"
        fontSize={45}
        fontWeight={700}
      >
        <TextPath xlinkHref="#a">{"Analogous"}</TextPath>
      </Text>
    </Svg>
  );
}
export function Complementary({ width, height, style }) {
  return (
    <Svg viewBox="0 0 250 100" width={width} height={height} style={style}>
      <Defs>
        <Path id="a" d="M 25 75 C 75 25 175 25 225 75" />
      </Defs>
      <Text
        style={{
          lineHeight: "57.8292px",
          whiteSpace: "pre",
          transformOrigin: "left center",
        }}
        fill="#333"
        fontFamily="Outfit"
        fontSize={30}
        fontWeight={700}
      >
        <TextPath xlinkHref="#a">{"Complementary"}</TextPath>
      </Text>
    </Svg>
  );
}
export function DoubleSplitComplementary({ width, height, style }) {
  return (
    <Svg viewBox="0 0 250 100" width={width} height={height} style={style}>
      <Defs>
        <Path id="a" d="M25 25 C 75 75 175 75 225 25" />
      </Defs>
      <Text
        style={{
          lineHeight: "57.8292px",
          whiteSpace: "pre",
          transformOrigin: "left center",
        }}
        fill="#333"
        fontFamily="Outfit"
        fontSize={28}
        fontWeight={700}
        y={"-10%"}
      >
        <TextPath startOffset={"7%"} xlinkHref="#a">
          {"Double Split"}
        </TextPath>
      </Text>
      <Text
        style={{
          lineHeight: "57.8292px",
          whiteSpace: "pre",
          transformOrigin: "left center",
        }}
        fill="#333"
        fontFamily="Outfit"
        fontSize={30}
        fontWeight={700}
        y={"10%"}
      >
        <TextPath xlinkHref="#a">{"Complementary"}</TextPath>
      </Text>
    </Svg>
  );
}
export function SplitComplementary({ width, height, style }) {
  return (
    <Svg viewBox="0 0 250 100" width={width} height={height} style={style}>
      <Defs>
        <Path id="a" d="M 25 75 C 75 25 175 25 225 75" />
      </Defs>
      <Text
        style={{
          lineHeight: "57.8292px",
          whiteSpace: "pre",
          transformOrigin: "left center",
        }}
        fill="#333"
        fontFamily="Outfit"
        fontSize={35}
        fontWeight={700}
        y={"-10"}
      >
        <TextPath startOffset={"35%"} xlinkHref="#a">
          {"Split"}
        </TextPath>
      </Text>
      <Text
        style={{
          lineHeight: "57.8292px",
          whiteSpace: "pre",
          transformOrigin: "left center",
        }}
        fill="#333"
        fontFamily="Outfit"
        fontSize={30}
        fontWeight={700}
        y={"10%"}
      >
        <TextPath xlinkHref="#a">{"Complementary"}</TextPath>
      </Text>
    </Svg>
  );
}
export function Tetradic({ width, height, style }) {
  return (
    <Svg viewBox="0 0 250 100" width={width} height={height} style={style}>
      <Defs>
        <Path id="a" d="M25 25 C 75 75 175 75 225 25" />
      </Defs>
      <Text
        style={{
          lineHeight: "57.8292px",
          whiteSpace: "pre",
          transformOrigin: "left center",
        }}
        fill="#333"
        fontFamily="Outfit"
        fontSize={45}
        fontWeight={700}
      >
        <TextPath startOffset={"10%"} xlinkHref="#a">
          {"Tetradic"}
        </TextPath>
      </Text>
    </Svg>
  );
}
export function Triadic({ width, height, style }) {
  return (
    <Svg viewBox="0 0 250 100" width={width} height={height} style={style}>
      <Defs>
        <Path id="a" d="M 25 75 C 75 25 175 25 225 75" />
      </Defs>
      <Text
        style={{
          lineHeight: "57.8292px",
          whiteSpace: "pre",
          transformOrigin: "left center",
        }}
        fill="#333"
        fontFamily="Outfit"
        fontSize={50}
        fontWeight={700}
      >
        <TextPath xlinkHref="#a">{"Triadic"}</TextPath>
      </Text>
    </Svg>
  );
}
