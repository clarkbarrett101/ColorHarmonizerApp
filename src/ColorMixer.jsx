import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  Dimensions,
} from "react-native";
import masterList from "./masterList.mjs";
import PaintChip from "./PaintChip";
export default function ColorMixer({
  assignedColor = null,
  isDragging,
  onDrop,
  startDrag,
}) {
  const maxRYB = [192, 252, 189.5];
  const [paintColor, setPaintColor] = useState(null);
  const [stepRate, setStepRate] = useState(3);
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

  const ml = masterList[Math.floor(Math.random() * masterList.length)];

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
    console.log(
      "PaintColor",
      paintColor.name,
      paintColor.ryb,
      paintColor.hsluv
    );
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

  ///////////Display Functions////////////////////////

  function getYellow() {
    if (closestY.name === placeholder.name) {
      return <View style={styles.colorBox}></View>;
    }
    return (
      <TouchableOpacity
        onPress={() => setPaintColor(closestY)}
        style={{
          ...styles.colorBox,
          backgroundColor: RGBString(closestY.rgb),
          borderColor: "yellow",
          borderTopWidth: 2,
        }}
      >
        <Text>{closestY.name + " (" + closestY.brand + ")"}</Text>
      </TouchableOpacity>
    );
  }
  function getBlue() {
    if (closestB.name === placeholder.name) {
      return <View style={styles.colorBox}></View>;
    }
    return (
      <TouchableOpacity
        onPress={() => setPaintColor(closestB)}
        style={{
          ...styles.colorBox,
          backgroundColor: RGBString(closestB.rgb),
          borderColor: "blue",
          borderTopWidth: 2,
        }}
      >
        <Text>{closestB.name + " (" + closestB.brand + ")"}</Text>
      </TouchableOpacity>
    );
  }
  function getRed() {
    if (closestR.name === placeholder.name) {
      return <View style={styles.colorBox}></View>;
    }
    return (
      <TouchableOpacity
        onPress={() => setPaintColor(closestR)}
        style={{
          ...styles.colorBox,
          backgroundColor: RGBString(closestR.rgb),
          borderColor: "red",
          borderTopWidth: 2,
        }}
      >
        <Text>{closestR.name + " (" + closestR.brand + ")"}</Text>
      </TouchableOpacity>
    );
  }
  function getLightUp() {
    if (closestLup.name === placeholder.name) {
      return <View style={styles.colorBox}></View>;
    }
    return (
      <TouchableOpacity
        onPress={() => setPaintColor(closestLup)}
        style={{
          ...styles.colorBox,
          backgroundColor: RGBString(closestLup.rgb),
          borderColor: "white",
          borderBottomWidth: 2,
        }}
      >
        <Text>{closestLup.name + " (" + closestLup.brand + ")"}</Text>
      </TouchableOpacity>
    );
  }
  function getLightDown() {
    if (closestLdown.name === placeholder.name) {
      return <View style={styles.colorBox}></View>;
    }
    return (
      <TouchableOpacity
        onPress={() => setPaintColor(closestLdown)}
        style={{
          ...styles.colorBox,
          backgroundColor: RGBString(closestLdown.rgb),
          borderBottomWidth: 2,
        }}
      >
        <Text>{closestLdown.name + " (" + closestLdown.brand + ")"}</Text>
      </TouchableOpacity>
    );
  }
  function getUV() {
    if (closestUV.name === placeholder.name) {
      return <View style={styles.colorBox}></View>;
    }
    return (
      <TouchableOpacity
        onPress={() => setPaintColor(closestUV)}
        style={{
          ...styles.colorBox,
          backgroundColor: RGBString(closestUV.rgb),
          borderBottomWidth: 2,
          borderColor: "gray",
        }}
      >
        <Text>{closestUV.name + " (" + closestUV.brand + ")"}</Text>
      </TouchableOpacity>
    );
  }
  function stepMeter() {
    return (
      <View
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "8%",
          width: "100%",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            flex: 1,
          }}
        >
          <TouchableOpacity
            onPress={() => (stepRate > 1 ? setStepRate(stepRate - 1) : {})}
          >
            <Text style={{ fontSize: 24, paddingRight: 16 }}>-</Text>
          </TouchableOpacity>
          <Text style={{ justifyText: "center", fontSize: 24 }}>
            {stepRate}
          </Text>
          <TouchableOpacity
            onPress={() => (stepRate < 21 ? setStepRate(stepRate + 1) : {})}
          >
            <Text style={{ fontSize: 24, paddingLeft: 16 }}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 16, textAlign: "center", flex: 1 }}>
          Shades per Step
        </Text>
      </View>
    );
  }
  /////////Render////////////////////////
  try {
    return (
      <View
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "start",
          alignItems: "center",
          backgroundColor: RGBString(paintColor ? paintColor.rgb : [0, 0, 0]),
        }}
      >
        <Text style={{ fontSize: 16, padding: 10, paddingBottom: 0 }}>
          Drag in a paint and tap to find paint colors that have more yellow,
          red, blue, white, gray, or black
        </Text>
        {stepMeter()}
        <View
          style={{
            width: "100%",
            height: "15%",
            flexDirection: "row",
            justifyContent: "space-around",
          }}
        >
          {getRed()}
          {getYellow()}
          {getBlue()}
        </View>
        <View
          style={{
            width: "100%",
            height: "25%",
            justifyContent: "center",
          }}
        ></View>

        {paintColor ? (
          <PaintChip
            paintColor={paintColor}
            startWidth={150}
            startHeight={150}
            startTop={Dimensions.get("window").height / 2 - 50}
            startLeft={Dimensions.get("window").width / 2}
            isSaved={false}
            onDrop={onDrop}
            startDrag={startDrag}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 5,
            }}
            strokeWidth={3}
          />
        ) : (
          <View></View>
        )}
        <Text
          style={{
            color: paintColor.hsluv[2] > 50 ? "black" : "white",
            textAlign: "center",
            fontSize: 12,
            margin: 5,
            zIndex: 10,
            alignSelf: "center",
            top: -150,
          }}
        >
          Drag to Add to Pallette
        </Text>
        <View
          style={{
            width: "100%",
            height: "15%",
            flexDirection: "row",
            justifyContent: "space-around",
          }}
        >
          {getLightUp()}
          {getUV()}
          {getLightDown()}
        </View>
      </View>
    );
  } catch (e) {
    console.log(e);
    if (!paintColor) {
      setPaintColor(ml);
    }
    return <View></View>;
  }
}
const styles = StyleSheet.create({
  colorBox: {
    width: "30%",
    height: "100%",
    borderRadius: 10,
    margin: 20,
    justifyContent: "center",
  },
  icons: {
    height: 100,
    width: 100,
    resizeMode: "contain",
  },
});
