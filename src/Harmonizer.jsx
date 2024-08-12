import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  PanResponder,
  Dimensions,
  Text,
  ScrollView,
  SafeAreaView,
  Image,
  TouchableOpacity,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import ColorCircle from "./ColorCircle";
import { LinearGradient } from "expo-linear-gradient";
import RGB from "./RGB";
import RYB from "./RYB";
import SatLitMatrix from "./SatLitMatrix";

const numSections = 24;
const wheel = [
  0, 0, 15, 8, 30, 17, 45, 26, 60, 34, 75, 41, 90, 48, 105, 54, 120, 60, 135,
  81, 150, 103, 165, 123, 180, 138, 195, 155, 210, 171, 225, 187, 240, 204, 255,
  219, 270, 234, 285, 251, 300, 267, 315, 282, 330, 298, 345, 329, 360, 360,
];

export default function Harmonizer({
  assignedColor,
  assignedColor2,
  isDragging,
  startDrag,
  onDrop,
  setCanScroll,
  canScroll,
  setCurrentPage,
}) {
  const [rgb, setRgb] = useState(true);
  const [hoveredSection, setHoveredSection] = useState(null);
  const [colorA, setColorA] = useState(-1);
  const [colorB, setColorB] = useState(-1);
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const canvasWidth = Math.min(screenWidth, screenHeight) - 100;
  const radius = canvasWidth / 3;
  const centerX = canvasWidth / 2;
  const centerY = canvasWidth / 2;
  const numSections = 24;
  const [lastAssignedColor, setLastAssignedColor] = useState(null);
  const [colorScheme, setColorScheme] = useState([]);
  const scrollRef = useRef();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    drawSections();
  }, [colorA, colorB, rgb]);
  const drawSections = () => {
    let sections = [];
    for (let i = 0; i < numSections; i++) {
      sections.push(drawSection(i));
    }
    return sections;
  };
  useEffect(() => {
    if (!assignedColor) return;
    if (assignedColor2) {
      setColorA(Math.floor((assignedColor.hsluv[0] / 360) * numSections));
      setColorB(Math.floor((assignedColor2.hsluv[0] / 360) * numSections));
    } else if (assignedColor && !lastAssignedColor) {
      if (colorA === -1) {
        setColorA(Math.floor((assignedColor.hsluv[0] / 360) * numSections));
      } else if (colorB === -1) {
        setColorB(Math.floor((assignedColor.hsluv[0] / 360) * numSections));
      } else {
        setColorA(Math.floor((assignedColor.hsluv[0] / 360) * numSections));
      }
      setLastAssignedColor(assignedColor);
    } else if (assignedColor && lastAssignedColor) {
      setColorA(Math.floor((lastAssignedColor.hsluv[0] / 360) * numSections));
      setColorB(Math.floor((assignedColor.hsluv[0] / 360) * numSections));
    }
    drawSections();
  }, [assignedColor]);
  useEffect(() => {
    drawSections();
    console.log("colorA", colorA);
  }, [colorA, colorB]);

  const drawSection = (index) => {
    let crad = radius;
    let stroke = "#0000";
    if (hoveredSection !== null && index === hoveredSection) {
      crad = radius * 1.25;
    }
    if (colorA === index || colorB === index) {
      crad = radius * 1.25;
      stroke = "#000";
    }
    var startAngle = (index * 2 * Math.PI) / numSections;
    var endAngle = ((index + 1) * 2 * Math.PI) / numSections;
    const pathData = `
      M${centerX} ${centerY} 
      L${centerX + crad * Math.cos(startAngle)} ${
      centerY + crad * Math.sin(startAngle)
    } 
      A${crad} ${crad} 0 ${endAngle - startAngle > Math.PI ? 1 : 0} 1 
      ${centerX + crad * Math.cos(endAngle)} ${
      centerY + crad * Math.sin(endAngle)
    } 
      Z
    `;
    return (
      <Path
        key={index}
        d={pathData}
        fill={getColorForSection(index)}
        stroke={stroke}
      />
    );
  };
  function rgbHueOf(rybHue) {
    try {
      var x0, y0;
      var x1, y1;
      for (var i = 0; i < wheel.length - 2; i += 2) {
        x0 = wheel[i];
        y0 = wheel[i + 1];
        x1 = wheel[i + 2];
        y1 = wheel[i + 3];

        if (rybHue <= x1 && rybHue >= x0) {
          return y0 + ((y1 - y0) * (rybHue - x0)) / (x1 - x0);
        }
      }
    } catch (e) {}
  }
  function rybHueOf(rgbHue) {
    return rybHue2RgbHue(rgbHue);
    try {
      var x0, y0;
      var x1, y1;
      for (var i = 0; i < wheel.length - 2; i += 2) {
        x0 = wheel[i];
        y0 = wheel[i + 1];
        x1 = wheel[i + 2];
        y1 = wheel[i + 3];

        if (rybHue <= y1 && rgbHue >= y0) {
          return x0 + ((x1 - x0) * (rgbHue - y0)) / (y1 - y0);
        }
      }
    } catch (e) {}
  }
  function rgb2Hsl(rgb) {
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    let h, s, l;

    if (max === min) {
      h = 0;
    } else if (max === r) {
      h = ((g - b) / (max - min)) % 6;
    } else if (max === g) {
      h = (b - r) / (max - min) + 2;
    } else {
      h = (r - g) / (max - min) + 4;
    }

    h = Math.round(h * 60);
    if (h < 0) {
      h += 360;
    }

    l = (max + min) / 2;

    if (max === min) {
      s = 0;
    } else if (l <= 0.5) {
      s = (max - min) / (max + min);
    } else {
      s = (max - min) / (2 - max - min);
    }

    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return "hsl(" + h + ", " + s + "%, " + l + "%)";
  }
  function rybHue2RgbHue(hue) {
    if (hue < 60) {
      return hue * 2;
    } else if (hue < 120) {
      return 60 + hue;
    } else if (hue < 180) {
      return 120 + (hue - 180) * 2;
    } else {
      return hue;
    }
  }
  function rgbHue2RybHue(hue) {
    if (hue < 120) {
      return hue / 2;
    } else if (hue < 180) {
      return 60 + hue - 120;
    } else if (hue < 240) {
      return 120 + (hue - 180) * 2;
    } else {
      return hue;
    }
  }
  useEffect(() => {
    if (!open) {
      setOpen(true);
      return;
    }
    if (!rgb) {
      console.log("colorA", rybHueOf(colorA), "colorB", rybHueOf(colorB));
      setColorA(
        (rybHue2RgbHue(colorA * (360 / numSections)) / 360) * numSections
      );
      setColorB(
        (rybHue2RgbHue(colorB * (360 / numSections)) / 360) * numSections
      );
    } else {
      setColorA(
        (rgbHue2RybHue(colorA * (360 / numSections)) / 360) * numSections
      );
      setColorB(
        (rgbHue2RybHue(colorB * (360 / numSections)) / 360) * numSections
      );
    }
  }, [rgb]);
  function rybHueWheel(hue, lightness) {
    let rgb;
    if (hue < 120) {
      rgb = [255, (225 * hue) / 120, 0];
    } else if (hue < 180) {
      rgb = [(255 * (180 - hue)) / 60, 225, (55 * (hue - 120)) / 60];
    } else if (hue < 240) {
      rgb = [25, 25 + (200 * (240 - hue)) / 60, (255 * (hue - 180)) / 60];
    } else if (hue < 300) {
      rgb = [(255 * (hue - 240)) / 120, 25, 255];
    } else {
      rgb = [(255 * (hue - 240)) / 120, 0, (255 * (360 - hue)) / 60];
    }

    return rgb2Hsl(rgb);
  }

  function getColorForSection(index) {
    if (index == -1) {
      return "grey";
    }
    if (index > numSections) {
      index = index - numSections;
    } else if (index < 0) {
      index = index + numSections;
    }
    if (rgb) {
      return "hsl(" + index * (360 / numSections) + ", 100%, 50% )";
    } else {
      return rybHueWheel(index * (360 / numSections), 50);
    }
  }
  function getBackgroundColor(index) {
    if (index == -1) {
      return "grey";
    }
    if (rgb) {
      return "hsl(" + index * (360 / numSections) + ", 100%, 75% )";
    } else {
      return rybHueWheel(index * (360 / numSections), 75);
    }
  }

  const handleTouch = (event) => {
    const { locationX, locationY } = event.nativeEvent;
    setHoveredSection(getSectionForTouch(locationX, locationY));
  };
  function getSectionForTouch(x, y) {
    console.log("x", x, "y", y);
    const angle = Math.atan2(y - centerY, x - centerX);
    let section = Math.floor((angle * numSections) / (2 * Math.PI));
    if (section < 0) {
      section += numSections;
    }
    return section;
  }
  const handleTouchStart = (event) => {
    setCanScroll(false);
    handleTouch(event);
  };

  const handleTouchMove = (event) => {
    handleTouch(event);
  };

  const handleTouchEnd = () => {
    setCanScroll(true);
    if (hoveredSection !== null && colorA === hoveredSection) {
      setColorA(-1);
    } else if (hoveredSection !== null && colorB === hoveredSection) {
      setColorB(-1);
    } else if (hoveredSection !== null && colorA === -1) {
      setColorA(hoveredSection);
    } else if (hoveredSection !== null && colorB === -1) {
      setColorB(hoveredSection);
    }
    setHoveredSection(null);
  };
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: handleTouchStart,
    onPanResponderMove: handleTouchMove,
    onPanResponderRelease: handleTouchEnd,
    onPanResponderTerminate: handleTouchEnd,
  });
  function invertColor(color) {
    return (color + numSections / 2) % numSections;
  }
  function harmonizeColors() {
    if (colorA === -1 || colorB === -1) {
      return;
    }

    let complementary = [];
    let splitComplementary = [];
    let triadic = [];
    let analogous = [];
    let doubleSplitComplementary = [];
    let tetradic = [];

    if (colorA > colorB) {
      let temp = colorA;
      setColorA(colorB);
      setColorB(temp);
    }
    let different = colorB - colorA;
    let middle = (colorA + colorB) / 2;
    let loopSide = false;
    if (colorA + numSections - colorB < different) {
      different = colorA + numSections - colorB;
      middle = (colorA + numSections + colorB) / 2;
      loopSide = true;
    }
    const diff = (100 * different) / numSections;
    if (invertColor(colorA) === colorB) {
      complementary.push(
        <ColorCircle
          setColorScheme={setColorScheme}
          colors={colorCode([colorA, colorB])}
        />
      );
      tetradic.push(
        <ColorCircle
          setColorScheme={setColorScheme}
          colors={colorCode([
            colorA,
            colorB,
            colorA + numSections / 4,
            colorB + numSections / 4,
          ])}
        />
      );
      doubleSplitComplementary.push(
        <ColorCircle
          setColorScheme={setColorScheme}
          colors={colorCode([
            colorA,
            colorB,
            colorA + numSections * 0.08,
            colorB + numSections * 0.08,
          ])}
        />
      );
      doubleSplitComplementary.push(
        <ColorCircle
          setColorScheme={setColorScheme}
          colors={colorCode([
            colorA,
            colorB,
            colorA - numSections * 0.08,
            colorB - numSections * 0.08,
          ])}
        />
      );
    } else {
      if (diff < 28 && diff > 20) {
        tetradic.push(
          <ColorCircle
            setColorScheme={setColorScheme}
            colors={colorCode([
              colorA,
              colorB,
              invertColor(colorA),
              invertColor(colorB),
            ])}
          />
        );
      } else {
        doubleSplitComplementary.push(
          <ColorCircle
            setColorScheme={setColorScheme}
            colors={colorCode([
              colorA,
              colorB,
              invertColor(colorA),
              invertColor(colorB),
            ])}
          />
        );
      }
      if (diff < 40 && diff > 28) {
        triadic.push(
          <ColorCircle
            setColorScheme={setColorScheme}
            colors={colorCode([colorA, colorB, invertColor(middle)])}
          />
        );
      }
      if (diff <= 30) {
        analogous.push(
          <ColorCircle
            setColorScheme={setColorScheme}
            colors={colorCode([colorA, colorB, middle])}
          />
        );
        if (diff <= 28) {
          splitComplementary.push(
            <ColorCircle
              setColorScheme={setColorScheme}
              colors={colorCode([colorB, colorA, invertColor(middle)])}
            />
          );
          if (diff < 15) {
            analogous.push(
              <ColorCircle
                setColorScheme={setColorScheme}
                colors={colorCode([colorA, colorB, middle + 1.5 * different])}
              />
            );
            analogous.push(
              <ColorCircle
                setColorScheme={setColorScheme}
                colors={colorCode([colorA, colorB, middle - 1.5 * different])}
              />
            );
          }
        }
      } else if (diff > 40) {
        splitComplementary.push(
          <ColorCircle
            setColorScheme={setColorScheme}
            colors={colorCode([
              colorA,
              colorB,
              loopSide ? colorB + 2 * different : colorB - 2 * different,
            ])}
          />
        );

        splitComplementary.push(
          <ColorCircle
            setColorScheme={setColorScheme}
            colors={colorCode([
              colorA,
              colorB,
              loopSide ? colorA - 2 * different : colorA + 2 * different,
            ])}
          />
        );
      }
    }
    let output = [];
    output.push(
      <Text key="title" style={styles.text}>
        Select a color scheme to view possible paint colors
      </Text>
    );
    if (complementary.length > 0) {
      output.push(
        <View key={"compbox"} style={styles.boxes}>
          <Image style={styles.icon} source={require("../assets/comp.png")} />
          <Text style={styles.text} key="complementary">
            Complementary
          </Text>
          <View key="comps" style={styles.circle}>
            {complementary}
          </View>
        </View>
      );
    }
    if (analogous.length > 0) {
      output.push(
        <View key={"anBox"} style={styles.boxes}>
          <Image
            style={styles.icon}
            source={require("../assets/analogous.png")}
          />
          <Text style={styles.text} key="analogous">
            Analogous
          </Text>
          <View key="ans" style={styles.circle}>
            {analogous}
          </View>
        </View>
      );
    }
    if (splitComplementary.length > 0) {
      output.push(
        <View key={"spBox"} style={styles.boxes}>
          <Image style={styles.icon} source={require("../assets/split.png")} />
          <Text style={styles.text} key="splitComplementary">
            Split Complementary
          </Text>
          <View key={"sps"} style={styles.circle}>
            {splitComplementary}
          </View>
        </View>
      );
    }
    if (triadic.length > 0) {
      output.push(
        <View key={"triBox"} style={styles.boxes}>
          <Image style={styles.icon} source={require("../assets/tri.png")} />
          <Text style={styles.text} key="triadic">
            Triadic
          </Text>
          <View key={"tris"} style={styles.circle}>
            {triadic}
          </View>
        </View>
      );
    }
    if (doubleSplitComplementary.length > 0) {
      output.push(
        <View key={"dsBox"} style={styles.boxes}>
          <Image style={styles.icon} source={require("../assets/double.png")} />
          <Text style={styles.text} key="doubleSplitComplementary">
            Double Split Complementary
          </Text>
          <View key="dss" style={styles.circle}>
            {doubleSplitComplementary}
          </View>
        </View>
      );
    }
    if (tetradic.length > 0) {
      output.push(
        <View key={"tetBox"} style={styles.boxes}>
          <Image style={styles.icon} source={require("../assets/tetra.png")} />
          <Text style={styles.text} key="tetradic">
            Tetradic
          </Text>
          <View key="tets" style={styles.circle}>
            {tetradic}
          </View>
        </View>
      );
    }
    return (
      <View key="harmonies" style={styles.output}>
        {output}
      </View>
    );
  }
  function colorCode(colors) {
    let codes = [];
    for (let i = 0; i < colors.length; i++) {
      codes.push(getColorForSection(colors[i]));
    }
    return codes;
  }
  function colorSwap() {
    if (rgb) {
      return <RGB style={styles.button} rgb={rgb} setRgb={setRgb} />;
    } else {
      return <RYB style={styles.button} rgb={rgb} setRgb={setRgb} />;
    }
  }
  function getSatLitMatrix() {
    let matrix = [];
    colorScheme.map((color, index) => {
      matrix.push(
        <SatLitMatrix
          key={index}
          hue={hueFromHSLstring(color)}
          onDrop={onDrop}
          startDrag={startDrag}
          setCanScroll={setCanScroll}
        />
      );
    });
    return matrix;
  }
  function hueFromHSLstring(hsl) {
    return hsl.split(",")[0].split("(")[1];
  }
  useEffect(() => {
    if (colorScheme.length > 0) {
      console.log(colorScheme);
      scrollRef.current.scrollToEnd();
    }
  }, [colorScheme]);
  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
        colors={[
          getBackgroundColor(colorA),
          "white",
          getBackgroundColor(colorB),
        ]}
      />
      <ScrollView
        scrollEnabled={canScroll}
        ref={scrollRef}
        contentContainerStyle={{
          paddingBottom: "30%",
        }}
      >
        <TouchableOpacity
          style={{
            backgroundColor: "rgba(0, 125, 255, 1)",
            position: "absolute",
            top: "22%",
            right: 10,
            padding: 5,
            borderRadius: 10,
          }}
          onPress={() => setCurrentPage(5)}
        >
          <Text
            style={{
              textAlign: "center",
              textAlignVertical: "center",
              color: "white",
            }}
          >
            {"Undertone\nCamera"}
          </Text>
        </TouchableOpacity>
        <Text style={styles.bodyText}>
          Select any two colors by tapping them, dragging paints from your
          palette, or using the Undertone Camera, and get harmonious color
          combinations that include them both. Tap a color again to unselect it.
        </Text>
        <Svg
          style={styles.container}
          width={canvasWidth}
          height={canvasWidth}
          {...panResponder.panHandlers}
        >
          {drawSections()}
        </Svg>

        {colorSwap()}

        <>{harmonizeColors()}</>
        {getSatLitMatrix()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: -100,
    left: 10,
    height: 65,
    width: 65,
    zIndex: 2,
  },
  safeArea: {
    flex: 1,
    display: "flex",
  },
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    zIndex: 0,
  },
  circle: {
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  output: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 50,
  },
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  bodyText: {
    fontSize: 16,
    textAlign: "center",
    padding: 10,
    marginBottom: -50,
    zIndex: 1,
  },
  text: {
    fontSize: 16,
    textAlign: "center",
    padding: 10,
  },
  title: {
    fontSize: 24,
    textAlign: "center",
    paddingTop: 50,
  },
  boxes: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 50,
    height: 50,
    marginTop: 10,
  },
});
