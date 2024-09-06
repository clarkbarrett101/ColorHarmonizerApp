import React, { useState, useEffect, useRef } from "react";
import { View, Dimensions, TouchableOpacity, Text } from "react-native";
import Animated, { useSharedValue } from "react-native-reanimated";
import masterList from "./masterList.mjs";
import Svg, {
  RadialGradient,
  Stop,
  Defs,
  Rect,
  Circle,
} from "react-native-svg";
import ColorMixer from "./ColorMixer";
import Harmonizer from "./Harmonizer";
import ColorSeasons from "./ColorSeasons";
import WallSwapper from "./WallSwapper";
import ChromaCamera from "./ChromaCamera";
import ColorRadials from "./ColorRadials";
import PaintFan from "./PaintFan";
import ApplyColorIcon from "./ApplyColorIcon";
import Home from "./Home";
import ViewPallete from "./ViewPallete";
import AddColor from "./AddColor";
import HomeRadialIcon from "./HomeRadialIcon";
import DiscardIcon from "./DiscardIcon";
import TutorialBox from "./TutorialBox";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PayWall from "./PayWall";
export default function Driver({ premium, setPaywall }) {
  let testList = startList;
  const [swatches, setSwatches] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [assignedColor, setAssignedColor] = useState(null);
  const [assignedColor2, setAssignedColor2] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggingColor, setDraggingColor] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedColor, setSelectedColor] = useState([180, 75, 40]);
  const [isPremium, setIsPremium] = useState(true);

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
  const dropTop = (2 * screenHeight) / 7;
  const dropMid = (3.5 * screenHeight) / 7 + dropTop;
  const dropBot = (1.5 * screenHeight) / 7 + dropMid + dropTop;
  let sizeMod = 1;

  useEffect(() => {
    if (assignedColor) {
      setSelectedColor(assignedColor.hsluv);
    }
  }, [assignedColor]);

  if (screenHeight > 2 * screenWidth) {
    sizeMod = screenHeight / 2;
  } else {
    sizeMod = screenWidth;
  }
  let fontMod = sizeMod / 400;
  const shadowProps = () => {
    return {
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 10,
      },
      shadowOpacity: 0.3,
      shadowRadius: 3,
    };
  };
  const getCurrent = async () => {
    try {
      const value = await AsyncStorage.getItem("currentPalette");
      if (value !== null) {
        console.log(value);
        let json = JSON.parse(value);
        if (json.length > 0) {
          return json;
        } else {
          console.log("setting index to 0");
          storeCurrent(testList);
          return testList;
        }
      } else {
        console.log("setting index to 0");
        storeCurrent(testList);
        return testList;
      }
    } catch (e) {
      console.log(e);
      storeCurrent(testList);
      return testList;
    }
  };
  const storeCurrent = async (value) => {
    try {
      const json = JSON.stringify(value);
      await AsyncStorage.setItem("currentPalette", json);
    } catch (e) {
      console.log(e);
    }
  };
  const storeStatus = async (value) => {
    try {
      const json = JSON.stringify(value);
      await AsyncStorage.setItem("isPremium", json);
    } catch (e) {
      console.log(e);
    }
  };
  const getStatus = async () => {
    try {
      const value = await AsyncStorage.getItem("isPremium");
      if (value !== null) {
        console.log(value);
        let json = JSON.parse(value);
        if (json) {
          return json;
        } else {
          return false;
        }
      } else {
        return false;
      }
    } catch (e) {
      console.log(e);
      return false;
    }
  };

  useEffect(() => {
    getCurrent().then((value) => {
      setSwatches(value);
    });
    if (premium) {
      storeStatus(premium);
    } else {
      getStatus().then((value) => {
        setIsPremium(value);
      });
    }
  }, []);
  useEffect(() => {
    storeCurrent(swatches);
  }, [swatches]);
  useEffect(() => {
    console.log("isDragging", isDragging);
  }, [isDragging]);

  function onDrop(screenPosition, paintColor, isSaved) {
    setIsDragging(false);
    if (screenPosition[1] < dropTop) {
      if (isSaved) {
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
    if (swatches.length === 1) {
      setSwatches([]);
      return;
    }
    let newSwatches = swatches.filter((swatch) => swatch.label !== color.label);
    console.log(newSwatches);
    setSwatches([...newSwatches]);
  }
  function addColor(color) {
    console.log(swatches, color);
    let newSwatches = [...swatches, color];
    setSwatches(newSwatches);
  }
  function useColor(color) {
    setAssignedColor(color);
    if (currentPage === 0) {
      setCurrentPage(1);
    }
  }
  function onDragStart(paintColor, isSaved) {
    setDraggingColor(paintColor);
    setIsDragging(true);
    setIsSaved(isSaved);
  }
  function getDragColor(lit) {
    const hsl = draggingColor.hsluv;
    return `hsl(${hsl[0]}, ${60}%, ${lit}%)`;
  }
  const pageProps = {
    assignedColor: assignedColor,
    assignedColor2: assignedColor2,
    onDrop: onDrop,
    isDragging: isDragging,
    onDragStart: onDragStart,
    setAssignedColor: setAssignedColor,
    setAssignedColor2: setAssignedColor2,
    setSelectedColor: setSelectedColor,
    selectedColor: selectedColor,
    setCurrentPage: setCurrentPage,
    isPremium: isPremium,
    assignedColor2: assignedColor2,
    setAssignedColor2: setAssignedColor2,
  };

  function getPage() {
    if (currentPage === 0) {
      return (
        <Home
          pages={pages}
          setCurrentPage={setCurrentPage}
          isPremium={isPremium}
        />
      );
    } else if (currentPage === 3) {
      return <ColorRadials {...pageProps} />;
    } else if (currentPage === 1) {
      return <Harmonizer {...pageProps} />;
    } else if (currentPage === 4) {
      return <ColorSeasons {...pageProps} />;
    } else if (currentPage === 2) {
      return <ColorMixer {...pageProps} />;
    } else if (currentPage === 7) {
      if (isPremium) {
        return <WallSwapper {...pageProps} swatches={swatches} />;
      } else {
        setPaywall(true);
      }
    } else if (currentPage === 6) {
      if (isPremium) {
        return <ChromaCamera {...pageProps} />;
      } else {
        setPaywall(true);
      }
    } else if (currentPage === 5) {
      return <ViewPallete paints={swatches} />;
    }
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

      <View
        style={{
          ...shadowProps(),
          height: "100%",
          width: "100%",
          position: "absolute",
        }}
      >
        {getPage()}
      </View>

      {currentPage === 0 ? null : (
        <TouchableOpacity
          style={{
            padding: 10,
            justifyContent: "center",
            borderRadius: 10,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 5,
            },
            shadowOpacity: 0.3,
            shadowRadius: 3,
            width: screenHeight * 0.1,
            height: screenHeight * 0.1,
            top: screenHeight * 0.05,
            left: 0,
          }}
          onPress={() => {
            setCurrentPage(0);
          }}
        >
          <HomeRadialIcon
            selectedColor={selectedColor}
            height={screenHeight * 0.1}
            width={screenHeight * 0.1}
          />
        </TouchableOpacity>
      )}

      {isDragging ? (
        <Svg
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
          }}
          opacity={isSaved ? 1 : 0.5}
        >
          <Defs>
            <RadialGradient
              id="grad"
              cx="50%"
              cy="50%"
              rx="80%"
              ry="80%"
              fx="50%"
              fy="50%"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor={draggingColor.hex} stopOpacity="0" />
              <Stop
                offset="0.5"
                stopColor={draggingColor.hex}
                stopOpacity=".1"
              />
              <Stop
                offset="1"
                stopColor={draggingColor.hex}
                stopOpacity=".75"
              />
            </RadialGradient>
          </Defs>
          <Rect x="-100%" y="0" width="200%" height="100%" fill="url(#grad)" />
        </Svg>
      ) : null}

      <PaintFan
        colors={swatches}
        startAngle={-90}
        endAngle={0}
        innerRadius={sizeMod * 0.15} // 50
        outerRadius={sizeMod * 0.5}
        direction={1}
        onDrop={onDrop}
        onDragStart={onDragStart}
        isSaved={true}
        isDragging={isDragging}
        style={{
          position: "absolute",
          bottom: "10%",
          left: "-10%",
          zIndex: 100,
          ...shadowProps(),
        }}
      />

      {isSaved && isDragging ? (
        <TutorialBox
          text={"Drag here to remove the paint swatch from your palette."}
          style={{
            position: "absolute",
            top: 30,
            right: 0,
            zIndex: 90,
            width: sizeMod * 0.7,
            height: sizeMod * 0.35,
          }}
          width={sizeMod * 0.7}
          height={sizeMod * 0.35}
          textStyle={{
            fontSize: 16 * fontMod,
            color: draggingColor.hsluv[2] > 50 ? "black" : "white",
            textAlign: "center",
            top: 0,
            width: sizeMod * 0.7,
            height: sizeMod * 0.35,
            padding: sizeMod * 0.1,
            paddingVertical: sizeMod * 0.1,
            zIndex: 90,
            fontFamily: "-",
            position: "absolute",
          }}
          isOpen={isDragging}
          setOpen={setIsDragging}
          close={false}
          selectedColor={draggingColor.hsluv}
        />
      ) : null}
      {isSaved && isDragging && currentPage > 0 ? (
        <TutorialBox
          text={
            "Drag in a paint swatch from your palette to use it as a starting point."
          }
          style={{
            position: "absolute",
            top: screenHeight / 2 - 50,
            right: screenWidth / 2 - sizeMod * 0.25,
            zIndex: 90,
            width: sizeMod * 0.7,
            height: sizeMod * 0.35,
          }}
          width={sizeMod * 0.7}
          height={sizeMod * 0.35}
          textStyle={{
            fontSize: 16 * fontMod,
            color: draggingColor.hsluv[2] > 50 ? "black" : "white",
            textAlign: "center",
            top: 0,
            width: sizeMod * 0.7,
            height: sizeMod * 0.35,
            padding: sizeMod * 0.1,
            paddingVertical: sizeMod * 0.1,
            zIndex: 90,
            fontFamily: "-",
            position: "absolute",
          }}
          isOpen={isDragging}
          setOpen={setIsDragging}
          close={false}
          selectedColor={draggingColor.hsluv}
        />
      ) : null}
      {isSaved && isDragging && currentPage > 0 ? (
        <ApplyColorIcon
          selectedColor={draggingColor.hsluv}
          style={{
            position: "absolute",
            right: 0,
            top: screenHeight / 2 - screenWidth * 0.15,
            shadowColor: getDragColor(85),
            shadowOffset: {
              width: 0,
              height: 5,
            },
            shadowOpacity: 1,
            shadowRadius: 20,
            zIndex: 90,
          }}
          width={sizeMod * 0.3}
          height={sizeMod * 0.3}
        />
      ) : null}
      {isSaved && isDragging ? (
        <DiscardIcon
          selectedColor={draggingColor.hsluv}
          style={{
            position: "absolute",
            top: "5%",
            left: "5%",
            shadowColor: getDragColor(85),
            shadowOffset: {
              width: 0,
              height: 5,
            },
            shadowOpacity: 1,
            shadowRadius: 20,
          }}
          width={sizeMod * 0.25}
          height={sizeMod * 0.25}
        />
      ) : null}
      {!isSaved && isDragging ? (
        <TutorialBox
          text={"Drag paint swatches to your palette to save them."}
          style={{
            position: "absolute",
            bottom: screenHeight / 16,
            right: 0,
            zIndex: 100,
            width: sizeMod / 2,
            height: sizeMod / 4,
          }}
          width={sizeMod / 2}
          height={sizeMod / 4}
          textStyle={{
            fontSize: 16 * fontMod,
            textAlign: "center",
            top: 0,
            width: sizeMod / 2,
            height: sizeMod * 0.25,
            padding: sizeMod * 0.05,
            paddingVertical: sizeMod * 0.05,
            zIndex: 100,
            fontFamily: "-",
            position: "absolute",
          }}
          isOpen={true}
          setOpen={() => {}}
          close={false}
          selectedColor={draggingColor.hsluv}
        />
      ) : null}
      {!isSaved && isDragging ? (
        <AddColor
          width={screenWidth * 0.3}
          height={screenWidth * 0.3}
          style={{
            position: "absolute",
            left: 25,
            bottom: 0,
            zIndex: 100,
            shadowColor: getDragColor(85),
            shadowOffset: {
              width: 0,
              height: 5,
            },
            shadowOpacity: 1,
            shadowRadius: 20,
          }}
          selectedColor={draggingColor.hsluv}
          width={sizeMod * 0.3}
          height={sizeMod * 0.3}
        />
      ) : null}
    </View>
  );
}
const startList = [
  {
    name: "True",
    brand: "Benjamin Moore",
    rgb: [109, 187, 235],
    ryb: [0, 109, 156.5],
    hsluv: [234.81, 72.7, 72.75],
    hex: "#6dbbeb",
    yuv: [169.14999999999998, 32.39399999999999, -52.77000000000001],
    label: "2066-50",
  },
  {
    name: "Seafarer",
    brand: "Valspar",
    rgb: [98, 193, 182],
    ryb: [0, 98, 138.5],
    hsluv: [179.76, 72.3, 72.3],
    hex: "#62c1b6",
    yuv: [163.34099999999998, 9.169000000000011, -57.325],
    label: "5007-10A",
  },
  {
    name: "Icicles",
    brand: "Behr",
    rgb: [188, 213, 219],
    ryb: [0, 188, 122],
    hsluv: [209.51, 21.87, 83.65],
    hex: "#bcd5db",
    yuv: [206.209, 6.290999999999997, -15.975000000000005],
    label: "N490-2",
  },
];
