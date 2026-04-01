import { Dimensions, PanResponder } from "react-native";
import { CLAColor } from "./CLAcolor";
import RadialGraphic from "./RadialGraphic";
import { useEffect, useMemo, useState } from "react";
import { Text } from "react-native-svg";
type tMenu = {
  radii?: [number, number];
  chords?: number;
  rings?: number;
};
function Menu({ radii = [450, 800], chords = 6, rings = 5 }: tMenu) {
  const dimensions = Dimensions.get("window");
  const [selection, setSelection] = useState(0);

  const labels = [
    "Harmonies",
    "Tones",
    "Scales",
    "Chords",
    "Progressions",
    "Palettes",
  ];

  return (
    <RadialGraphic
      onSectorPress={({ ring, chord }) => {
        setSelection(chord);
      }}
      position={[dimensions.width + radii[1] / 2, dimensions.height / 2]}
      chords={chords}
      rings={rings}
      arc={[150, 210]}
      radii={radii}
      direction={1}
      colorRange={{
        R0A0: new CLAColor(0.5, 0.4, 0),
        R1A0: new CLAColor(0.8, 0.7, 0),
        R0A1: new CLAColor(0.5, 0.4, 270),
        interpolation: "expo",
      }}
      sectorModifier={(ring, chord, sector) => {
        return {
          ...sector,
          zGroupID: chord % chords,
          arcLength: sector.arcLength * 0.8,
        };
      }}
      zGroupModifier={(group) => {
        if (group.zGroupID == selection) {
          group.offset = 20;
          group.zIndex = 1;
        }
        group.children = (
          <>
            <Text
              x={-radii[1] * 0.78}
              y={0}
              fill="black"
              fontSize="36"
              fontFamily="Outfit"
              fontWeight="bold"
              textAnchor="middle"
              alignmentBaseline="middle"
              transform={`scale(-1, -1)`}
              filter="url(#shadow)"
            >
              {`${labels[group.zGroupID] || ""}`}
            </Text>
            <Text
              x={-radii[1] * 0.78 - 3}
              y={-2}
              fill="white"
              fontSize="36"
              fontFamily="Outfit"
              fontWeight="bold"
              textAnchor="middle"
              alignmentBaseline="middle"
              transform={`scale(-1, -1)`}
              filter="url(#shadow)"
            >
              {`${labels[group.zGroupID] || ""}`}
            </Text>
          </>
        );
        return group;
      }}
    />
  );
}
export { Menu };
