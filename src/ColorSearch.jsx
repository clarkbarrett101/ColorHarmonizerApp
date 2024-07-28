import { View, Text, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import { Hsluv } from "./hsluv";
import masterList from "./masterList.mjs";
export default function ColorSearch() {
  const numSections = 12;
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);

  function hueSlider() {
    function section(index) {
      let hsluv = new Hsluv();
      hsluv.hsluv_h = index * (360 / numSections);
      hsluv.hsluv_s = saturation;
      hsluv.hsluv_l = lightness;
      hsv = hsluv.hsluvToHex();
      return (
        <TouchableOpacity
          key={index}
          style={{ flex: 1, height: 40, backgroundColor: hsluv.hex }}
          onPressIn={() => setHue(index * (360 / numSections))}
        ></TouchableOpacity>
      );
    }
    return (
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
        {Array(numSections)
          .fill(0)
          .map((_, index) => section(index))}
      </View>
    );
  }
  function saturationSlider() {
    function section(index) {
      let hsluv = new Hsluv();
      hsluv.hsluv_h = hue;
      hsluv.hsluv_s = index * (100 / numSections);
      hsluv.hsluv_l = lightness;
      hsv = hsluv.hsluvToHex();
      return (
        <TouchableOpacity
          key={index}
          style={{
            flex: 1,
            height: 40,
            backgroundColor: hsluv.hex,
          }}
          onPressIn={() => setSaturation(index * 2)}
        ></TouchableOpacity>
      );
    }
    return (
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          width: "33%",
          padding: 10,
        }}
      >
        {Array(numSections / 3)
          .fill(0)
          .map((_, index) => section(index * 3))}
      </View>
    );
  }
  function lightnessSlider() {
    function section(index) {
      let hsluv = new Hsluv();
      hsluv.hsluv_h = hue;
      hsluv.hsluv_s = saturation;
      hsluv.hsluv_l = index * (100 / numSections);
      hsv = hsluv.hsluvToHex();
      return (
        <TouchableOpacity
          key={index}
          style={{
            flex: 1,
            height: 40,
            backgroundColor: hsluv.hex,
          }}
          onPressIn={() => setLightness((index * 2) / 3)}
        ></TouchableOpacity>
      );
    }
    return (
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          width: "66%",
          padding: 10,
        }}
      >
        {Array((numSections * 2) / 3)
          .fill(0)
          .map((_, index) => section((index * 2) / 3))}
      </View>
    );
  }

  return (
    <View
      style={{
        height: "10%",

        flexDirection: "column",
        display: "flex",
        alignItems: "center",
        top: "40%",
      }}
    >
      {hueSlider()}
      <View style={{ display: "flex", flexDirection: "row", flex: 1 }}>
        {saturationSlider()}
        {lightnessSlider()}
      </View>
    </View>
  );
}
