import masterList from "./masterList";
import React, { useState, useEffect } from "react";
import PaintSector from "./PaintSector";
import MixerCapsule from "./MixerCapsule";
import SeasonSector from "./SeasonSector";
import { TouchableOpacity } from "react-native";
import TutorialBox from "./TutorialBox";
import InfoIcon from "./InfoIcon";
import { View, Dimensions, PanResponder } from "react-native";
import PaintCapsule from "./PaintCapsule";
export default function ColorSeasons({
  assignedColor = null,
  isDragging,
  onDragStart,
  onDrop,
  setSelectedColor,
  selectedColor,
}) {
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const stepRate = 5;
  const [mainColor, setMainColor] = useState(
    masterList[Math.floor(Math.random() * masterList.length)]
  );
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
  const angleStep = (angleRange[1] - angleRange[0]) / 4;

  const outerRadius = sizeMod * 0.88;
  const outerRing = sizeMod * 0.95;
  const [autumn, setAutumn] = useState(getPlusAutumn());
  const [winter, setWinter] = useState(getPlusWinter());
  const [spring, setSpring] = useState(getPlusSpring());
  const [summer, setSummer] = useState(getPlusSummer());
  const [tutorialOpen, setTutorialOpen] = useState(true);
  const [allColors, setAllColors] = useState([]);

  const [sectorAngles, setSectorAngles] = useState([0, 60, 120, 180, 240, 300]);
  const [selectedSector, setSelectedSector] = useState(null);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e, gestureState) => {
      let sector = getTouchedSector(
        screenWidth - e.nativeEvent.pageX,
        e.nativeEvent.pageY - screenHeight / 2
      );
      setSelectedSector(sector);
    },
    onPanResponderMove: (e, gestureState) => {
      let sector = getTouchedSector(
        screenWidth - e.nativeEvent.pageX,
        e.nativeEvent.pageY - screenHeight / 2
      );
      setSelectedSector(sector);
    },
    onPanResponderRelease: (e, gestureState) => {
      let sector = getTouchedSector(
        screenWidth - e.nativeEvent.pageX,
        e.nativeEvent.pageY - screenHeight / 2
      );
      setSelectedSector(null);
      if (sector === -1) {
        return;
      }
      setMainColor(allColors[sector]);
    },
  });
  function getTouchedSector(x, y) {
    let distance = Math.sqrt(x * x + y * y);
    if (distance < innerRadius || distance > outerRing) {
      return -1;
    }
    const angle = (Math.atan2(y, x) * 180) / Math.PI;
    for (let i = 0; i < sectorAngles.length; i++) {
      if (angle >= sectorAngles[i] && angle <= sectorAngles[i + 1]) {
        return i;
      }
    }
    return -1;
  }
  useEffect(() => {
    let angles = [];
    for (let i = 0; i < 6; i++) {
      angles.push(angleRange[0] + i * angleStep);
    }
    setSectorAngles(angles);
  }, [angleStep]);
  useEffect(() => {
    setSpring(getPlusSpring());
    setSummer(getPlusSummer());
    setAutumn(getPlusAutumn());
    setWinter(getPlusWinter());
    setSelectedColor(mainColor.hsluv);
  }, [mainColor]);
  useEffect(() => {
    let colors = [];
    colors.push(spring);
    colors.push(summer);
    colors.push(autumn);
    colors.push(winter);
    setAllColors(colors);
  }, [winter]);
  useEffect(() => {
    if (assignedColor) {
      setMainColor(assignedColor);
    }
  }, [assignedColor]);

  function getPlusSummer() {
    const hue = mainColor.hsluv[0];
    const saturation = mainColor.hsluv[1];
    const lightness = mainColor.hsluv[2];
    let diffList = [];
    for (let i = 0; i < masterList.length; i++) {
      const color = masterList[i];
      if (
        (isUpWarm(hue) && color.hsluv[0] < hue) ||
        (!isUpWarm(hue) && color.hsluv[0] > hue)
      ) {
        continue;
      }
      if (color.hsluv[1] > saturation) {
        continue;
      }
      if (color.hsluv[2] < lightness) {
        continue;
      }
      const hdiff = getHueDiff(color.hsluv[0], hue);
      const sdiff = Math.abs(color.hsluv[1] - saturation);
      const ldiff = Math.abs(color.hsluv[2] - lightness);
      const diff = hdiff + sdiff + ldiff;
      diffList.push({ diff, color });
    }
    diffList.sort((a, b) => a.diff - b.diff);
    if (diffList.length < 1) {
      return mainColor;
    } else if (diffList.length <= stepRate) {
      return diffList[0].color;
    } else {
      return diffList[stepRate].color;
    }
  }
  function getPlusAutumn() {
    const hue = mainColor.hsluv[0];
    const saturation = mainColor.hsluv[1];
    const lightness = mainColor.hsluv[2];
    let diffList = [];
    for (let i = 0; i < masterList.length; i++) {
      const color = masterList[i];
      if (
        (isUpWarm(hue) && color.hsluv[0] < hue) ||
        (!isUpWarm(hue) && color.hsluv[0] > hue)
      ) {
        continue;
      }
      if (color.hsluv[1] > saturation) {
        continue;
      }
      if (color.hsluv[2] > lightness) {
        continue;
      }
      const hdiff = getHueDiff(color.hsluv[0], hue);
      const sdiff = Math.abs(color.hsluv[1] - saturation);
      const ldiff = Math.abs(color.hsluv[2] - lightness);
      const diff = hdiff + sdiff + ldiff;
      diffList.push({ diff, color });
    }
    diffList.sort((a, b) => a.diff - b.diff);
    if (diffList.length < 1) {
      return mainColor;
    } else if (diffList.length <= stepRate) {
      return diffList[0].color;
    } else {
      return diffList[stepRate].color;
    }
  }
  function getPlusWinter() {
    const hue = mainColor.hsluv[0];
    const saturation = mainColor.hsluv[1];
    const lightness = mainColor.hsluv[2];
    let diffList = [];
    for (let i = 0; i < masterList.length; i++) {
      const color = masterList[i];
      if (
        (!isUpWarm(hue) && color.hsluv[0] > hue) ||
        (isUpWarm(hue) && color.hsluv[0] < hue)
      ) {
        continue;
      }
      if (color.hsluv[1] < saturation) {
        continue;
      }
      if (color.hsluv[2] > lightness) {
        continue;
      }
      const hdiff = getHueDiff(color.hsluv[0], hue);
      const sdiff = Math.abs(color.hsluv[1] - saturation);
      const ldiff = Math.abs(color.hsluv[2] - lightness);
      const diff = hdiff + sdiff + ldiff;
      diffList.push({ diff, color });
    }
    diffList.sort((a, b) => a.diff - b.diff);
    if (diffList.length < 1) {
      return mainColor;
    } else if (diffList.length <= stepRate) {
      return diffList[0].color;
    } else {
      return diffList[stepRate].color;
    }
  }
  function getPlusSpring() {
    const hue = mainColor.hsluv[0];
    const saturation = mainColor.hsluv[1];
    const lightness = mainColor.hsluv[2];
    let diffList = [];
    for (let i = 0; i < masterList.length; i++) {
      const color = masterList[i];
      if (
        (!isUpWarm(hue) && color.hsluv[0] > hue) ||
        (isUpWarm(hue) && color.hsluv[0] < hue)
      ) {
        continue;
      }
      if (color.hsluv[1] < saturation) {
        continue;
      }
      if (color.hsluv[2] < lightness) {
        continue;
      }
      const hdiff = getHueDiff(color.hsluv[0], hue);
      const sdiff = Math.abs(color.hsluv[1] - saturation);
      const ldiff = Math.abs(color.hsluv[2] - lightness);
      const diff = hdiff + sdiff + ldiff;
      diffList.push({ diff, color });
    }
    diffList.sort((a, b) => a.diff - b.diff);

    if (diffList.length < 1) {
      return mainColor;
    } else if (diffList.length <= stepRate) {
      return diffList[0].color;
    } else {
      return diffList[stepRate].color;
    }
  }
  function isUpWarm(hue) {
    return hue < 60 || hue >= 240;
  }
  function getHueDiff(hue1, hue2) {
    let diff = Math.abs(hue1 - hue2);
    if (diff > 180) {
      diff = 360 - diff;
    }
    return diff / 2;
  }

  function getSizeModifier(index) {
    if (index === selectedSector) {
      return 1.1;
    } else {
      return 1;
    }
  }

  function getPaintSectors() {
    let sectors = [];

    for (let i = 0; i < allColors.length; i++) {
      sectors.push(
        <PaintSector
          key={i}
          paint={allColors[i]}
          innerRadius={innerRadius}
          outerRadius={outerRadius * getSizeModifier(i)}
          angle={angleStep}
          startRotation={-90}
          endRotation={angleRange[0] + i * angleStep}
          direction={-1}
          textStyles={{
            fontSize: 16 * fontMod,
            color: allColors[i].hsluv[2] > 50 ? "black" : "white",
          }}
        />
      );
    }
    return sectors;
  }
  function getColorSectors() {
    let sectors = [];
    const hueSets = [
      [340, 20, 60, 90],
      [120, 160, 220, 280],
      [20, 50, 80, 110],
      [220, 250, 280, 320],
    ];
    const satSets = [[130], [75], [80, 130, 130, 130], [120]];
    const litSets = [[60, 65, 83, 82], [80], [45], [40, 30, 20, 20]];
    let labels = ["Spring", "Summer", "Autumn", "Winter"];
    for (let i = 0; i < allColors.length; i++) {
      sectors.push(
        <SeasonSector
          key={i}
          hues={hueSets[i]}
          sats={satSets[i]}
          lits={litSets[i]}
          innerRadius={outerRadius * getSizeModifier(i)}
          outerRadius={outerRing * getSizeModifier(i)}
          angle={angleStep}
          startAngle={angleRange[0] + i * angleStep + 90}
          endAngle={angleRange[0] + (i + 1) * angleStep + 90}
          direction={-1}
          textStyles={{
            fontSize: 16 * fontMod,
          }}
          label={i === selectedSector ? "" : labels[i]}
        />
      );
    }
    return sectors;
  }

  return (
    <View
      style={{
        top: "50%",
        right: -sizeMod * 0.1,
        position: "absolute",
        backgroundColor: "white",
      }}
      {...panResponder.panHandlers}
    >
      {getPaintSectors()}
      <PaintSector
        paint={mainColor}
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
        paint={mainColor}
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
          "Pick from a list of paint colors that feel more Spring (Warm & Vibrant), Summer (Cool & Bright), Autumn (Warm & Soft), or Winter (Cool & Deep)."
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
