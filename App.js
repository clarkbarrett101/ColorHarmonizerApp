import { Dimensions, Platform } from "react-native";
import Purchases from "./src/Purchases";
import React from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LOG_LEVEL } from "react-native-purchases";

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Purchases />
    </GestureHandlerRootView>
  );
};

export default App;
