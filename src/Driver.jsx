import React, { useState, useEffect } from "react";
import { View, Dimensions, TouchableOpacity, Text } from "react-native";
import masterList from "./masterList.mjs";
import DragMenu from "./DragMenu";
import ColorSearch from "./ColorSearch";
import SwatchBook from "./SwatchBook";
import ColorMixer from "./ColorMixer";
import Harmonizer from "./Harmonizer";
export default function Driver() {
  let testList = [masterList[Math.floor(Math.random() * masterList.length)]];
  testList.push(masterList[Math.floor(Math.random() * masterList.length)]);
  testList.push(masterList[Math.floor(Math.random() * masterList.length)]);
  const [swatches, setSwatches] = useState(testList);
  const [currentPage, setCurrentPage] = useState(0);
  const [assignedColor, setAssignedColor] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [canScroll, setCanScroll] = useState(true);
  const pages = {};
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
          onDrop={onDrop}
          isDragging={isDragging}
          startDrag={startDrag}
          canScroll={canScroll}
          setCanScroll={setCanScroll}
        />
      );
    } else {
      return (
        <ColorMixer
          assignedColor={assignedColor}
          isDragging={isDragging}
          startDrag={startDrag}
          onDrop={onDrop}
        />
      );
    }
  }

  return (
    <View style={{ flex: 1, display: "flex" }}>
      <View
        style={{
          position: "absolute",
          display: "flex",
          flexDirection: "row",
          top: "5%",
          height: "5%",
          width: "100%",
        }}
      >
        <TouchableOpacity
          onPress={() => setCurrentPage(0)}
          style={{
            backgroundColor: "rgba(0, 125, 255, 0.5)",
            padding: 10,
            flex: 1,
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
            borderTopWidth: currentPage === 0 ? 3 : 0,
            borderLeftWidth: currentPage === 0 ? 3 : 0,
            borderRightWidth: currentPage === 0 ? 3 : 0,
            borderBottomWidth: currentPage === 0 ? 0 : 3,
            borderColor: "black",
          }}
        >
          <Text
            style={{
              textAlign: "center",
            }}
          >
            Slider
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setCurrentPage(1)}
          style={{
            backgroundColor: "rgba(0, 125, 255, 0.5)",
            padding: 10,
            flex: 1,
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
            borderTopWidth: currentPage === 1 ? 3 : 0,
            borderLeftWidth: currentPage === 1 ? 3 : 0,
            borderRightWidth: currentPage === 1 ? 3 : 0,
            borderBottomWidth: currentPage === 1 ? 0 : 3,
            borderColor: "black",
          }}
        >
          <Text
            style={{
              textAlign: "center",
            }}
          >
            Harmonizer
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setCurrentPage(2)}
          style={{
            backgroundColor: "rgba(0, 125, 255, 0.5)",
            padding: 10,
            flex: 1,
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
            borderTopWidth: currentPage === 2 ? 3 : 0,
            borderLeftWidth: currentPage === 2 ? 3 : 0,
            borderRightWidth: currentPage === 2 ? 3 : 0,
            borderBottomWidth: currentPage === 2 ? 0 : 3,
            borderColor: "black",
          }}
        >
          <Text
            style={{
              textAlign: "center",
            }}
          >
            Mixer
          </Text>
        </TouchableOpacity>
      </View>
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
