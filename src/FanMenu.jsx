import ButtonSector from "./ButtonSector";
import React, { useEffect } from "react";
import { View, TouchableOpacity, PanResponder, Dimensions } from "react-native";
export default function FanMenu({
  startHue,
  endHue,
  startAngle,
  endAngle,
  innerRadius,
  width,
  style,
  direction,
  onPresses,
  labels,
  gap = 0,
  textStyles,
  lock = [],
}) {
  const refPoint = {
    x: Dimensions.get("window").width,
    y: Dimensions.get("window").height / 2,
  };

  const [selected, setSelected] = React.useState(0);
  const [angleRanges, setAngleRanges] = React.useState([]);
  function sizeBoost(index, base = 1, selectBonus = 0.25, lockBonus = 0.5) {
    let size = base;
    if (index === selected) {
      size += selectBonus;
    }
    if (lock.length === 0) return size;
    if (lock.includes(index)) {
      size = base;
    } else {
      size += lockBonus;
    }
    return size;
  }
  function lockOffset(index) {
    if (lock.length === 0) return index;
    if (lock[1] === index) {
      return 1.5 * index;
    } else {
      return 1.5 * index + 0.5;
    }
  }
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (e, gestureState) => {
      let sector = calculateSector(e);
      try {
        setSelected(sector);
      } catch (error) {}
    },
    onPanResponderMove: (e, gestureState) => {
      let sector = calculateSector(e);
      try {
        setSelected(sector);
        console.log(sector);
      } catch (error) {
        setSelected(-1);
      }
    },
    onPanResponderRelease: (e, gestureState) => {
      let sector = calculateSector(e);
      if (sector >= 0) {
        console.log(onPresses[sector]);
        onPresses[sector]();
        setSelected(-1);
      } else {
        setSelected(-1);
      }
    },
  });
  useEffect(() => {
    let angleStep = (endAngle - startAngle) / (labels.length - 1);
    let ranges = [];
    for (let i = 1; i < labels.length + 1; i++) {
      ranges.push(trueStartAngle + angleStep * lockOffset(i - 1));
    }
    setAngleRanges(ranges);
  }, [labels]);

  let trueStartAngle = startAngle;
  let trueEndAngle = endAngle;
  function getSectors() {
    let sectors = [];
    let hueStep = (endHue - startHue) / labels.length;
    let angleStep =
      (trueEndAngle - trueStartAngle) / (labels.length + lock.length);
    trueStartAngle -= (gap * labels.length) / 2;
    for (let i = 0; i < labels.length; i++) {
      sectors.push(
        <ButtonSector
          key={labels[i]}
          hue={startHue + hueStep * i}
          angle={angleStep * sizeBoost(i)}
          startRotation={-90}
          endRotation={trueStartAngle + angleStep * lockOffset(i)}
          outerRadius={innerRadius + width * sizeBoost(i, 1, 0.15, 0)}
          innerRadius={innerRadius * sizeBoost(i, 1, -0.1, 0)}
          label={labels[i]}
          direction={direction}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: i === selected ? 10 : i,
            shadowColor: i === selected ? "#000000" : "transparent",
            shadowOffset: {
              width: 0,
              height: 3 - i,
            },
            shadowOpacity: 0.25,
          }}
          textStyles={{ ...textStyles }}
          strokeWidth={0}
          sectors={4}
          lock={lock.includes(i)}
        />
      );
    }

    return sectors;
  }
  function calculateSector(event) {
    let x = event.nativeEvent.pageX;
    x = refPoint.x - x;
    let y = event.nativeEvent.pageY;
    y -= refPoint.y;
    let angle = Math.atan2(y, x) * (180 / Math.PI);
    let sector = -1;
    for (let i = 0; i < angleRanges.length; i++) {
      if (angleRanges[i] >= angle) {
        sector = i;
        break;
      }
    }
    console.log(sector);
    if (sector == -1) sector = labels.length - 1;
    if (sector < 0) sector = -1;
    if (sector > labels.length) sector = labels.length;

    return sector;
  }

  return (
    <View
      style={{
        ...style,
      }}
      {...panResponder.panHandlers}
    >
      {getSectors()}
    </View>
  );
}
