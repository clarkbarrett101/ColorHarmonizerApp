import { Dimensions, Platform } from "react-native";
import Purchases from "./src/Purchases";
import React from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LOG_LEVEL } from "react-native-purchases";
import Icon from "./src/Icon";
import Driver from "./src/Driver";
const App = () => {
  console.log("App component rendered");
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Driver />
    </GestureHandlerRootView>
  );
};

export default App;
