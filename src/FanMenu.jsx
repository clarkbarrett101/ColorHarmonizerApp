import ButtonSector from "./ButtonSector";
import React, { useEffect } from "react";
import { View, TouchableOpacity, PanResponder, Dimensions } from "react-native";
import dropShadow from "./dropShadow";
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
}) {
  const refPoint = {
    x: Dimensions.get("window").width,
    y: Dimensions.get("window").height / 2,
  };
  const [selected, setSelected] = React.useState(-1);
  const sizeBoost = 0.5;
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
      } catch (error) {
        setSelected(-1);
      }
    },
    onPanResponderRelease: (e, gestureState) => {
      let sector = calculateSector(e);
      try {
        onPresses[sector + 1]();
      } catch (error) {
        setSelected(-1);
      }
    },
  });

  let trueStartAngle = startAngle - 90;
  let trueEndAngle = endAngle - 90;
  function getSectors() {
    let sectors = [];
    let hueStep = (endHue - startHue) / labels.length;
    let angleStep = (trueEndAngle - trueStartAngle) / labels.length;
    trueStartAngle -= (gap * labels.length) / 2;
    for (let i = 0; i < labels.length; i++) {
      sectors.push(
        <ButtonSector
          key={labels[i]}
          hue={startHue + hueStep * i}
          angle={i === selected ? angleStep * (1 + sizeBoost) : angleStep}
          startRotation={-90}
          endRotation={trueStartAngle + angleStep * i}
          outerRadius={
            innerRadius + width * (i == selected ? 1 + sizeBoost / 4 : 1)
          }
          innerRadius={innerRadius / (i == selected ? 1.5 : 1)}
          label={labels[i]}
          direction={direction}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: i === selected ? 10 : i,
          }}
          textStyles={textStyles}
          strokeWidth={i === selected ? 2 : 0}
          sectors={4}
        />
      );
    }
    return sectors;
  }
  function calculateSector(event) {
    let x = event.nativeEvent.locationX;
    x -= refPoint.x;
    let y = event.nativeEvent.locationY;
    y -= refPoint.y;
    let angle = Math.atan2(y, x) * (180 / Math.PI);
    angle = 90 + angle;
    let sector = Math.floor((angle / (endAngle - startAngle)) * labels.length);
    console.log(sector);
    if (sector < 0) sector = -1;
    if (sector >= labels.length) sector = labels.length;
    return sector - 1;
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
