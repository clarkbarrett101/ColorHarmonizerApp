import Driver from "./src/Driver";
import { Dimensions, Platform } from "react-native";
import React from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Purchases from "react-native-purchases";
import { LOG_LEVEL } from "react-native-purchases";
import PayWall from "./src/pages/PayWall";
import SandBox from "./src/ts/SandBox";

const App = () => {
  // In your app entry point (App.tsx/index.js)

  return <SandBox />;
};

export default App;
