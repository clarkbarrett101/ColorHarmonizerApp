import {
  View,
  Text,
  TouchableOpacity,
  PanResponder,
  Dimensions,
} from "react-native";
import Svg, {
  Path,
  Circle,
  Defs,
  Stop,
  LinearGradient,
  G,
} from "react-native-svg";
import React, { useState, useEffect } from "react";
import { Hsluv } from "./hsluv.mjs";
import masterList from "./masterList.mjs";
import ChipWheel from "./ChipWheel";
import PaintSort from "./PaintSort";

export default function ColorSearch({
  assignedColor,
  isDragging,
  startDrag,
  onDrop,
}) {
  const numSections = 12;
  const [hue, setHue] = useState(100);
  const [saturation, setSaturation] = useState(50);
  const [lightness, setLightness] = useState(50);
  const [isChanging, setIsChanging] = useState(false);

  function ChipIcon(
    hue,
    saturation,
    lightness,
    style,
    strokeWidth,
    strokeColor
  ) {
    const hsluv = new Hsluv();
    hsluv.hsluv_h = hue;
    hsluv.hsluv_s = saturation;
    hsluv.hsluv_l = lightness;
    hsluv.hsluvToHex();
    const hex = hsluv.hex;
    /*
           <Path
          d="M240.29 4.74l67.04 72.12c2.43 2.61 3.78 6.04 3.78 9.61V386.4c0 7.8-6.33 14.13-14.14 14.11L14.08 400c-7.78-.01-14.09-6.33-14.09-14.11V14.11C0 6.31 6.33 0 14.13 0l215.84.24c3.92 0 7.65 1.64 10.32 4.5z"
          fill={hex}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
    */
    return (
      <Svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 400 400"
        style={style}
      >
        <Defs>
          <LinearGradient
            id="linear-gradient"
            x1={286.4}
            y1={273.9}
            x2={348.6}
            y2={336.1}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset={0.2} stopOpacity={0} />
            <Stop offset={1} stopOpacity={0.5} />
          </LinearGradient>
        </Defs>
        <G id="Layer_1">
          <Circle cx={200} cy={200} r={200} fill={hsluv.hex} />
          <Path
            d="M395.5 165.7c6.9 1.5 14 102.6-45.8 169-30.1 33.5-68.9 48.9-74.7 51.2-25.1 9.7-46.1 11.6-63.2 13.2-11.5 1-17.3 1.5-17.9-.2-2.3-6.9 196.1-234.4 201.6-233.2z"
            fill="url(#linear-gradient)"
          />
          <Circle cx={200} cy={200} r={190} opacity={0.4} fill={hsluv.hex} />
          <Path
            d="M38.7 165.6c-3.9-1.1-1.2-52.2 36.8-91.9C109.4 38.3 158.1 26.1 160 29c1.7 2.6-33.9 15.9-68.2 51.4-41.8 43.3-49.6 86.3-53.2 85.2z"
            fill="#fff"
            opacity={0.6}
          />
        </G>
      </Svg>
    );
  }

  function hueSlider() {
    const stepRate = 30;
    let move = 0;
    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event, gestureState) => {
        console.log("onPanResponderGrant");
        setIsChanging(true);
      },
      onPanResponderMove: (event, gestureState) => {
        move = (gestureState.moveX - Dimensions.get("window").width / 2) / 25;
        setHue((hue + move) % 360);
      },
      onPanResponderRelease: (event, gestureState) => {
        console.log("onPanResponderRelease");
        setIsChanging(false);
      },
      onPanResponderTerminate: (event, gestureState) => {
        setIsChanging(false);
      },
    });

    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          display: "flex",
          flexDirection: "row",
        }}
        {...panResponder.panHandlers}
      >
        {
          //-3
          ChipIcon(
            hue - 3 * stepRate,
            saturation,
            lightness,
            { height: "100%", width: "15%", right: "-50%", zIndex: 0 },
            2,
            "black"
          )
        }
        {
          //-2
          ChipIcon(
            hue - 2 * stepRate,
            saturation,
            lightness,
            { height: "100%", width: "20%", right: "-35%", zIndex: 1 },
            2,
            "black"
          )
        }
        {
          // -1
          ChipIcon(
            hue - stepRate,
            saturation,
            lightness,
            { height: "100%", width: "25%", right: "-20%", zIndex: 2 },
            2,
            "black"
          )
        }
        {
          // 0
          ChipIcon(
            hue,
            saturation,
            lightness,
            {
              height: "100%",
              width: "35%",
              zIndex: 3,
            },
            5,
            "white"
          )
        }
        {
          // +1
          ChipIcon(
            hue + stepRate,
            saturation,
            lightness,
            { height: "100%", width: "25%", left: "-20%", zIndex: 2 },
            2,
            "black"
          )
        }
        {
          // +2
          ChipIcon(
            hue + 2 * stepRate,
            saturation,
            lightness,
            { height: "100%", width: "20%", left: "-35%", zIndex: 1 },
            2,
            "black"
          )
        }
        {
          // +3
          ChipIcon(
            hue + 3 * stepRate,
            saturation,
            lightness,
            { height: "100%", width: "15%", left: "-50%", zIndex: 0 },
            5,
            "black"
          )
        }
      </View>
    );
  }
  function saturationSlider() {
    panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event, gestureState) => {
        setIsChanging(true);
      },
      onPanResponderMove: (event, gestureState) => {
        const sat =
          Math.floor(
            (gestureState.moveX / Dimensions.get("window").width) * 10
          ) * 10;
        console.log(sat);
        setSaturation(sat);
      },
      onPanResponderRelease: (event, gestureState) => {
        setIsChanging(false);
      },
      onPanResponderTerminate: (event, gestureState) => {
        setIsChanging(false);
      },
    });

    function getChip(index) {
      const priority = Math.abs(saturation - index * 10);
      return ChipIcon(
        hue,
        index * 10,
        lightness,
        {
          flex: priority == 0 ? 3 : 2,
          zIndex: 10 - priority,
          height: "100%",
        },
        priority == 0 ? 10 : 5,
        priority == 0 ? "white" : "black"
      );
    }
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          display: "flex",
          flexDirection: "row",
          gap: -10,
        }}
        {...panResponder.panHandlers}
      >
        {getChip(0)}
        {getChip(1)}
        {getChip(2)}
        {getChip(3)}
        {getChip(4)}
        {getChip(5)}
        {getChip(6)}
        {getChip(7)}
        {getChip(8)}
        {getChip(9)}
      </View>
    );
  }
  function lightnessSlider() {
    panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event, gestureState) => {
        setIsChanging(true);
      },
      onPanResponderMove: (event, gestureState) => {
        const light =
          Math.floor(
            (gestureState.moveX / Dimensions.get("window").width) * 10
          ) * 10;
        console.log(light);
        setLightness(light);
      },
      onPanResponderRelease: (event, gestureState) => {
        setIsChanging(false);
      },
      onPanResponderTerminate: (event, gestureState) => {
        setIsChanging(false);
      },
    });

    function getChip(index) {
      priority = Math.abs(lightness - index * 10);
      return ChipIcon(
        hue,
        saturation,
        index * 10,
        {
          flex: priority == 0 ? 3 : 2,
          zIndex: 10 - priority,
          height: "100%",
        },
        priority == 0 ? 10 : 5,
        priority == 0 ? "white" : "black"
      );
    }

    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          display: "flex",
          flexDirection: "row",
          gap: -10,
        }}
        {...panResponder.panHandlers}
      >
        {getChip(0)}
        {getChip(1)}
        {getChip(2)}
        {getChip(3)}
        {getChip(4)}
        {getChip(5)}
        {getChip(6)}
        {getChip(7)}
        {getChip(8)}
        {getChip(9)}
      </View>
    );
  }
  useEffect(() => {
    if (assignedColor) {
      setHue(assignedColor.hsluv[0]);
      setSaturation(Math.round(assignedColor.hsluv[1] / 10) * 10);
      setLightness(Math.round(assignedColor.hsluv[2] / 10) * 10);
    }
  }, [assignedColor]);
  function getGradientColors() {
    const colors = [];
    for (let i = 1; i < 4; i++) {
      const hsluv = new Hsluv();
      hsluv.hsluv_h = hue;
      hsluv.hsluv_s = 100;
      hsluv.hsluv_l = 33 * i;
      hsluv.hsluvToHex();
      colors.push(hsluv.hex);
    }
    return colors;
  }
  return (
    <View
      style={{
        flex: 1,
        display: "flex",
      }}
    >
      <Text
        style={{
          textAlign: "center",
          fontSize: 22,
          color: "black",
        }}
      >
        Drag slider to cycle through hues or drag in a paint from the palette to
        start
      </Text>
      {hueSlider()}

      <View
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Text style={{ textAlign: "center", fontSize: 18 }}>
          Swipe to adjust saturation
        </Text>
        {saturationSlider()}
        <Text style={{ textAlign: "center", fontSize: 18 }}>
          Swipe to adjust lightness
        </Text>
        {lightnessSlider()}
      </View>
      <>
        {isChanging ? (
          <Text style={{ flex: 1, textAlign: "center" }}>
            Release to see paint colors
          </Text>
        ) : (
          <PaintSort
            hue={hue}
            saturation={saturation}
            lightness={lightness}
            startDrag={startDrag}
            onDrop={onDrop}
            width={Dimensions.get("window").width}
          />
        )}
      </>
    </View>
  );
}
/* Swipe and hold to cycle through colors.  */
//
