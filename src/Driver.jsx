import React, { useState, useEffect } from "react";
import { View } from "react-native";
import Harmonizer from "./Harmonizer";
import ColorMixer from "./ColorMixer";
import SwatchBook from "./SwatchBook";
import masterList from "./masterList.mjs";
import ChipManager from "./ChipManager";
import PaintChip from "./PaintChip";
import DragMenu from "./DragMenu";
import DragTest from "./DragTest";
export default function Driver() {
  const testList = masterList.slice(0, 5);
  const [swatches, setSwatches] = useState(testList);

  return (
    <View style={{ flex: 1, flexDirection: "row" }}>
      <SwatchBook swatches={swatches} />
    </View>
  );
}
