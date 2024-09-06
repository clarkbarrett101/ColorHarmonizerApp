import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Image,
} from "react-native";

import FanMenu from "./FanMenu";
import Logo from "./Logo";

export default function Home({ pages, setCurrentPage, isPremium }) {
  const width = Dimensions.get("window").height / 2;
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  let sizeMod = 1;
  if (screenHeight < 2 * screenWidth) {
    sizeMod = screenHeight * 0.6;
  } else {
    sizeMod = screenWidth;
  }
  let fontMod = sizeMod / 400;
  function getPages() {
    let onPresses = [];

    for (let i = 1; i < pages.length; i++) {
      onPresses.push(() => setCurrentPage(i));
    }

    return onPresses;
  }
  const colors = [];
  const labels = [
    "Color Harmonizer",
    "Find Paint Color by Mixing",
    "Find Paint Color with Wheel",
    "Find Paint Color by Mood",
    "View Palette",
    "Undertone Camera",
    "Wall Paint Visualizer",
  ];
  const findLabels = [
    "Find Color with Color Wheel",
    "Find Color by Mixing Colors",
    "Find Color by Mood",
    "Back",
  ];
  return (
    <>
      <Logo
        style={{
          position: "absolute",
          bottom: "7%",
          right: "5%",
          width: sizeMod * 0.2,
          height: sizeMod * 0.2,
        }}
      />
      <FanMenu
        startHue={220}
        endHue={350}
        startAngle={-40}
        endAngle={40}
        innerRadius={sizeMod * 0.3}
        width={sizeMod * 0.8}
        style={{
          position: "absolute",
          top: "48%",
          right: -sizeMod * 0.2,
        }}
        direction={-1}
        onPresses={getPages()}
        labels={labels}
        gap={0}
        sectors={4}
        satRange={[75, 75]}
        litRange={[40, 90]}
        textStyles={{
          fontSize: 22 * fontMod,
          color: "white",
          fontWeight: "bold",
          textAlign: "center",
        }}
        lock={isPremium ? [] : [5, 6]}
      />
    </>
  );
}
