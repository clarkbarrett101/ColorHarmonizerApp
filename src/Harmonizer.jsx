import React, { useEffect, useRef } from "react";
import {
  TouchableOpacity,
  Text,
  PanResponder,
  Dimensions,
  Animated,
  View,
} from "react-native";
import {
  Analogous,
  Complementary,
  DoubleSplitComplementary,
  SplitComplementary,
  Tetradic,
  Triadic,
} from "./CurvedLabel";
import Svg, { G, Path } from "react-native-svg";
import { useState } from "react";
import HarmonizerWheel from "./HarmonizerWheel";
import harmonizeColors from "./Harmonies";
import SectorRow from "./SectorRow";
import HarmonizerFan from "./HarmonizerFan";
import SelectText from "./SelectText";
import SectorPath from "./SectorPath";
import TutorialBox from "./TutorialBox";
import InfoIcon from "./InfoIcon";
export default function Harmonizer({
  assignedColor,
  assignedColor2,
  onDrop,
  isDragging,
  onDragStart,
  chipPosition,
  setChipPosition,
  setAssignedColor,
  setAssignedColor2,
  setSelectedColor,
  selectedColor,
  isPremium,
  setCurrentPage,
}) {
  const totalSectors = 48;
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  let sizeMod = 1;
  if (screenHeight < 2 * screenWidth) {
    sizeMod = screenHeight * 0.6;
  } else {
    sizeMod = screenWidth;
  }
  let fontMod = sizeMod / 400;
  let satRange = [25, 100];
  let litRange = [25, 95];
  const schemesAngleRange = [-90, 90];
  let satDivisions = 3;
  let litDivisions = 6;
  const [stage, setStage] = useState(0);
  const [selected, setSelected] = useState(0);
  const [rotationModifier, setRotationModifier] = useState(0);
  const [extraSelected, setExtraSelected] = useState(-1);
  const [schemeRanges, setSchemeRanges] = useState([]);
  const [currentScheme, setCurrentScheme] = useState([]);
  const [allSchemes, setAllSchemes] = useState([]);
  const [allHSLs, setAllHSLs] = useState([]);
  const [rgbMode, setRgbMode] = useState(true);
  const [harmonyFlags, setHarmonyFlags] = useState({
    analogous: false,
    complementary: false,
    splitComplementary: false,
    triadic: false,
    tetradic: false,
    doubleSplitComplementary: false,
    total: 0,
  });
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (assignedColor) {
      if (assignedColor2) {
        const hsl1 = assignedColor.hsluv;
        const hsl2 = assignedColor2.hsluv;
        console.log("assigned: ", hsl1[0], hsl2[0]);
        setExtraSelected(hsl1[0]);
        setSelected(hsl2[0]);
        setStage(1);
      } else {
        if (extraSelected > -1) {
          let hsl = assignedColor.hsluv;
          setRotationModifier(180 - hsl[0]);
          setStage(1);
        } else {
          let hsl = assignedColor.hsluv;
          setRotationModifier(180 - hsl[0]);
          let currentCenter = hsl[0];
          currentCenter = currentCenter % 360;
          if (currentCenter < 0) {
            currentCenter += 360;
          }
          currentCenter = Math.floor(
            (currentCenter * totalSectors) / totalSectors
          );
          setExtraSelected(currentCenter);
        }
      }
    }
  }, [assignedColor, assignedColor2]);

  useEffect(() => {
    if (assignedColor2) {
      return;
    }
    let currentCenter = rotation2Hue(rotationModifier);
    setSelected(currentCenter);
  }, [rotationModifier]);

  useEffect(() => {
    setSelectedColor([selected, 75, 40]);
  }, [selected]);

  function rotation2Hue(rotation) {
    let currentCenter = 180 - rotationModifier;
    currentCenter = currentCenter % 360;
    if (currentCenter < 0) {
      currentCenter += 360;
    }
    currentCenter = Math.floor((currentCenter * totalSectors) / totalSectors);
    return currentCenter;
  }
  function hue2Rotation(hue) {
    return 180 - hue * (360 / totalSectors);
  }
  useEffect(() => {
    Animated.timing(anim, {
      toValue: extraSelected > -1 ? 1 : 0,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [anim, extraSelected]);
  useEffect(() => {
    if (stage === 0) {
      return;
    } else if (stage === 1) {
      let colorHarmonies = harmonizeColors(
        selected,
        extraSelected,
        totalSectors
      );
      let harmonies = colorHarmonies[0];
      setHarmonyFlags(colorHarmonies[1]);
      setCurrentScheme([selected, extraSelected]);
      setAllSchemes(harmonies);
      let totalColors = harmonies.length - 1;
      for (let i = 0; i < harmonies.length; i++) {
        totalColors += harmonies[i].length;
      }
      const angleStep =
        (schemesAngleRange[1] - schemesAngleRange[0]) / totalColors;
      totalColors = 0;
      let schemeRange = [];
      for (let i = 0; i < harmonies.length; i++) {
        schemeRange.push([
          schemesAngleRange[0] + angleStep * totalColors,
          schemesAngleRange[0] +
            angleStep * (totalColors + harmonies[i].length),
        ]);
        totalColors += harmonies[i].length + 1;
      }
      setSchemeRanges(schemeRange);
    } else if (stage === 2) {
      let startAngle = -75;
      let endAngle = 85;
      let angleStep =
        (endAngle - startAngle) /
        (currentScheme.length * satDivisions + currentScheme.length / 3);
      let schemeRange = [];
      let allColors = [];
      for (let c = 0; c < currentScheme.length; c++) {
        for (let i = 0; i < satDivisions; i++) {
          schemeRange.push([
            startAngle +
              angleStep * (c * satDivisions + i + c / 2) -
              angleStep / 2,
            startAngle +
              angleStep * (c * satDivisions + i + 1 + c / 2) -
              angleStep / 2,
          ]);
        }
        allColors.push([currentScheme[c], 50, 65]);
      }
      setAllHSLs(allColors);
      setSchemeRanges(schemeRange);
    }
  }, [stage]);

  const panResponder = PanResponder.create({
    onStartShouldSetResponder: (evt, gestureState) => !isDragging,
    onStartShouldSetPanResponder: (evt, gestureState) => !isDragging,
    onMoveShouldSetPanResponder: (evt, gestureState) => !isDragging,

    onMoveShouldSetResponder: (evt, gestureState) => !isDragging,
    panResponderTerminationRequest: (evt, gestureState) => true,
    onPanResponderGrant: (evt, gestureState) => {
      console.log("grant");
      if (stage === 1) {
        handleTouchEnd(evt, gestureState);
      }
    },
    onPanResponderMove: (evt, gestureState) => {
      if (stage === 0) {
        setRotationModifier(rotationModifier + -gestureState.dy / 2);
      } else if (stage === 2) {
        getColorTouched(
          screenWidth - evt.nativeEvent.pageX,
          evt.nativeEvent.pageY - screenHeight / 2
        );
      }
    },
    onPanResponderRelease: (evt, gestureState) =>
      handleTouchEnd(evt, gestureState),
    onPanResponderEnd: (evt, gestureState) => handleTouchEnd(evt, gestureState),
    onPanResponderTerminate: (evt, gestureState) => {
      console.log("terminate");
    },
  });
  function handleTouchEnd(evt, gestureState) {
    if (stage === 1) {
      let scheme = getSectorTouched(
        screenWidth - evt.nativeEvent.pageX,
        evt.nativeEvent.pageY - screenHeight / 2
      );

      if (scheme > -1) {
        setCurrentScheme(allSchemes[scheme]);
        setStage(2);
      }
    } else if (stage === 2) {
      getColorTouched(
        screenWidth - evt.nativeEvent.pageX,
        evt.nativeEvent.pageY - screenHeight / 2
      );
    }
  }
  function getSectorTouched(x, y) {
    let distance = Math.sqrt(x * x + y * y);
    if (distance < sizeMod * 0.4 || distance > sizeMod * 0.9) {
      return -1;
    }
    let angle = Math.atan2(y, x) * (180 / Math.PI);
    for (let i = 0; i < schemeRanges.length; i++) {
      if (angle > schemeRanges[i][0] && angle < schemeRanges[i][1]) {
        return i;
      }
    }
    return -1;
  }
  function getColorTouched(x, y) {
    let distance = Math.sqrt(x * x + y * y);

    if (distance < sizeMod * 0.18 || distance > sizeMod * 0.65) {
      return -1;
    }
    distance = (distance - sizeMod * 0.2) / (sizeMod * 0.45);
    let angle = Math.atan2(y, x) * (180 / Math.PI);
    let scheme = -1;
    let sats = 0;
    for (let i = 0; i < schemeRanges.length; i++) {
      if (angle >= schemeRanges[i][0] && angle <= schemeRanges[i][1]) {
        scheme = Math.floor(i / satDivisions);
        sats =
          satRange[0] +
          ((satRange[1] - satRange[0]) / satDivisions) * (i % satDivisions);
      }
    }
    if (scheme === -1) {
      return -1;
    }

    let litAdd = Math.round(distance * litDivisions);

    let litStep = (litRange[1] - litRange[0]) / (litDivisions - 1);
    let lit = litRange[0] + litAdd * litStep;
    let hsl = allHSLs[scheme];

    hsl[1] = sats;
    hsl[2] = lit;
    let hsls = [...allHSLs];
    hsls[scheme] = hsl;
    setAllHSLs([...hsls]);
  }

  function getColorSchemes(
    harmonies,
    startAngle,
    endAngle,
    innerRadius,
    outerRadius
  ) {
    let schemes = [];
    let totalColors = harmonies.length - 1;
    for (let i = 0; i < harmonies.length; i++) {
      totalColors += harmonies[i].length;
    }
    const angleStep = (endAngle - startAngle) / totalColors;
    totalColors = 0;
    for (let i = 0; i < harmonies.length; i++) {
      schemes.push(
        colorScheme(
          harmonies[i],
          startAngle + angleStep * totalColors,
          startAngle + angleStep * (totalColors + harmonies[i].length),
          innerRadius,
          outerRadius
        )
      );
      totalColors += harmonies[i].length + 1;
    }
    return schemes;
  }

  function colorScheme(colors, startAngle, endAngle, innerRadius, outerRadius) {
    let scheme = [];
    const angleStep = (endAngle - startAngle) / colors.length;
    for (let i = 0; i < colors.length; i++) {
      scheme.push(
        <SectorRow
          hue={colors[i]}
          angle={angleStep}
          startRotation={-90}
          endRotation={startAngle + angleStep * (i + 1)}
          outerRadius={outerRadius}
          innerRadius={innerRadius}
          direction={-1}
          style={{
            position: "absolute",
            top: screenHeight / 2,
            left: screenWidth,
            zIndex: 2,
          }}
          sectors={4}
          litRange={[60, 90]}
        />
      );
    }
    return scheme;
  }
  function hueOf(hue) {
    if (rgbMode) {
      return hue;
    } else {
      return rgbHue2RybHue(hue);
    }
  }
  function rgbHue2RybHue(rgbHue) {
    let hue = rgbHue;
    if (hue < 60) {
      // 0-60 => 0-120
      hue *= 2;
    } else if (hue < 120) {
      // 60-120 => 120-180
      hue += 60;
    } else if (hue < 180) {
      // 120-180 => 180-210
      hue = 180 + (hue - 120) / 2;
    } else if (hue < 240) {
      // 180-240 => 210-240
      hue = 210 + (hue - 180) / 2;
    } else if (hue < 300) {
      // 240-300 => 240-330
      hue = 240 + ((hue - 240) / 2) * 3;
    } else if (hue < 360) {
      // 300-360 => 330-360
      hue = 330 + (hue - 300) / 2;
    }
    return hue;
  }
  function rybHue2RgbHue(rybHue) {
    let hue = rybHue;
    if (hue < 120) {
      // 0-120 => 0-60
      hue = hue / 2;
    } else if (hue < 180) {
      // 120-180 => 60-120
      hue = hue - 60;
    } else if (hue < 210) {
      // 180-210 => 120-180
      hue = 120 + (hue - 180) * 2;
    } else if (hue < 240) {
      // 210-240 => 180-240
      hue = 180 + (hue - 210) * 2;
    } else if (hue < 330) {
      // 240-330 => 240-300
      hue = 240 + ((hue - 240) * 2) / 3;
    } else if (hue < 360) {
      // 330-360 => 300-360
      hue = 300 + (hue - 330) * 2;
    }
    return hue;
  }
  function getCurrentColorScheme() {
    if (stage == 0) {
      return;
    }
    const sizeMultiplier = stage === 1 ? 0.3 : 0.18;
    const newLitRange = stage === 1 ? [40, 90] : [20, 70];
    const angleStep = 180 / currentScheme.length;
    let scheme = [];
    for (let i = 0; i < currentScheme.length; i++) {
      scheme.push(
        <SectorRow
          key={i}
          hue={currentScheme[i]}
          angle={angleStep}
          startRotation={-180}
          endRotation={angleStep * (i + 0.5) - 85}
          outerRadius={sizeMod * sizeMultiplier}
          innerRadius={0}
          direction={-1}
          style={{
            position: "absolute",
            top: screenHeight / 2,
            left: screenWidth,
            zIndex: 2,
          }}
          sectors={5}
          litRange={newLitRange}
        />
      );
    }
    return scheme;
  }
  const [tutorialA, setTutorialA] = useState(true);
  const [tutorialB, setTutorialB] = useState(true);
  const [tutorialC, setTutorialC] = useState(true);
  function getTutorials() {
    function getCorrespondingTutorial() {
      if (stage === 0) {
        return [tutorialA, setTutorialA];
      } else if (stage === 1) {
        return [tutorialB, setTutorialB];
      } else if (stage === 2) {
        return [tutorialC, setTutorialC];
      }
    }

    let tutorials = [];
    const tutorialText = [
      "Select any 2 colors to see a which other colors would create a harmonious color scheme.",
      "Select colors by dragging the wheel to choose a color and tapping Select Color Button.",
      "Select a harmonious color scheme to start searching for paint colors.",
      "Select the shade of the color and see a list of paints from different brands.",
      "Drag paint swatches to your palette below to save them.",
    ];
    function getTutorialText() {
      if (stage === 0) {
        return [tutorialText[0], tutorialText[1]];
      } else if (stage === 1) {
        return [tutorialText[2], null];
      } else if (stage === 2) {
        return [tutorialText[3], tutorialText[4]];
      }
    }
    tutorials.push(
      <TutorialBox
        key={0}
        text={getTutorialText()[0]}
        style={{
          position: "absolute",
          top: screenHeight / 7,
          right: screenWidth / 2 - sizeMod * 0.5,
          zIndex: 100,
          width: sizeMod,
          height: sizeMod / 2,
        }}
        width={sizeMod}
        height={sizeMod / 2}
        textStyle={{
          fontSize: 24 * fontMod,
          color: "white",
          textAlign: "center",
          top: 0,
          width: sizeMod,
          height: sizeMod * 0.5,
          padding: sizeMod * 0.1,
          paddingVertical: sizeMod * 0.12,
          zIndex: 100,
          fontFamily: "Outfit",
          position: "absolute",
        }}
        isOpen={getCorrespondingTutorial()[0]}
        setOpen={getCorrespondingTutorial()[1]}
        selectedColor={selectedColor}
      />
    );
    if (stage !== 1) {
      tutorials.push(
        <TutorialBox
          key={1}
          text={getTutorialText()[1]}
          style={{
            position: "absolute",
            top: screenHeight / 2 + sizeMod * 0.1,
            right: screenWidth / 2 - sizeMod * 0.5,
            zIndex: 100,
            width: sizeMod,
            height: sizeMod / 2,
          }}
          width={sizeMod}
          height={sizeMod / 2}
          textStyle={{
            fontSize: 24 * fontMod,
            color: "white",
            textAlign: "center",
            top: 0,
            width: sizeMod,
            height: sizeMod * 0.5,
            padding: sizeMod * 0.1,
            paddingVertical: sizeMod * 0.12,
            zIndex: 100,
            fontFamily: "Outfit",
            position: "absolute",
          }}
          isOpen={getCorrespondingTutorial()[0]}
          setOpen={getCorrespondingTutorial()[1]}
          selectedColor={selectedColor}
        />
      );
    }
    return tutorials;
  }
  function satLitSelector() {
    let startAngle = -90;
    let endAngle = 90;

    let output = [];
    let satStep = (satRange[1] - satRange[0]) / satDivisions;
    let angleStep =
      (endAngle - startAngle) / (currentScheme.length * satDivisions * 1.2);
    for (let c = 0; c < currentScheme.length; c++) {
      for (let i = 0; i < satDivisions; i++) {
        output.push(
          <SectorRow
            key={c * satDivisions + i}
            hue={currentScheme[c]}
            angle={angleStep}
            startRotation={-90}
            endRotation={
              startAngle + angleStep * (c * 1.2 * satDivisions + 1 + i)
            }
            outerRadius={sizeMod * 0.6}
            innerRadius={sizeMod * 0.2}
            direction={-1}
            style={{
              position: "absolute",
              top: screenHeight / 2,
              left: screenWidth,
              zIndex:
                allHSLs[c] && allHSLs[c][1] === satRange[0] + satStep * i
                  ? 2
                  : 0,
            }}
            sectors={litDivisions}
            litRange={[litRange[0], litRange[1]]}
            satRange={[satRange[0] + satStep * i, satRange[0] + satStep * i]}
            hsl={allHSLs[c]}
          />
        );
      }
    }
    return output;
  }
  function getSchemeLabels() {
    let labels = [];
    let angleStep = 180 / harmonyFlags.total;
    let rotation = -angleStep / 2;
    const width = sizeMod * 0.4;
    const height = sizeMod * 0.3;
    const dist = sizeMod * 0.4;
    const style = {
      position: "absolute",
      right: -sizeMod * 0.2,
      top: screenHeight / 2 - sizeMod * 0.15,
      zIndex: 100,
    };

    if (harmonyFlags.analogous) {
      labels.push(
        <Analogous
          width={width}
          height={height}
          style={[
            style,
            {
              transform: [
                { rotate: `${rotation}deg` },
                { translateY: -dist * 0.9 },
              ],
            },
          ]}
        />
      );
      console.log("a" + rotation);
      rotation -= angleStep;
    }

    if (harmonyFlags.complementary) {
      labels.push(
        <Complementary
          width={width}
          height={height}
          style={[
            style,
            {
              transform: [{ rotate: `${rotation}deg` }, { translateY: -dist }],
            },
          ]}
        />
      );
      console.log("c" + rotation);
      rotation -= angleStep;
    }
    if (harmonyFlags.splitComplementary) {
      labels.push(
        <SplitComplementary
          width={width}
          height={height}
          style={[
            style,
            {
              transform: [
                { rotate: `${rotation}deg` },
                { translateY: -dist * 0.95 },
              ],
            },
          ]}
        />
      );
      console.log("sc" + rotation);
      rotation -= angleStep;
    }
    if (harmonyFlags.triadic) {
      labels.push(
        <Triadic
          width={width}
          height={height}
          style={[
            style,
            {
              transform: [{ rotate: `${rotation}deg` }, { translateY: -dist }],
            },
          ]}
        />
      );
      console.log("tri" + rotation);
      rotation -= angleStep;
    }
    if (harmonyFlags.tetradic) {
      labels.push(
        <Tetradic
          width={width}
          height={height}
          style={[
            style,
            {
              transform: [
                { rotate: `${180 + rotation}deg` },
                { translateY: +dist },
              ],
            },
          ]}
        />
      );
      console.log("te" + rotation);
      rotation -= angleStep;
    }
    if (harmonyFlags.doubleSplitComplementary) {
      labels.push(
        <DoubleSplitComplementary
          width={width}
          height={height}
          style={[
            style,
            {
              transform: [
                { rotate: `${180 + rotation}deg` },
                { translateY: +dist },
              ],
            },
          ]}
        />
      );
      console.log("dc" + rotation);
      rotation -= angleStep;
    }
    return labels;
  }

  function getPaintFans() {
    let fans = [];
    let angleStep = 180 / allHSLs.length;
    console.log(allHSLs);
    for (let i = 0; i < allHSLs.length; i++) {
      fans.push(
        <HarmonizerFan
          key={i}
          hsl={[...allHSLs[i]]}
          startAngle={angleStep * i - 90}
          endAngle={angleStep * (i + 1) - 90}
          innerRadius={sizeMod * 0.77}
          outerRadius={sizeMod * 1.1}
          direction={-1}
          isSaved={false}
          isDragging={isDragging}
          onDrop={onDrop}
          onDragStart={onDragStart}
          chipPosition={chipPosition}
          setChipPosition={setChipPosition}
          style={{
            position: "absolute",
            right: -sizeMod * 0.1,
            top: screenHeight / 2 - sizeMod * 0.07,
            zIndex: 4,
          }}
        />
      );
    }
    return fans;
  }

  function getStage() {
    let output = [];

    if (stage === 0) {
      output.push(
        <HarmonizerWheel
          totalSectors={totalSectors}
          innerRadius={sizeMod * 0.36}
          outerRadius={sizeMod * 0.6}
          litRange={[40, 90]}
          subSectors={6}
          rotationModifier={rotationModifier}
          selected={selected}
          setSelected={setSelected}
          extraSelected={extraSelected}
          style={{
            position: "absolute",
            top: screenHeight / 2,
            right: "-5%",
          }}
          hueOf={hueOf}
        />
      );
      output.push(
        <TouchableOpacity
          style={{
            position: "absolute",
            zIndex: 100,
            padding: 10,
            top: screenHeight / 2 - sizeMod * 0.15,
            left: 0,
          }}
          onPressIn={() => {
            if (extraSelected === -1) {
              setExtraSelected(
                hueOf(Math.floor(selected * totalSectors) / totalSectors)
              );
            } else {
              setCurrentScheme([selected, extraSelected]);
              setStage(1);
            }
          }}
        >
          <SelectText
            width={sizeMod * 0.3}
            height={sizeMod * 0.3}
            style={{
              position: "absolute",
              zIndex: 100,
              transform: [{ rotate: "-90deg" }],
            }}
          />
          <Svg
            style={{
              position: "absolute",
              width: sizeMod,
              height: sizeMod,
              zIndex: 0,
              padding: 10,
              top: -sizeMod * 0.35,
              left: sizeMod * 0.09,
            }}
          >
            <G>
              <SectorPath
                startAngle={155}
                endAngle={205}
                innerRadius={sizeMod * 0.4}
                outerRadius={sizeMod / 2}
                hue={selected}
                saturation={100}
                lightness={60}
              />
            </G>
          </Svg>
        </TouchableOpacity>
      );
      output.push(getShortcut());
    } else {
      output.push(getCurrentColorScheme());
      output.push(
        <TouchableOpacity
          style={{
            position: "absolute",
            zIndex: 100,
            padding: 10,
            borderRadius: 100,
            top: screenHeight / 2 - sizeMod * 0.06,
            right: "-7%",
            shadowColor: "black",
            shadowOpacity: 0.3,
            shadowRadius: 3,
            shadowOffset: { width: 0, height: 5 },
            width: sizeMod * 0.2,
            height: sizeMod * 0.2,
          }}
          onPressIn={() => {
            if (stage === 2) {
              setCurrentScheme([selected, extraSelected]);
            } else {
              setExtraSelected(-1);
              setAssignedColor(null);
              setAssignedColor2(null);
            }
            if (stage > 0) {
              setStage(stage - 1);
            }
          }}
        >
          <Svg
            viewBox="0, 0, 200, 400"
            width={sizeMod * 0.2}
            height={sizeMod * 0.2}
            style={{
              left: -sizeMod * 0.05,
              top: -sizeMod * 0.05,
            }}
          >
            <Path
              d="M145.3-.7c6.5,19,13,37.9,19.4,56.9-12.7,3.3-41.4,12.7-65.9,39.1-38.1,41.1-36.5,91.2-36.1,99.7,3.4,69.2,59,106.9,65,110.9,6.6-17.5,13.1-35.1,19.7-52.6,17.8,33.6,35.5,67.3,53.3,100.9-37.6,15.5-75.1,31.1-112.8,46.6,5.8-13.7,11.7-27.5,17.4-41.3-7.6-4.6-100.9-62.3-104.5-167.1C-1.8,118,41.4,67,48.2,59.2,84.3,17.9,127.8,3.9,145.3-.7Z"
              fill="white"
              opacity={0.5}
            />
          </Svg>
        </TouchableOpacity>
      );
      if (stage === 1) {
        output.push(
          getColorSchemes(
            harmonizeColors(selected, extraSelected, totalSectors)[0],
            schemesAngleRange[0],
            schemesAngleRange[1],
            sizeMod * 0.5,
            sizeMod * 1
          )
        );
        output.push(getSchemeLabels());
      } else if (stage === 2) {
        output.push(satLitSelector());
        output.push(getPaintFans());
      }
    }
    output.push(
      <TouchableOpacity
        style={{
          position: "absolute",
          zIndex: 100,
          padding: 10,
          borderRadius: 100,
          top: screenHeight * 0.2 - sizeMod * 0.1,
          left: sizeMod * 0.01,
          width: sizeMod * 0.1,
          height: sizeMod * 0.1,
        }}
        onPressIn={() => {
          if (stage === 0) {
            setTutorialA(true);
          } else if (stage === 1) {
            setTutorialB(true);
          } else if (stage === 2) {
            setTutorialC(true);
          }
        }}
      >
        <InfoIcon
          width={sizeMod * 0.1}
          height={sizeMod * 0.1}
          style={{
            left: -sizeMod * 0.02,
            top: -sizeMod * 0.02,
          }}
          selectedColor={selectedColor}
        />
      </TouchableOpacity>
    );
    output.push(getTutorials());
    return output;
  }
  function getShortcut() {
    return (
      <TouchableOpacity
        style={{
          position: "absolute",
          zIndex: 110,
          padding: 10,
          borderRadius: 100,
          top: "5%",
          right: sizeMod * 0.01,
          backgroundColor: isPremium
            ? `hsl(${selected}, 75%, 40%)`
            : "rgb(125,125,125)",
        }}
        onPressIn={() => {
          console.log(isPremium, setCurrentPage);
          setCurrentPage(6);
        }}
      >
        <Text
          adjustsFontSizeToFit={true}
          numberOfLines={2}
          style={{
            color: "white",
            fontFamily: "Outfit",
            fontSize: 20 * fontMod,
            textAlign: "center",
            padding: sizeMod * 0.01,
          }}
        >{`Undertone\nCamera`}</Text>
      </TouchableOpacity>
    );
  }
  return (
    <View
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,

        position: "absolute",
      }}
      {...panResponder.panHandlers}
    >
      {getStage()}
    </View>
  );
}
