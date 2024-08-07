import masterList from "./masterList";
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Dimensions, Image } from "react-native";
export default function ColorSeasons() {
  const stepRate = 5;
  const [mainColor, setMainColor] = useState(
    masterList[Math.floor(Math.random() * masterList.length)]
  );
  const [autumn, setAutumn] = useState(getPlusAutumn());
  const [winter, setWinter] = useState(getPlusWinter());
  const [spring, setSpring] = useState(getPlusSpring());
  const [summer, setSummer] = useState(getPlusSummer());
  const width = Dimensions.get("window").width / 2;
  useEffect(() => {
    setAutumn(getPlusAutumn());
    setWinter(getPlusWinter());
    setSpring(getPlusSpring());
    setSummer(getPlusSummer());
  }, [mainColor]);

  function getPlusSummer() {
    const hue = mainColor.hsluv[0];
    const saturation = mainColor.hsluv[1];
    const lightness = mainColor.hsluv[2];
    let diffList = [];
    for (let i = 0; i < masterList.length; i++) {
      const color = masterList[i];
      if (isUpWarm(hue) && color.hsluv[0] <= hue) {
        continue;
      }
      if (color.hsluv[1] > saturation) {
        continue;
      }
      if (color.hsluv[2] < lightness) {
        continue;
      }
      const hdiff = Math.abs(color.hsluv[0] - hue);
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
      if (isUpWarm(hue) && color.hsluv[0] <= hue) {
        continue;
      }
      if (color.hsluv[1] > saturation) {
        continue;
      }
      if (color.hsluv[2] > lightness) {
        continue;
      }
      const hdiff = Math.abs(color.hsluv[0] - hue);
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
      if (!isUpWarm(hue) && color.hsluv[0] >= hue) {
        continue;
      }
      if (color.hsluv[1] < saturation) {
        continue;
      }
      if (color.hsluv[2] > lightness) {
        continue;
      }
      const hdiff = Math.abs(color.hsluv[0] - hue);
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
      if (!isUpWarm(hue) && color.hsluv[0] >= hue) {
        continue;
      }
      if (color.hsluv[1] < saturation) {
        continue;
      }
      if (color.hsluv[2] < lightness) {
        continue;
      }
      const hdiff = Math.abs(color.hsluv[0] - hue);
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
    return hue <= 60 || hue >= 240;
  }
  return (
    <View
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "wrap",
        width: width * 2,
        height: width * 2,
        top: Dimensions.get("window").height / 2 - width,
      }}
    >
      <View
        style={{
          width: width,
          height: width,
          backgroundColor: mainColor.hex,
          marginBottom: 20,
          position: "absolute",
          top: width / 2,
          left: width / 2,
          zIndex: 1,
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            textAlign: "center",
          }}
        >
          {mainColor.name + "\n[" + mainColor.brand + "]"}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => setMainColor(summer)}
        style={{
          backgroundColor: summer.hex,
          width: width,
          height: width,
          paddingTop: 20,
        }}
      >
        <Text
          style={{
            textAlign: "center",
          }}
        >
          {"(Summer) \n" + summer.name + "\n[" + summer.brand + "]"}
        </Text>
        <Image
          style={{
            width: 100,
            resizeMode: "contain",
            alignSelf: "center",
            position: "absolute",
          }}
          source={require("../assets/Summer.png")}
        />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setMainColor(autumn)}
        style={{
          backgroundColor: autumn.hex,
          width: width,
          height: width,
          paddingTop: 20,
        }}
      >
        <Text
          style={{
            textAlign: "center",
          }}
        >
          {"(Autumn) \n" + autumn.name + "\n[" + autumn.brand + "]"}
        </Text>
        <Image
          style={{
            width: 100,
            resizeMode: "contain",
            alignSelf: "center",
            top: -200,
            position: "absolute",
          }}
          source={require("../assets/Autumn.png")}
        />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setMainColor(winter)}
        style={{
          backgroundColor: winter.hex,
          width: width,
          height: width,
          justifyContent: "flex-end",
          paddingBottom: 20,
        }}
      >
        <Text
          style={{
            textAlign: "center",
          }}
        >
          {"(Winter) \n" + winter.name + "\n[" + winter.brand + "]"}
        </Text>
        <Image
          style={{
            width: 100,
            resizeMode: "contain",
            alignSelf: "center",
            top: 20,
            position: "absolute",
          }}
          source={require("../assets/Winter.png")}
        />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setMainColor(spring)}
        style={{
          backgroundColor: spring.hex,
          width: width,
          height: width,
          justifyContent: "flex-end",
          paddingBottom: 20,
        }}
      >
        <Text
          style={{
            textAlign: "center",
          }}
        >
          {"(Spring) \n" + spring.name + "\n[" + spring.brand + "]"}
        </Text>
        <Image
          style={{
            width: 100,
            resizeMode: "contain",
            alignSelf: "center",
            top: -40,
            position: "absolute",
          }}
          source={require("../assets/Spring.png")}
        />
      </TouchableOpacity>
    </View>
  );
}
