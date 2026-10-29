import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Purchases from "./src/Purchases";
import { loadSkia } from "./src/SkiaLoader";

const App = () => {
  const [skiaReady, setSkiaReady] = useState(false);
  const [Driver, setDriver] = useState(null);

  useEffect(() => {
    loadSkia()
      .then(() => import("./src/Driver"))
      .then((module) => {
        setDriver(() => module.default);
        setSkiaReady(true);
      })
      .catch((error) => {
        console.error("Unable to initialize Skia for web", error);
      });
  }, []);

  if (!skiaReady || !Driver) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Purchases>
        <Driver />
      </Purchases>
    </GestureHandlerRootView>
  );
};

export default App;
