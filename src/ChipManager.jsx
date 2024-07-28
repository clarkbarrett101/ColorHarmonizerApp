import React from "react";
import { View } from "react-native";
import SwatchBook from "./SwatchBook";
import PaintChip from "./PaintChip";
import DragMenu from "./DragMenu";
export default function ChipManager({ swatches }) {
  const [dragging, setDragging] = React.useState(false);
  return (
    <View style={{ flex: 1 }}>
      <SwatchBook swatches={swatches} />

      <DragMenu />
    </View>
  );
}
