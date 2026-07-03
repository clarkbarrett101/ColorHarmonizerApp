import Driver from "./src/ts/Driver";
import { Dimensions, Platform } from "react-native";
import React from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Purchases from "react-native-purchases";
import { LOG_LEVEL } from "react-native-purchases";
import PayWall from "./src/pages/PayWall";
import SandBox from "./src/ts/SandBox";

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Driver />
    </GestureHandlerRootView>
  );
};

export default App;
