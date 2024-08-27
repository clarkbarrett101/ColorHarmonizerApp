import React, { useState, useEffect, useRef } from "react";
import { View, Dimensions, TouchableOpacity, Text } from "react-native";
import masterList from "./masterList.mjs";
import Svg, {
  RadialGradient,
  Stop,
  Defs,
  Rect,
  Circle,
} from "react-native-svg";
import DragMenu from "./DragMenu";
import { LinearGradient } from "expo-linear-gradient";
import ColorMixer from "./ColorMixer";
import Harmonizer from "./Harmonizer";
import ColorSeasons from "./ColorSeasons";
import WallSwapper from "./WallSwapper";
import ChromaCamera from "./ChromaCamera";
import ColorRadials from "./ColorRadials";
import PaintFan from "./PaintFan";
import Home from "./Home";
import ViewPallete from "./ViewPallete";
export default function Driver() {
  let testList = [masterList[Math.floor(Math.random() * masterList.length)]];
  testList.push(masterList[Math.floor(Math.random() * masterList.length)]);
  testList.push(masterList[Math.floor(Math.random() * masterList.length)]);
  const [swatches, setSwatches] = useState(testList);
  const [currentPage, setCurrentPage] = useState(4);
  const [assignedColor, setAssignedColor] = useState(null);
  const [assignedColor2, setAssignedColor2] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [canScroll, setCanScroll] = useState(true);
  const [draggedColor, setDraggedColor] = useState(null);
  const panResponder = useRef(null);
  const [xy, setXY] = useState([0, 0]);
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
  const screenHeight = Dimensions.get("window").height;
  const screenWidth = Dimensions.get("window").width;
  const [chipPosition, setChipPosition] = useState([0, 0]);
  const dropTop = (2 * screenHeight) / 7;
  const dropMid = (3 * screenHeight) / 7 + dropTop;
  const dropBot = (2 * screenHeight) / 7 + dropMid + dropTop;
  function onDrop(screenPosition, paintColor, isSaved) {
    setIsDragging(false);
    setCanScroll(true);
    if (screenPosition[1] < dropTop) {
      if (isSaved && screenPosition[0] < screenWidth / 2) {
        console.log("remove color");
        removeColor(paintColor);
      }
    } else if (screenPosition[1] < dropMid) {
      if (isSaved && screenPosition[0] > screenWidth / 2) {
        console.log("use color");
        useColor(paintColor);
      }
    } else if (screenPosition[1] < dropBot) {
      if (!isSaved && screenPosition[0] < screenWidth / 2) {
        console.log("add color");
        addColor(paintColor);
      }
    }
  }
  function removeColor(color) {
    let newSwatches = swatches.filter((swatch) => swatch !== color);
    setSwatches([...newSwatches]);
  }
  function addColor(color) {
    let newSwatches = [...swatches, color];
    setSwatches(newSwatches);
  }
  function useColor(color) {
    setAssignedColor(color);
  }
  function startDrag(paintColor, isSaved, xy, panResponder) {
    setXY(xy);
    panResponder = panResponder;
    setIsDragging(true);
    setIsSaved(isSaved);
    setCanScroll(false);
    setDraggedColor(paintColor);
  }

  function getPage() {
    if (currentPage === 0) {
      return <Home pages={pages} setCurrentPage={setCurrentPage} />;
    } else if (currentPage === 3) {
      return (
        <ColorRadials
          onDragStart={startDrag}
          onDrop={onDrop}
          assignedColor={assignedColor}
          chipPosition={chipPosition}
          setChipPosition={setChipPosition}
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
          setCurrentPage={setCurrentPage}
          chipPosition={chipPosition}
          setChipPosition={setChipPosition}
        />
      );
    } else if (currentPage === 4) {
      return (
        <ColorSeasons
          assignedColor={assignedColor}
          isDragging={isDragging}
          startDrag={startDrag}
          onDrop={onDrop}
          chipPosition={chipPosition}
          setChipPosition={setChipPosition}
        />
      );
    } else if (currentPage === 2) {
      return (
        <ColorMixer
          assignedColor={assignedColor}
          isDragging={isDragging}
          startDrag={startDrag}
          onDrop={onDrop}
          chipPosition={chipPosition}
          setChipPosition={setChipPosition}
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

  function chipDistanceFrom(x, y) {
    const dist = Math.sqrt(
      (x - chipPosition[0]) ** 2 + (y - chipPosition[1]) ** 2
    );
    console.log("dist", chipPosition, dist);
    return dist;
  }

  return (
    <View style={{ flex: 1, display: "flex" }}>
      <Svg
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
      >
        <Defs>
          <RadialGradient
            id="grad"
            cx="100%"
            cy="50%"
            rx="120%"
            ry="60%"
            fx="100%"
            fy="50%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor="#fcc" stopOpacity="1" />
            <Stop offset="1" stopColor="#cdF" stopOpacity="1" />
          </RadialGradient>
        </Defs>
        <Rect x="-100%" y="0" width="200%" height="100%" fill="url(#grad)" />
      </Svg>
      {isDragging && !isSaved ? (
        <PaintFan
          colors={swatches}
          startAngle={15}
          endAngle={90}
          innerRadius={50}
          outerRadius={Dimensions.get("window").width * 0.5}
          direction={1}
          onDrop={onDrop}
          onDragStart={startDrag}
          isSaved={true}
          isDragging={isDragging}
          style={{
            position: "absolute",
            bottom: "10%",
            left: "-10%",
          }}
          chipPosition={chipPosition}
          setChipPosition={setChipPosition}
        />
      ) : null}

      <View
        style={{
          display: "flex",
          width: "100%",
          top: 45,
          height: "10%",
        }}
      >
        {currentPage === 0 ? null : (
          <TouchableOpacity
            style={{
              backgroundColor: "rgba(0, 125, 255, 1)",
              padding: 10,
              width: "20%",
              justifyContent: "center",
              borderRadius: 10,
            }}
            onPress={() => setCurrentPage(0)}
          >
            <Text
              style={{
                textAlign: "center",
                color: "white",
                fontSize: 16,
                bottom: 0,
              }}
            >
              Home
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View
        style={{
          height: "90%",
          display: "flex",
          top: "5%",
        }}
      >
        {getPage()}
      </View>
      {isDragging ? (
        <Svg
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
          }}
        >
          <Defs>
            <RadialGradient
              id="grad"
              cx="50%"
              cy="50%"
              rx="100%"
              ry="100%"
              fx="50%"
              fy="50%"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor="#42a" stopOpacity="0" />
              <Stop offset="1" stopColor="#42a" stopOpacity=".75" />
            </RadialGradient>
          </Defs>
          <Rect x="-100%" y="0" width="200%" height="100%" fill="url(#grad)" />

          {isSaved ? (
            <Circle
              cx={screenWidth - 50}
              cy={screenHeight / 2 - 50}
              fill={"url(#grad)"}
              r={Math.min(
                Math.max(
                  30000 / chipDistanceFrom(screenWidth, -screenHeight / 2),
                  50
                ),
                200
              )}
            />
          ) : null}
          {isSaved ? (
            <Circle
              cx={50}
              cy={50}
              fill={"url(#grad)"}
              r={Math.min(
                Math.max(30000 / chipDistanceFrom(0, -screenHeight), 50),
                200
              )}
            />
          ) : (
            <Circle
              cx={50}
              cy={screenHeight - 50}
              fill={"url(#grad)"}
              r={Math.min(
                Math.max(30000 / chipDistanceFrom(0, screenHeight / 2), 50),
                200
              )}
            />
          )}
        </Svg>
      ) : null}

      {!isDragging || isSaved ? (
        <PaintFan
          colors={swatches}
          startAngle={15}
          endAngle={90}
          innerRadius={50}
          outerRadius={Dimensions.get("window").width * 0.5}
          direction={1}
          onDrop={onDrop}
          onDragStart={startDrag}
          isSaved={true}
          isDragging={isDragging}
          style={{
            position: "absolute",
            bottom: "10%",
            left: "-10%",
          }}
          chipPosition={chipPosition}
          setChipPosition={setChipPosition}
        />
      ) : null}
    </View>
  );
}
