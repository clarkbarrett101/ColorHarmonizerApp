import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  PanResponder,
} from "react-native";
import masterList from "../masterList.mjs";
import MixerSector from "../MixerSector";
import PaintSector from "../components/PaintSector";
import MixerCapsule from "../MixerCapsule";
import TutorialBox from "../components/TutorialBox";
import InfoIcon from "../InfoIcon";
import PaintCapsule from "../PaintCapsule";
export default function ColorMixer({
  assignedColor = null,
  isDragging,
  onDrop,
  onDragStart,
  setSelectedColor,
  selectedColor,
}) {
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  let sizeMod = 1;
  let angleRange = [-75, 75];
  let innerRadius = screenWidth * 0.4;
  if (screenHeight > screenWidth * 2) {
    sizeMod = screenWidth;
  } else {
    sizeMod = screenHeight * 0.65;
    angleRange = [-60, 60];
    innerRadius = sizeMod * 0.37;
  }
  const fontMod = sizeMod / 400;
  const angleStep = (angleRange[1] - angleRange[0]) / 6;

  const outerRadius = sizeMod * 0.88;
  const outerRing = sizeMod * 0.95;
  const [paintColor, setPaintColor] = useState(null);
  const [stepRate, setStepRate] = useState(6);
  const placeholder = {
    name: "placeholder",
    brand: "placeholder",
    rgb: [0, 0, 0],
    ryb: [0, 0, 0],
    luv: [0, 0, 0],
    hsluv: [0, 0, 0],
  };
  const [closestR, setClosestR] = useState(placeholder);
  const [closestB, setClosestB] = useState(placeholder);
  const [closestY, setClosestY] = useState(placeholder);
  const [closestLup, setClosestLup] = useState(placeholder);
  const [closestLdown, setClosestLdown] = useState(placeholder);
  const [closestUV, setClosestUV] = useState(placeholder);
  const [sectorAngles, setSectorAngles] = useState([0, 60, 120, 180, 240, 300]);
  const [selectedSector, setSelectedSector] = useState(null);
  const [tutorialOpen, setTutorialOpen] = useState(true);
  const ml = masterList[Math.floor(Math.random() * masterList.length)];
  useEffect(() => {
    let angles = [];
    const angleStep = (angleRange[1] - angleRange[0]) / 6;
    for (let i = 0; i <= 6; i++) {
      angles.push(angleRange[0] + i * angleStep);
    }
    setSectorAngles(angles);
  }, [selectedSector]);
  function getTouchedSector(x, y) {
    let sector = null;
    const angle = Math.atan2(y, x) * (180 / Math.PI);
    const distance = Math.sqrt(x ** 2 + y ** 2);
    if (distance < innerRadius || distance > outerRadius) {
      return null;
    }
    for (let i = 0; i < 6; i++) {
      if (angle >= sectorAngles[i] && angle <= sectorAngles[i + 1]) {
        sector = i;
      }
    }
    return sector;
  }
  function getSectorColor(sector) {
    switch (sector) {
      case 0:
        return closestR;
      case 1:
        return closestY;
      case 2:
        return closestB;
      case 3:
        return closestLup;
      case 4:
        return closestUV;
      case 5:
        return closestLdown;
      default:
        return null;
    }
  }

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt, gestureState) => {
      if (isDragging) {
        return;
      }
      let sector = getTouchedSector(
        screenWidth - evt.nativeEvent.pageX,
        evt.nativeEvent.pageY - screenHeight / 2
      );
      if (sector >= 0) {
        setSelectedSector(sector);
      }
    },
    onPanResponderMove: (evt, gestureState) => {
      if (isDragging) {
        return;
      }
      let sector = getTouchedSector(
        screenWidth - evt.nativeEvent.pageX,
        evt.nativeEvent.pageY - screenHeight / 2
      );
      if (sector >= 0) {
        setSelectedSector(sector);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (selectedSector !== null) {
        let color = getSectorColor(selectedSector);
        if (color) {
          setPaintColor(color);
        }
      }
      setSelectedSector(null);
    },
    onPanResponderTerminate: (evt, gestureState) => {
      setSelectedSector(null);
    },
  });

  useEffect(() => {
    if (assignedColor) {
      setPaintColor(assignedColor);
    } else {
      setPaintColor(ml);
    }
  }, [assignedColor]);

  function RGBString(color) {
    let rgb = color;
    return "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
  }

  function calculateDiff(color, index) {
    if (index === 0) {
      return color[0] - color[1] - 2 * color[2];
    } else if (index === 1) {
      return color[0] + color[1] - color[2] - Math.abs(color[0] - color[1]) / 2;
    } else {
      return -2 * color[0] - color[1] / 2 + color[2];
    }
  }
  /////////Calculation functions////////////////////////
  function findClosestRYB(ryb, rgb, index, offset = 0) {
    if (!paintColor) {
      return ml;
    }

    let disList = [];
    for (let i = 0; i < masterList.length; i++) {
      let color = masterList[i].ryb;
      if (color[0] == ryb[0] && color[1] == ryb[1] && color[2] == ryb[2]) {
        continue;
      }
      let colorRgb = masterList[i].rgb;
      let diff = color[index];
      let colorRgbDiff = calculateDiff(colorRgb, index);
      let rgbDiff = calculateDiff(rgb, index);
      if (colorRgbDiff > rgbDiff) {
        let dis = Math.abs(colorRgb[0] - rgb[0]);
        dis += Math.abs(colorRgb[1] - rgb[1]);
        dis += Math.abs(colorRgb[2] - rgb[2]);
        disList.push({
          dis: dis,
          paint: masterList[i],
        });
      }
    }
    if (disList.length < 1) {
      return placeholder;
    }
    disList.sort((a, b) => {
      return a.dis - b.dis;
    });
    if (disList.length < stepRate + offset) {
      return disList[disList.length - 1].paint;
    }

    try {
      return disList[stepRate + offset].paint;
    } catch (e) {
      console.log(disList);
    }
  }
  function findClosestLup(hsluv) {
    let luvList = [];
    for (let i = 0; i < masterList.length; i++) {
      let color = masterList[i].hsluv;
      if (color[2] > hsluv[2]) {
        let hDiff = color[0] - hsluv[0];
        hDiff *= 4;
        let sDiff = color[1] - hsluv[1];
        sDiff *= 4;
        let lDiff = color[2] - hsluv[2];
        lDiff /= 2;
        let hsluvDiff = Math.sqrt(hDiff ** 2 + sDiff ** 2 + lDiff ** 2);
        const entry = {
          color: masterList[i],
          diff: hsluvDiff,
        };
        luvList.push(entry);
      }
    }
    if (luvList.length < 1) {
      console.log("No Lup found");
      return placeholder;
    }
    luvList.sort((a, b) => {
      return a.diff - b.diff;
    });
    if (luvList.length < stepRate) {
      return luvList[luvList.length - 1].color;
    }
    try {
      return luvList[stepRate].color;
    } catch (e) {
      return placeholder;
    }
  }
  function findClosestLdown(hsluv) {
    let luvList = [];
    for (let i = 0; i < masterList.length; i++) {
      let color = masterList[i].hsluv;
      if (color[2] < hsluv[2]) {
        let hDiff = color[0] - hsluv[0];
        hDiff *= 3;
        let sDiff = color[1] - hsluv[1];
        sDiff *= 3;
        let lDiff = color[2] - hsluv[2];
        lDiff /= 2;
        let luvDiff = Math.sqrt(hDiff ** 2 + sDiff ** 2 + lDiff ** 2);
        const entry = {
          color: masterList[i],
          diff: luvDiff,
        };
        luvList.push(entry);
      }
    }
    if (luvList.length < 1) {
      console.log("No Ldown found");
      return placeholder;
    }
    luvList.sort((a, b) => {
      return a.diff - b.diff;
    });
    if (luvList.length < stepRate) {
      return luvList[luvList.length - 1].color;
    }
    return luvList[stepRate].color;
  }
  function findClosestUV(hsluv, offset = 0) {
    let luvList = [];
    for (let i = 0; i < masterList.length; i++) {
      let color = masterList[i].hsluv;
      if (color[1] < hsluv[1]) {
        let hDiff = color[0] - hsluv[0];
        let sDiff = color[1] - hsluv[1];
        sDiff /= 2;
        let lDiff = color[2] - hsluv[2];
        lDiff *= 4;
        let luvDiff = Math.sqrt(hDiff ** 2 + sDiff ** 2 + lDiff ** 2);
        const entry = {
          color: masterList[i],
          diff: luvDiff,
        };
        luvList.push(entry);
      }
    }
    if (luvList.length < 1) {
      console.log("No UV found");
      return placeholder;
    }
    luvList.sort((a, b) => {
      return a.diff - b.diff;
    });
    if (luvList.length < stepRate) {
      return luvList[luvList.length - 1].color;
    }
    try {
      return luvList[stepRate].color;
    } catch (e) {
      console.log(luvList);
    }
  }
  /////////On Change of Paint Color////////////////////////
  useEffect(() => {
    if (!paintColor) {
      return;
    }
    setSelectedColor(paintColor.hsluv);
    const red = findClosestRYB(paintColor.ryb, paintColor.rgb, 0);
    let yellow = findClosestRYB(paintColor.ryb, paintColor.rgb, 1);
    try {
      if (red.name === yellow.name) {
        yellow = findClosestRYB(paintColor.ryb, paintColor.rgb, 0, 1);
      }
    } catch (e) {}
    setClosestR(red);
    setClosestY(yellow);
    setClosestB(findClosestRYB(paintColor.ryb, paintColor.rgb, 2));
    const lup = findClosestLup(paintColor.hsluv);
    let uv = findClosestUV(paintColor.hsluv);
    try {
      if (closestLup.name === closestUV.name) {
        uv = findClosestUV(paintColor.hsluv, 1);
      }
    } catch (e) {}
    setClosestUV(uv);
    setClosestLup(lup);
    setClosestLdown(findClosestLdown(paintColor.hsluv));
  }, [paintColor, stepRate]);

  function getSizeModifier(index) {
    if (index === selectedSector) {
      return 1.1;
    } else {
      return 1;
    }
  }
  if (!paintColor) {
    setPaintColor(ml);
  }
  function getPaintSectors() {
    let sectors = [];
    let angleStep = (angleRange[1] - angleRange[0]) / 6;
    let colors = [
      closestR,
      closestY,
      closestB,
      closestLup,
      closestUV,
      closestLdown,
    ];
    for (let i = 0; i < colors.length; i++) {
      sectors.push(
        <PaintSector
          paint={colors[i]}
          innerRadius={innerRadius}
          outerRadius={outerRadius * getSizeModifier(i)}
          angle={angleStep}
          startRotation={-90}
          endRotation={angleRange[0] + i * angleStep}
          direction={-1}
          textStyles={{
            fontSize: 16 * fontMod,
            color: colors[i].hsluv[2] > 50 ? "black" : "white",
          }}
        />
      );
    }
    return sectors;
  }
  function getColorSectors() {
    let sectors = [];
    let angleStep = (angleRange[1] - angleRange[0]) / 6;
    let colors = [
      [10, 100, 50],
      [70, 100, 85],
      [250, 100, 45],
      [0, 0, 100],
      [0, 0, 50],
      [0, 100, 0],
    ];
    const labels = [
      "More Red",
      "More Yellow",
      "More Blue",
      "More White",
      "More Gray",
      "More Black",
    ];
    for (let i = 0; i < colors.length; i++) {
      sectors.push(
        <MixerSector
          key={i}
          hues={[colors[i][0]]}
          sats={[colors[i][1]]}
          lits={[colors[i][2]]}
          innerRadius={outerRadius * getSizeModifier(i)}
          outerRadius={outerRing * getSizeModifier(i)}
          startAngle={angleRange[0] + i * angleStep + 90}
          endAngle={angleRange[0] + (i + 1) * angleStep + 90}
          direction={-1}
          textStyles={{
            fontSize: 16 * fontMod,
            color: "black",
          }}
          label={selectedSector === i ? "" : labels[i]}
        />
      );
    }
    return sectors;
  }
  return (
    <View
      style={{
        top: "51%",
        right: "-10%",
        position: "absolute",
        backgroundColor: "white",
      }}
      {...panResponder.panHandlers}
    >
      {getPaintSectors()}
      <PaintSector
        paint={paintColor}
        innerRadius={0}
        outerRadius={innerRadius}
        angle={180}
        startRotation={-90}
        endRotation={-90}
        direction={-1}
        textStyles={{
          fontSize: 20,
          color: "transparent",
        }}
      />
      {getColorSectors()}

      <PaintCapsule
        paint={paintColor}
        startRotation={30}
        endRotation={0}
        isDragging={isDragging}
        onDragStart={onDragStart}
        onDrop={onDrop}
        isSaved={false}
        width={sizeMod * 0.4}
        radiusOffset={0}
        direction={1}
        position={[-sizeMod * 0.4, -sizeMod * 0.1]}
        xOffset={-sizeMod * 1.4}
      />
      <TutorialBox
        text={
          "Pick from a list of paint colors that have more Red, Blue, Yellow, White, Gray, or Black."
        }
        style={{
          position: "absolute",
          top: -screenHeight / 3,
          right: screenWidth / 2 - sizeMod * 0.4,
          zIndex: 100,
          width: sizeMod,
          height: sizeMod / 2,
        }}
        width={sizeMod}
        height={sizeMod / 2}
        textStyle={{
          fontSize: 20 * fontMod,
          color: "white",
          textAlign: "center",
          top: 0,
          width: sizeMod,
          height: sizeMod * 0.5,
          padding: sizeMod * 0.1,
          paddingVertical: sizeMod * 0.12,
          zIndex: 100,
          fontFamily: "-",
          position: "absolute",
        }}
        isOpen={tutorialOpen}
        setOpen={setTutorialOpen}
        selectedColor={selectedColor}
      />
      <TouchableOpacity
        style={{
          position: "absolute",
          zIndex: 100,
          padding: 10,
          borderRadius: 100,
          top: -screenHeight * 0.37,
          left: -screenWidth * 1.1,
          width: sizeMod * 0.1,
          height: sizeMod * 0.1,
        }}
        onPressIn={() => {
          setTutorialOpen(!tutorialOpen);
        }}
      >
        <InfoIcon
          width={sizeMod * 0.1}
          height={sizeMod * 0.1}
          selectedColor={selectedColor}
        />
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  colorBox: {},
  icons: {
    height: 100,
    width: 100,
    resizeMode: "contain",
  },
});
