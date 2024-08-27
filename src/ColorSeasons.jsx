import masterList from "./masterList";
import React, { useState, useEffect } from "react";
import PaintSector from "./PaintSector";
import MixerCapsule from "./MixerCapsule";
import SeasonSector from "./SeasonSector";
import { View, Dimensions, PanResponder } from "react-native";
export default function ColorSeasons({
  assignedColor = null,
  isDragging,
  startDrag,
  setChipPosition,
  chipPosition,
  onDrop,
}) {
  const stepRate = 5;
  const [mainColor, setMainColor] = useState(
    masterList[Math.floor(Math.random() * masterList.length)]
  );
  const [autumn, setAutumn] = useState(getPlusAutumn());
  const [winter, setWinter] = useState(getPlusWinter());
  const [spring, setSpring] = useState(getPlusSpring());
  const [summer, setSummer] = useState(getPlusSummer());
  const [allColors, setAllColors] = useState([]);
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const [sectorAngles, setSectorAngles] = useState([0, 60, 120, 180, 240, 300]);
  const [selectedSector, setSelectedSector] = useState(null);
  const angleRange = [-75, 75];
  const angleStep = (angleRange[1] - angleRange[0]) / 4;
  const innerRadius = screenWidth * 0.4;
  const outerRadius = screenWidth * 0.92;
  const outerRing = screenWidth;
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
    console.log("summer" + diffList.length);
    if (diffList.length < 1) {
      return mainColor;
    } else if (diffList.length < stepRate) {
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
    console.log("Autumn" + diffList.length);
    console.log(stepRate);
    if (diffList.length < 1) {
      return mainColor;
    } else if (diffList.length < stepRate) {
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
    console.log("winter", diffList.length);
    if (diffList.length < 1) {
      return mainColor;
    } else if (diffList.length < stepRate) {
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
    console.log("Spring" + diffList.length);

    if (diffList.length < 1) {
      return mainColor;
    } else if (diffList.length < stepRate) {
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
            fontSize: 16,
            color: "black",
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
            fontSize: 16,
            color: "black",
          }}
          label={i === selectedSector ? "" : labels[i]}
        />
      );
    }
    return sectors;
  }
  try {
    return (
      <View
        style={{
          top: "40%",
          right: "-5%",
          position: "absolute",
          backgroundColor: "white",
          shadowColor: "black",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.5,
          shadowRadius: 5,
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
        <MixerCapsule
          paint={mainColor}
          startRotation={30}
          endRotation={0}
          isDragging={isDragging}
          onDragStart={startDrag}
          onDrop={onDrop}
          isSaved={false}
          setChipPosition={setChipPosition}
          chipPosition={chipPosition}
          width={screenWidth * 0.4}
          radiusOffset={0}
          direction={1}
          position={[-screenWidth * 0.4, -screenWidth * 0.1]}
        />
      </View>
    );
  } catch (error) {
    setMainColor(masterList[Math.floor(Math.random() * masterList.length)]);
    return null;
  }
}
