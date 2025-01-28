import React, { useEffect, useRef, useState } from "react";
import { View, Text, Dimensions, PanResponder, Animated } from "react-native";
import PaintRow from "./PaintRow";
import AsyncStorage from "@react-native-async-storage/async-storage";
import masterList from "./masterList";
import { Svg, Circle, Rect } from "react-native-svg";
export default function PaletteLibrary({
  swatches,
  setSwatches,
  onDragStart,
  onDrop,
  isSaved,
  isDragging,
  setChipPosition,
  chipPosition,
}) {
  const [palettes, setPalettes] = useState([[]]);
  const screenHeight = Dimensions.get("window").height;
  const screenWidth = Dimensions.get("window").width;
  const angleRange = [-75, 60];
  const [currentPalette, setCurrentPalette] = useState(0);
  const [rotationModifier, setRotationModifier] = useState(0);
  const rotationAnim = useRef(new Animated.Value(0)).current;
  let angleStep = 360 / palettes.length;
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => true,
    onPanResponderMove: (evt, gestureState) => {
      let rmod = rotationModifier - gestureState.dy / (screenWidth / 360);
      if (rmod > 0 && rmod > angleStep) {
        let pal = (currentPalette - 1) % palettes.length;
        setCurrentPalette(pal);
        console.log("currentPalette: " + pal);
        setRotationModifier(rmod - angleStep);
      } else if (rmod < 0 && rmod < -angleStep) {
        let pal = (currentPalette + 1) % palettes.length;
        setCurrentPalette(pal);
        setRotationModifier(rmod + angleStep);
        console.log("currentPalette: " + pal);
      } else {
        setRotationModifier(rmod);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      let rmod = Math.round(rotationModifier / angleStep);
      setCurrentPalette((currentPalette + rmod) % palettes.length);
      setRotationModifier(0);
    },
  });

  function fillPalettes(total) {
    let palletes = [];
    for (let i = 0; i < total; i++) {
      let palette = [masterList[Math.floor(Math.random() * masterList.length)]];
      for (let j = 0; j < Math.floor(6 * Math.random()); j++) {
        palette.push(masterList[Math.floor(Math.random() * masterList.length)]);
      }
      palletes.push(palette);
    }
    return palletes;
  }

  const loadPalletes = async () => {
    try {
      const value = await AsyncStorage.getItem("palettes");
      if (value !== null) {
        console.log("data:" + value);
        return JSON.parse(value);
      } else {
        console.log("setting empty data");
        let pal = storePalettes(fillPalettes(12));
        return [pal];
      }
    } catch (e) {
      console.log(e);
    }
  };

  const storePalettes = async (value) => {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem("palettes", jsonValue);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    loadPalletes().then((data) => setPalettes(data));
  }, []);

  function switchPalettes(index) {
    let oldPalette = swatches;
    let newPalette = palettes[index];
    setSwatches(newPalette);
    palettes[index] = oldPalette;
    setPalettes(palettes);
    storePalettes(palettes);
  }
  function getSizeModifier(index) {
    if (index === currentPalette) {
      return 1;
    } else if (index === currentPalette - 1 || index === currentPalette + 1) {
      return 0.25;
    } else {
      return 0;
    }
  }

  function getPalettes() {
    let output = [];
    for (let i = 0; i < palettes.length; i++) {
      output.push(
        <PaintRow
          key={i}
          paints={palettes[i]}
          rotation={angleStep * (currentPalette - i) - rotationModifier}
          innerRadius={screenWidth * (i === currentPalette ? 0.4 : 0.3)}
          outerRadius={screenWidth * (i === currentPalette ? 1.1 : 0.5)}
          width={screenWidth / 4}
          style={{
            position: "absolute",
            top: screenHeight * 0.5,
            left: 0,
          }}
          direction={-1}
          textStyles={{
            fontSize: 12,
            color: "white",
            textAlign: "center",
            flex: 1,
          }}
          onDragStart={onDragStart}
          onDrop={onDrop}
          isSaved={isSaved}
          isDragging={isDragging}
          chipPosition={chipPosition}
          setChipPosition={setChipPosition}
        />
      );
    }
    output.reverse();
    return output;
  }

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 0,
        left: screenWidth * 1.2,
      }}
      {...panResponder.panHandlers}
    >
      <Svg
        style={{
          position: "absolute",
          top: screenWidth * 0.1,
          left: -screenWidth * 1.1,
          width: screenWidth * 2,
          height: screenWidth * 2,
          borderWidth: 1,
        }}
      >
        <Circle
          cx={screenWidth}
          cy={screenWidth}
          r={screenWidth * 0.8}
          fill="gray"
          opacity={0.3}
        />
      </Svg>
      {getPalettes()}
    </Animated.View>
  );
}
