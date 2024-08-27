import Driver from "./src/Driver";
import { Dimensions, Platform } from "react-native";
import React from "react";
import { View } from "react-native";
import HueWheel from "./src/HueWheel";
import ColorSector from "./src/ColorSector";
import ColorRadials from "./src/ColorRadials";
import PaintFan from "./src/PaintFan";
import SectorRow from "./src/SectorRow";
import SectorManager from "./src/SectorManager";
import SwatchFan from "./src/SwatchFan";
export default function App() {
  /* 
  componentDidMount() {
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
    if (Platform.OS === 'ios') {
       Purchases.configure({apiKey: <appl_VkkRztDNPposokHuqhRQIbgbIbV>});
    } else if (Platform.OS === 'android') {
       Purchases.configure({apiKey: <goog_nbjOYQKfQxYVSCBWXbhLvVUzMBA>});
    }
    }*/
  return <Driver />;
}
