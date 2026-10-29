import React from "react";
import { Text, View } from "react-native";

export default function UndertoneCam() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "600", textAlign: "center" }}>
        Undertone Camera is available on Android and iOS.
      </Text>
      <Text style={{ marginTop: 12, textAlign: "center" }}>
        Open Color Harmonizer on a mobile device to use the camera.
      </Text>
    </View>
  );
}
