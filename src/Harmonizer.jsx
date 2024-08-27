import React, { useEffect, useRef } from "react";
import {
  TouchableOpacity,
  Text,
  PanResponder,
  Dimensions,
  Animated,
  View,
} from "react-native";
import Svg, { G, Path } from "react-native-svg";
import { useState } from "react";
import HarmonizerWheel from "./HarmonizerWheel";
import harmonizeColors from "./Harmonies";
import SectorRow from "./SectorRow";
import HarmonizerFan from "./HarmonizerFan";
import SelectText from "./SelectText";
import SectorPath from "./SectorPath";
export default function Harmonizer({
  assignedColor,
  assignedColor2,
  onDrop,
  isDragging,
  startDrag,
  canScroll,
  setCanScroll,
  setCurrentPage,
}) {
  const totalSectors = 36;
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
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
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (assignedColor) {
      console.log(assignedColor.hsluv[0], rotationModifier, extraSelected);
      if (extraSelected > -1) {
        let hsl = assignedColor.hsluv;
        setRotationModifier(180 - hsl[0]);
        setStage(1);
      } else {
        let hsl = assignedColor.hsluv;
        setRotationModifier(180 - hsl[0]);
        let currentCenter = -hsl[0];
        currentCenter = currentCenter % 360;
        if (currentCenter < 0) {
          currentCenter += 360;
        }
        currentCenter = Math.floor((currentCenter * totalSectors) / 360);
        setExtraSelected(currentCenter);
      }
    }
  }, [assignedColor]);

  useEffect(() => {
    let currentCenter = 180 - rotationModifier;
    currentCenter = currentCenter % 360;
    if (currentCenter < 0) {
      currentCenter += 360;
    }
    currentCenter = Math.floor((currentCenter * totalSectors) / 360);
    console.log(currentCenter);
    setSelected(currentCenter);
  }, [rotationModifier]);

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
      let harmonies = harmonizeColors(selected, extraSelected);
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
        allColors.push([currentScheme[c] * (360 / totalSectors), 100, 95]);
      }
      setAllHSLs(allColors);
      setSchemeRanges(schemeRange);
    }
  }, [stage]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => true,
    onShouldBlockNativeResponder: (evt, gestureState) => false,
    panResponderTerminationRequest: (evt, gestureState) => true,
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
    if (distance < screenWidth * 0.4 || distance > screenWidth * 0.9) {
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

    if (distance < screenWidth * 0.18 || distance > screenWidth * 0.65) {
      return -1;
    }
    distance = (distance - screenWidth * 0.2) / (screenWidth * 0.45);
    let angle = Math.atan2(y, x) * (180 / Math.PI);
    let scheme = -1;
    let sats = 0;
    for (let i = 0; i < schemeRanges.length; i++) {
      if (angle >= schemeRanges[i][0] && angle <= schemeRanges[i][1]) {
        scheme = Math.floor(i / satDivisions);
        sats =
          satRange[0] +
          ((satRange[1] - satRange[0]) / (satDivisions - 1)) *
            (i % satDivisions);
      }
    }
    if (scheme === -1) {
      return -1;
    }

    let litAdd = Math.round(distance * litDivisions);
    console.log(litAdd);
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
          hue={colors[i] * (360 / totalSectors)}
          angle={angleStep}
          startRotation={-90}
          endRotation={startAngle + angleStep * (i + 1)}
          outerRadius={outerRadius}
          innerRadius={innerRadius}
          direction={-1}
          style={{
            position: "absolute",
            top: screenHeight / 2 - screenWidth * 0.3,
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
          hue={currentScheme[i] * (360 / totalSectors)}
          angle={angleStep}
          startRotation={-180}
          endRotation={angleStep * (i + 0.5) - 85}
          outerRadius={screenWidth * sizeMultiplier}
          innerRadius={0}
          direction={-1}
          style={{
            position: "absolute",
            top: screenHeight / 2 - screenWidth * 0.3,
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
            hue={currentScheme[c] * (360 / totalSectors)}
            angle={angleStep}
            startRotation={-90}
            endRotation={
              startAngle + angleStep * (c * 1.2 * satDivisions + 1 + i)
            }
            outerRadius={screenWidth * 0.6}
            innerRadius={screenWidth * 0.2}
            direction={-1}
            style={{
              position: "absolute",
              top: screenHeight / 2 - screenWidth * 0.3,
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
  function getPaintFans() {
    let fans = [];
    let angleStep = 180 / allHSLs.length;
    for (let i = 0; i < allHSLs.length; i++) {
      fans.push(
        <HarmonizerFan
          key={i}
          hsl={[...allHSLs[i]]}
          startAngle={angleStep * i - 90}
          endAngle={angleStep * (i + 1) - 90}
          innerRadius={screenWidth * 0.77}
          outerRadius={screenWidth * 1.1}
          direction={-1}
          isSaved={false}
          isDragging={isDragging}
          onDrop={onDrop}
          onDragStart={startDrag}
          style={{
            position: "absolute",
            left: screenWidth * 1.1,
            top: screenHeight / 2 - screenWidth * 0.37,
            zIndex: 4,
          }}
        />
      );
    }
    return fans;
  }
  return (
    <View
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,

        position: "absolute",
        width: screenWidth,
        shadowColor: "black",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      }}
      {...panResponder.panHandlers}
    >
      {stage === 0 ? (
        <HarmonizerWheel
          totalSectors={totalSectors}
          innerRadius={screenWidth * 0.3}
          outerRadius={screenWidth * 0.5}
          litRange={[40, 90]}
          subSectors={6}
          rotationModifier={rotationModifier}
          selected={selected}
          setSelected={setSelected}
          extraSelected={extraSelected}
          style={{
            position: "absolute",
            top: screenHeight / 2 - screenWidth * 0.3,
            right: "10%",
          }}
        />
      ) : (
        <TouchableOpacity
          style={{
            position: "absolute",
            zIndex: 100,
            padding: 10,
            borderRadius: 100,
            top: screenHeight / 2 - screenWidth * 0.38,
            right: "-7%",
            shadowColor: "black",
            shadowOpacity: 0.3,
            shadowRadius: 3,
            shadowOffset: { width: 0, height: 5 },
            width: screenWidth * 0.2,
            height: screenWidth * 0.2,
          }}
          onPressIn={() => {
            if (stage === 2) {
              setCurrentScheme([selected, extraSelected]);
            } else {
              setExtraSelected(-1);
            }
            if (stage > 0) {
              setStage(stage - 1);
            }
          }}
        >
          <Svg
            viewBox="0, 0, 200, 400"
            width={screenWidth * 0.2}
            height={screenWidth * 0.2}
            style={{
              left: -screenWidth * 0.05,
              top: -screenWidth * 0.05,
            }}
          >
            <Path
              d="M145.3-.7c6.5,19,13,37.9,19.4,56.9-12.7,3.3-41.4,12.7-65.9,39.1-38.1,41.1-36.5,91.2-36.1,99.7,3.4,69.2,59,106.9,65,110.9,6.6-17.5,13.1-35.1,19.7-52.6,17.8,33.6,35.5,67.3,53.3,100.9-37.6,15.5-75.1,31.1-112.8,46.6,5.8-13.7,11.7-27.5,17.4-41.3-7.6-4.6-100.9-62.3-104.5-167.1C-1.8,118,41.4,67,48.2,59.2,84.3,17.9,127.8,3.9,145.3-.7Z"
              fill="white"
              opacity={0.5}
            />
          </Svg>
        </TouchableOpacity>
      )}
      {getCurrentColorScheme()}
      {stage === 0 ? (
        <TouchableOpacity
          style={{
            position: "absolute",
            zIndex: 100,
            padding: 10,
            top: screenHeight / 2 - screenWidth * 0.47,
            left: screenWidth * 1.03,
          }}
          onPressIn={() => {
            if (extraSelected === -1) {
              setExtraSelected(
                Math.floor(selected * totalSectors) / totalSectors
              );
            } else {
              setCurrentScheme([selected, extraSelected]);
              setStage(1);
            }
          }}
        >
          <SelectText
            width={screenWidth * 0.3}
            height={screenWidth * 0.3}
            style={{
              position: "absolute",
              right: screenWidth * 0.8,
              zIndex: 100,
              transform: [{ rotate: "-90deg" }],
            }}
          />
          <Svg
            style={{
              position: "absolute",
              width: screenWidth * 2,
              height: screenWidth * 2,
              zIndex: 0,
              padding: 10,
              top: -screenWidth * 0.3,
              right: -screenWidth * 0.99,
            }}
          >
            <G>
              <SectorPath
                startAngle={150}
                endAngle={210}
                innerRadius={screenWidth * 0.35}
                outerRadius={screenWidth * 0.45}
                hue={selected * (360 / totalSectors)}
                saturation={100}
                lightness={60}
              />
            </G>
          </Svg>
        </TouchableOpacity>
      ) : null}
      {stage === 2 ? getPaintFans() : null}
      {stage === 1
        ? getColorSchemes(
            harmonizeColors(selected, extraSelected),
            schemesAngleRange[0],
            schemesAngleRange[1],
            screenWidth * 0.4,
            screenWidth * 0.9
          )
        : stage === 2
        ? satLitSelector()
        : null}
    </View>
  );
}
