import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  PanResponder,
  Dimensions,
  TouchableWithoutFeedback,
  Text,
  ScrollView,
  SafeAreaView,
  Button,
  Image,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import ColorCircle from "./ColorCircle";
import { LinearGradient } from "expo-linear-gradient";
import RGB from "./RGB";
import RYB from "./RYB";

const numSections = 24;
const wheel = [
  0, 0, 15, 8, 30, 17, 45, 26, 60, 34, 75, 41, 90, 48, 105, 54, 120, 60, 135,
  81, 150, 103, 165, 123, 180, 138, 195, 155, 210, 171, 225, 187, 240, 204, 255,
  219, 270, 234, 285, 251, 300, 267, 315, 282, 330, 298, 345, 329, 360, 360,
];

const MyCanvas = () => {
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

  useEffect(() => {
    drawSections();
  }, [colorA, colorB, rgb]);
  useEffect(() => {
    ColorSwap();
  }, [rgb]);

  const drawSections = () => {
    console.log(rgb);
    let sections = [];
    for (let i = 0; i < numSections; i++) {
      sections.push(drawSection(i));
    }

    return sections;
  };
  const drawSection = (index) => {
    let crad = radius;
    let stroke = "#0000";
    if (hoveredSection !== null && index === hoveredSection) {
      crad = radius * 1.5;
    }
    if (colorA === index || colorB === index) {
      crad = radius * 1.5;
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

  function getColorForSection(index) {
    if (index == -1) {
      return "grey";
    }
    if (index > numSections) {
      index = index - numSections;
    }
    if (rgb) {
      return "hsl(" + index * (360 / numSections) + ", 100%, 50% )";
    } else {
      return "hsl(" + rgbHueOf((index * 360) / numSections) + ", 100%, 50% )";
    }
  }
  function getBackgroundColor(index) {
    if (index == -1) {
      return "grey";
    }
    console.log(rgb, index);
    if (rgb) {
      return "hsl(" + index * (360 / numSections) + ", 100%, 75% )";
    } else {
      return "hsl(" + rgbHueOf((index * 360) / numSections) + ", 100%, 75% )";
    }
  }

  const handleTouch = (event) => {
    const { locationX, locationY } = event.nativeEvent;
    setHoveredSection(getSectionForTouch(locationX, locationY));
  };
  function getSectionForTouch(x, y) {
    const angle = Math.atan2(y - centerY, x - centerX);
    let section = Math.floor((angle * numSections) / (2 * Math.PI));
    if (section < 0) {
      section += numSections;
    }
    return section;
  }
  const handleTouchStart = (event) => {
    handleTouch(event);
  };

  const handleTouchMove = (event) => {
    handleTouch(event);
  };

  const handleTouchEnd = () => {
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
      complementary.push(ColorCircle([colorA, colorB]));
      tetradic.push(
        ColorCircle([
          colorA,
          colorB,
          colorA + numSections / 4,
          colorB + numSections / 4,
        ])
      );
      doubleSplitComplementary.push(
        ColorCircle([
          colorA,
          colorB,
          colorA + numSections * 0.08,
          colorB + numSections * 0.08,
        ])
      );
      doubleSplitComplementary.push(
        ColorCircle([
          colorA,
          colorB,
          colorA - numSections * 0.08,
          colorB - numSections * 0.08,
        ])
      );
    } else {
      if (diff < 28 && diff > 20) {
        tetradic.push(
          ColorCircle([
            colorA,
            colorB,
            invertColor(colorA),
            invertColor(colorB),
          ])
        );
      } else {
        doubleSplitComplementary.push(
          ColorCircle([
            colorA,
            colorB,
            invertColor(colorA),
            invertColor(colorB),
          ])
        );
      }
      if (diff < 40 && diff > 28) {
        triadic.push(ColorCircle([colorA, colorB, invertColor(middle)]));
      }
      if (diff <= 30) {
        analogous.push(ColorCircle([colorA, colorB, middle]));
        if (diff <= 28) {
          splitComplementary.push(
            ColorCircle([colorB, colorA, invertColor(middle)])
          );
          if (diff < 15) {
            analogous.push(
              ColorCircle([colorA, colorB, middle + 1.5 * different])
            );
            analogous.push(
              ColorCircle([colorA, colorB, middle - 1.5 * different])
            );
          }
        }
      } else if (diff > 40) {
        splitComplementary.push(
          ColorCircle([
            colorA,
            colorB,
            loopSide ? colorB + 2 * different : colorB - 2 * different,
          ])
        );
        splitComplementary.push(
          ColorCircle([
            colorA,
            colorB,
            loopSide ? colorA - 2 * different : colorA + 2 * different,
          ])
        );
      }
    }
    let output = [];
    if (complementary.length > 0) {
      output.push(
        <View key={"compbox"} style={styles.boxes}>
          <Image style={styles.icon} source={require("./assets/comp.png")} />
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
            source={require("./assets/analogous.png")}
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
          <Image style={styles.icon} source={require("./assets/split.png")} />
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
          <Image style={styles.icon} source={require("./assets/tri.png")} />
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
          <Image style={styles.icon} source={require("./assets/double.png")} />
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
          <Image style={styles.icon} source={require("./assets/tetra.png")} />
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
  function ColorSwap() {
    if (rgb) {
      return <RGB rgb={rgb} setRgb={setRgb} />;
    } else {
      return <RYB rgb={rgb} setRgb={setRgb} />;
    }
  }

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
      <ScrollView>
        <Text style={styles.title}>Color Harmonizer</Text>
        <Text style={styles.bodyText}>
          Select any two colors and get harmonious color combinations that
          include them both. Tap a color again to unselect it.
        </Text>
        <Svg
          style={styles.container}
          width={canvasWidth}
          height={canvasWidth}
          {...panResponder.panHandlers}
        >
          {drawSections()}
        </Svg>
        <>{harmonizeColors()}</>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  button: {
    marginTop: 30,
    marginBottom: -50,
    height: 100,
    width: 100,
    zIndex: 2,
  },
  safeArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "black",
    padding: 40,
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
    flex: 1,
    flexGrow: 2,
    position: "absolute",
    width: "100%",
    height: "120%",
    top: -50,

    // margin: -20,
    zIndex: -1,
  },
  bodyText: {
    fontSize: 20,
    textAlign: "center",
    padding: 10,
    marginBottom: -50,
    zIndex: 1,
  },
  text: {
    fontSize: 20,
    textAlign: "center",
    padding: 10,
  },
  title: {
    fontSize: 30,
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

export { MyCanvas };
