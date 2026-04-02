import { Dimensions, PanResponder } from "react-native";
import { CLAColor } from "./CLAcolor";
import { RadialGraphic } from "./RadialGraphic";
import { useEffect, useMemo, useState } from "react";
import { Text } from "react-native-svg";
import {
  useDerivedValue,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";

type tMenu = {
  radii?: [number, number];
  rc?: { rings: number; chords: number };
  arcLength?: number;
  rotation?: number;
  direction?: 1 | -1;
};
function Menu({
  radii = [200, 500],
  rc = { rings: 5, chords: 6 },
  arcLength = 80,
  rotation = 120,
  direction = 1,
}: tMenu) {
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
  const sharedSelection = useSharedValue(0);

  const angleToChord = (angle: number) => {
    const chord =
      rc.chords - Math.floor((angle - rotation) / (arcLength / rc.chords));
    return chord;
  };

  const chordToAngle = (chord: number) => {
    return (rc.chords - chord + 0.5) * (arcLength / rc.chords) + rotation;
  };

  const selectionRange = useDerivedValue<[number, number]>(() => {
    return [sharedSelection.value - 5, sharedSelection.value + 5];
  }, [sharedSelection, rc.chords, arcLength, rotation, direction]);

  useEffect(() => {
    console.log("Selection changed:", selection, angleToChord(selection));
    sharedSelection.value = withTiming(selection, {
      duration: 300,
      easing: Easing.out(Easing.exp),
    });
  }, [selection]);

  return (
    <RadialGraphic
      selection={selectionRange}
      onSectorPress={({ ring, chord }) => {
        console.log("Pressed sector:", { ring, chord });
        setSelection(chordToAngle(chord));
      }}
      position={[
        dimensions.width + (radii[0] + radii[1]) / 4,
        dimensions.height / 2,
      ]}
      rc={rc}
      arcLength={arcLength}
      rotation={rotation}
      radii={radii}
      direction={direction}
      angleToChord={angleToChord}
      chordToAngle={chordToAngle}
      colorRange={{
        R0A0: new CLAColor(0.5, 0.4, 0),
        R1A0: new CLAColor(0.8, 0.7, 0),
        R0A1: new CLAColor(0.5, 0.4, 270),
        interpolation: "expo",
      }}
      sectorModifier={(sector) => {
        return {
          ...sector,
          zGroupID: sector.rc.chords % rc.chords,
          arcLength: sector.arcLength * 0.8,
        };
      }}
      sectorGroupModifier={(group) => {
        group.offsetMultiplier = 100;
        if (group.sectorGroupID == angleToChord(selection)) {
          group.style = { zIndex: 1 };
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
              {`${group.rotation.toFixed(2) || ""}`}
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
              {`${group.rotation.toFixed(2) || ""}`}
            </Text>
          </>
        );
        return group;
      }}
    />
  );
}
export { Menu };
