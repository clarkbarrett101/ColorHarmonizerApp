import React, { useState, useEffect } from "react";
import { View, Dimensions, TouchableOpacity, Text } from "react-native";
import masterList from "./masterList.mjs";
import DragMenu from "./DragMenu";
import ColorSearch from "./ColorSearch";
import SwatchBook from "./SwatchBook";
import ColorMixer from "./ColorMixer";
import Harmonizer from "./Harmonizer";
import ColorSeasons from "./ColorSeasons";
import WallSwapper from "./WallSwapper";
import ChromaCamera from "./ChromaCamera";
import Home from "./Home";
import ViewPallete from "./ViewPallete";
export default function Driver() {
  let testList = [masterList[Math.floor(Math.random() * masterList.length)]];
  testList.push(masterList[Math.floor(Math.random() * masterList.length)]);
  testList.push(masterList[Math.floor(Math.random() * masterList.length)]);
  const [swatches, setSwatches] = useState(testList);
  const [currentPage, setCurrentPage] = useState(0);
  const [assignedColor, setAssignedColor] = useState(null);
  const [assignedColor2, setAssignedColor2] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [canScroll, setCanScroll] = useState(true);
  const pages = [
    "Home",
    "Harmonizer",
    "Color Mixer",
    "Color Sliders",
    "Color Seasons",
    "Undertone Camera",
    "Wall Paint Visualizer",
    "My Palette",
    "Saved Palettes",
  ];
  const dropTop = (2 * Dimensions.get("window").height) / 7;
  const dropMid = (3 * Dimensions.get("window").height) / 7 + dropTop;
  const dropBot = (2 * Dimensions.get("window").height) / 7 + dropMid + dropTop;
  function onDrop(screenPosition, paintColor, isSaved) {
    console.log(screenPosition, paintColor.name, isSaved);
    setIsDragging(false);
    setCanScroll(true);
    if (screenPosition.y < dropTop) {
      if (isSaved) {
        console.log("remove color");
        removeColor(paintColor);
      }
    } else if (screenPosition.y < dropMid) {
      if (isSaved) {
        console.log("use color");
        useColor(paintColor);
      }
    } else if (screenPosition.y < dropBot) {
      if (!isSaved) {
        console.log("add color");
        addColor(paintColor);
      }
    }
  }
  function removeColor(color) {
    let newSwatches = swatches.filter((swatch) => swatch !== color);
    setSwatches(newSwatches);
  }
  function addColor(color) {
    let newSwatches = [...swatches, color];
    setSwatches(newSwatches);
  }
  function useColor(color) {
    setAssignedColor(color);
  }
  function startDrag(paintColor, isSaved) {
    setIsDragging(true);
    setIsSaved(isSaved);
    setCanScroll(false);
  }
  function getPage() {
    if (currentPage === 0) {
      return <Home pages={pages} setCurrentPage={setCurrentPage} />;
    } else if (currentPage === 3) {
      return (
        <ColorSearch
          assignedColor={assignedColor}
          isDragging={isDragging}
          startDrag={startDrag}
          onDrop={onDrop}
        />
      );
    } else if (currentPage === 1) {
      return (
        <Harmonizer
          assignedColor={assignedColor}
          assignedColor2={assignedColor2}
          onDrop={onDrop}
          isDragging={isDragging}
          startDrag={startDrag}
          canScroll={canScroll}
          setCanScroll={setCanScroll}
        />
      );
    } else if (currentPage === 4) {
      return <ColorSeasons />;
    } else if (currentPage === 2) {
      return (
        <ColorMixer
          assignedColor={assignedColor}
          isDragging={isDragging}
          startDrag={startDrag}
          onDrop={onDrop}
        />
      );
    } else if (currentPage === 6) {
      return <WallSwapper assignedColor={assignedColor} />;
    } else if (currentPage === 5) {
      return (
        <ChromaCamera
          setAssignedColor={setAssignedColor}
          setAssignedColor2={setAssignedColor2}
          setCurrentPage={setCurrentPage}
        />
      );
    } else if (currentPage === 7) {
      return <ViewPallete paints={swatches} />;
    } else if (currentPage === 8) {
      return <Text>You currently have no saved palettes</Text>;
    }
  }

  return (
    <View style={{ flex: 1, display: "flex" }}>
      <TouchableOpacity
        style={{
          backgroundColor: "rgba(0, 125, 255, 1)",
          padding: 10,
          width: "100%",
          height: "5%",
          justifyContent: "center",
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          position: "absolute",
          top: 45,
        }}
        onPress={() => setCurrentPage(0)}
      >
        <Text
          style={{
            textAlign: "center",
            color: "white",
            fontSize: 20,
            bottom: 0,
          }}
        >
          Home
        </Text>
      </TouchableOpacity>

      {isDragging ? <DragMenu isSaved={isSaved} /> : null}
      <View
        style={{
          height: "90%",
          display: "flex",
          top: "10%",
        }}
      >
        {getPage()}
      </View>
      <SwatchBook
        swatches={swatches}
        onDrop={onDrop}
        isDragging={isDragging}
        startDrag={startDrag}
        style={{
          display: "flex",
          height: isDragging ? "100%" : "auto",
          width: isDragging ? "100%" : "auto",
          position: "absolute",
        }}
      />
    </View>
  );
}
