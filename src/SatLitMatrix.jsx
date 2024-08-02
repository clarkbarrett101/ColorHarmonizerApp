import React from "react";
import {
  View,
  Dimensions,
  PanResponder,
  Text,
  TouchableOpacity,
} from "react-native";
import PaintSort from "./PaintSort";
import { Hsluv } from "./hsluv";
export default function SatLitMatrix({ hue, onDrop, startDrag, setCanScroll }) {
  const [saturation, setSaturation] = React.useState(68);
  const [lightness, setLightness] = React.useState(60);
  const width = Dimensions.get("window").width / 15;
  const fullWidth = Dimensions.get("window").width / 3;
  const fullHeight = width * 8;
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  function getGrid() {
    let grid = [];
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 8; j++) {
        const sat = 20 + i * 16;
        const lit = 10 + (j + 1) * 10;
        const hsluv = new Hsluv();
        hsluv.hsluv_h = hue;
        hsluv.hsluv_s = sat;
        hsluv.hsluv_l = lit;
        hsluv.hsluvToHex();
        grid.push(
          <TouchableOpacity
            onPressIn={() => {
              setSaturation(sat);
              setLightness(lit);
            }}
            key={i * 8 + j}
            style={{
              width: width,
              height: width,
              backgroundColor: hsluv.hex,
              top: (8 - j) * width,
              left: i * width,
              position: "absolute",
              borderColor: "white",
              borderWidth: sat === saturation && lit === lightness ? 2 : 0,
            }}
          ></TouchableOpacity>
        );
      }
    }
    return grid;
  }
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (event, gestureState) => {
      setPan({ x: gestureState.dx + pan.x, y: gestureState.dy + pan.y });

      setSaturation(20 + y * 16);
      setLightness(10 + (8 - x + 1) * 10);
    },
    onPanResponderGrant: (event) => {
      const { locationX, locationY } = event.nativeEvent;
      let x = Math.floor(locationY / width);
      x += 6;
      let y = Math.floor(locationX / width);
      y += 3;
      setSaturation(20 + y * 16);
      setLightness(10 + (8 - x + 1) * 10);
      setCanScroll(false);
    },
    onPanResponderRelease: () => {
      setCanScroll(true);
    },
    onPanResponderTerminate: () => {
      setCanScroll(true);
    },
  });
  return (
    <View style={{ flex: 1, display: "flex", flexDirection: "row" }}>
      <Text style={{ position: "absolute", top: 25 }}>Select a Shade</Text>
      <View
        style={{
          width: width * 5,
          height: width * 8,
          position: "relative",
          marginTop: 20,
        }}
      >
        {getGrid()}
      </View>
      <PaintSort
        hue={hue}
        saturation={saturation}
        lightness={lightness}
        width={(2 * Dimensions.get("window").width) / 3}
        startDrag={startDrag}
        onDrop={onDrop}
      />
    </View>
  );
}
