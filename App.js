import Purchases from "./src/Purchases";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Purchases />
    </GestureHandlerRootView>
  );
};
export default App;
