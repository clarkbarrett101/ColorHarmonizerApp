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

export default function Home({ pages, setCurrentPage }) {
  const width = Dimensions.get("window").width;
  function getPages() {
    let onPresses = [];
    onPresses.push(() => setCurrentPage(0));
    onPresses.push(() => setCurrentPage(1));
    for (let i = 4; i < pages.length; i++) {
      onPresses.push(() => setCurrentPage(i));
    }
    return onPresses;
  }
  const colors = [];
  const labels = [
    "Harmonizer",
    "Find a Paint Color",
    "Undertone Camera",
    "Wall Paint Visualizer",
    "My Palette",
    "Saved Palettes",
  ];
  return (
    <FanMenu
      startHue={270}
      endHue={350}
      startAngle={50}
      endAngle={140}
      innerRadius={100}
      width={width * 0.8}
      style={{
        position: "absolute",
        top: "35%",
        right: "-20%",
      }}
      direction={-1}
      onPresses={getPages()}
      labels={labels}
      gap={0}
      sectors={4}
      satRange={[75, 75]}
      litRange={[40, 90]}
      textStyles={{
        fontSize: 24,
        color: "white",
        fontWeight: "bold",
        textAlign: "center",
      }}
    />
  );
}
