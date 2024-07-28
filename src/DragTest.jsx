import React, { useRef } from "react";
import { Animated, View, StyleSheet, PanResponder, Text } from "react-native";
import Svg, { Path } from "react-native-svg";

const DragTest = () => {
  const [isDragging, setIsDragging] = React.useState(false);
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    titleText: {
      fontSize: 14,
      lineHeight: 24,
      fontWeight: "bold",
    },
    box: {
      height: isDragging ? 150 : 100,
      width: isDragging ? 150 : 100,
    },
  });
  const pan = useRef(new Animated.ValueXY()).current;

  const paintColor = {
    name: "Coral",
    brand: "Sherwin Williams",
    hex: "#FF4040",
    hsluv: [0, 100, 50],
  };
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }]),
      onPanResponderRelease: () => {
        pan.extractOffset();
      },
      onPanResponderGrant: (event, gestureState) => {
        setIsDragging(true);
      },
      onPanResponderRelease: () => {
        console.log("touch end");
        setIsDragging(false);
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>Drag this box!</Text>
      <Animated.View
        style={{
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        }}
        {...panResponder.panHandlers}
      >
        <View style={styles.box}>
          <Text
            style={{
              color: paintColor.hsluv[2] > 50 ? "black" : "white",
              textAlign: "center",
              fontSize: 12,
              margin: 5,
              zIndex: 10,
              bottom: 0,
              left: 0,
              position: "absolute",
            }}
          >
            {paintColor.name + " (" + paintColor.brand + ")"}
          </Text>
          <Svg
            id="Layer_1"
            data-name="Layer 1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 311.11 400.51"
            style={{
              top: 0,
              left: 0,
              position: "absolute",
              zIndex: 9,
            }}
            {...panResponder.panHandlers}
          >
            <Path
              d="M240.29 4.74l67.04 72.12c2.43 2.61 3.78 6.04 3.78 9.61V386.4c0 7.8-6.33 14.13-14.14 14.11L14.08 400c-7.78-.01-14.09-6.33-14.09-14.11V14.11C0 6.31 6.33 0 14.13 0l215.84.24c3.92 0 7.65 1.64 10.32 4.5z"
              fill={paintColor.hex}
              strokeWidth={0}
            />
            <Path
              d="M263.49 359.71H47.62c-5.9 0-10.68-4.78-10.68-10.68v-68.65c0-5.9 4.78-10.68 10.68-10.68h215.87c5.9 0 10.68 4.78 10.68 10.68v68.65c0 5.9-4.78 10.68-10.68 10.68z"
              strokeWidth={0}
              fill="#fff"
              opacity={0.5}
            />
          </Svg>

          <Svg
            viewBox="0 0 311.11 400.51"
            style={{
              position: "absolute",
              top: isDragging ? 50 : 5,
              left: -5,
              width: 100,
              height: 100,
            }}
          >
            <Path
              d="M240.29 4.74l67.04 72.12c2.43 2.61 3.78 6.04 3.78 9.61V386.4c0 7.8-6.33 14.13-14.14 14.11L14.08 400c-7.78-.01-14.09-6.33-14.09-14.11V14.11C0 6.31 6.33 0 14.13 0l215.84.24c3.92 0 7.65 1.64 10.32 4.5z"
              fill={"rgba(0,0,0,.5)"}
              strokeWidth={0}
            />
          </Svg>
        </View>
      </Animated.View>
    </View>
  );
};

export default DragTest;
