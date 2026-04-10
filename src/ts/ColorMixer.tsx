import { use, useCallback, useEffect, useMemo, useState } from "react";
import { CLARColor, tCLARColor } from "./CLAcolor";
import { ColorWheel } from "./ColorWheel";
import { fGetColorsFromGrid } from "./RadialGraphic";
import { TintSelector } from "./TintSelector";
import { Dimensions, View } from "react-native";
import PanManager from "./PanManager";
import {
  RadialContext,
  fDefaultAngleToChord,
  fDefaultChordToAngle,
} from "./RadialContext";
import { useDerivedValue, useSharedValue } from "react-native-reanimated";

type tColorMixer = {
  radii?: [number, number];
  arcLength?: number;
  rotation?: number;
  direction?: 1 | -1;
  litDimensions?: [number, number];
  litRange?: [number, number];
  chromaRange?: [number, number];
  chromaDimensions?: [number, number];
  chromaArcRotation?: [number, number];
  lightnessArcRotation?: [number, number];
};
export default function ColorMixer({
  radii = [50, 250],
  direction = -1,
  litDimensions = [4, 5],
  litRange = [0.1, 1],
  chromaRange = [0.1, 0.8],
  chromaDimensions = [4, 4],
  chromaArcRotation = [4.4 / 7, 16 / 7],
  lightnessArcRotation = [5.5 / 7, 28 / 7],
}: tColorMixer) {
  const dimensions = Dimensions.get("window");
  const [selectedColor, setSelectedColor] = useState<tCLARColor>({
    c: 0.5,
    l: 0.5,
    ar: 0,
  });
  useEffect(() => {
    console.log("Selected Color:", selectedColor);
  }, [selectedColor]);
  const wheelRotation = useSharedValue(11 / 7);
  const chromaPanPos = useSharedValue({
    angle: chromaArcRotation[1] + chromaArcRotation[0] / 4,
    radius: radii[1],
  });
  const lightnessPanPos = useSharedValue({
    angle: lightnessArcRotation[1],
    radius: radii[1],
  });
  const onSelect = (color: CLARColor, lightness: boolean) => {
    const selectColor = lightness
      ? new CLARColor(selectedColor.c, color.l, selectedColor.ar)
      : new CLARColor(color.c, selectedColor.l, selectedColor.ar);
    setSelectedColor(selectColor);
  };
  const selectColor = useDerivedValue(() => {
    let c =
      (chromaPanPos.value.angle -
        chromaArcRotation[1] +
        chromaArcRotation[0] / 2) /
      chromaArcRotation[0];
    c = (c - 0.5 / chromaDimensions[1]) / (1 - 1 / chromaDimensions[1]);
    c = chromaRange[0] + c * (chromaRange[1] - chromaRange[0]);
    let l =
      1 -
      (lightnessPanPos.value.angle -
        lightnessArcRotation[1] +
        lightnessArcRotation[0] / 2) /
        lightnessArcRotation[0];
    l = (l - 0.5 / litDimensions[1]) / (1 - 1 / litDimensions[1]);
    l = litRange[0] + l * (litRange[1] - litRange[0]);
    const ar =
      (((wheelRotation.value + 22 / 7) % (44 / 7)) + 44 / 7) % (44 / 7);

    return { c: c, l: l, ar: ar };
  });
  const getChromaColor = useCallback(
    (src: { rings: number; chords: number }) => {
      "worklet";
      const _ = chromaPanPos.value;
      let chord = src.chords / (chromaDimensions[1] - 1);
      let r = src.rings / (chromaDimensions[0] - 1);
      let c = chromaRange[0] + chord * (chromaRange[1] - chromaRange[0]);
      r = 0.5 + r * 0.5;
      c *= r;

      return { c, l: selectColor.value.l * r, ar: selectColor.value.ar };
    },
    [],
  );
  const getLightnessColor = useCallback(
    (src: { rings: number; chords: number }) => {
      "worklet";
      const _ = lightnessPanPos.value;
      let l = 1 - (src.chords + 0.5) / (litDimensions[1] - 1);
      l = litRange[0] + l * (litRange[1] - litRange[0]);
      let r = src.rings / (litDimensions[0] - 1);
      l *= r * 0.25 + 0.75;
      r = 0.5 + r * 0.5;
      return { c: selectColor.value.c * r, l, ar: selectColor.value.ar };
    },
    [],
  );
  return (
    <>
      <RadialContext
        value={{
          origin: [dimensions.width * 1.15, dimensions.height / 2],
          direction,
          angleToChord: fDefaultAngleToChord,
          chordToAngle: fDefaultChordToAngle,
          selectColor,
          setSelectColor: setSelectedColor,
        }}
      >
        <PanManager drawSectors>
          <View style={{ flex: 1, zIndex: 1 }}>
            <TintSelector
              key={`Lightness Selector`}
              onSelect={(color: CLARColor) => onSelect(color, true)}
              arcLength={lightnessArcRotation[0]}
              rotationR={lightnessArcRotation[1]}
              rc={{ rings: litDimensions[0], chords: litDimensions[1] }}
              radii={[radii[1] - 50, radii[1] + 75]}
              panPos={lightnessPanPos}
              getColor={getLightnessColor}
            />
            <TintSelector
              key={`Chroma Selector`}
              onSelect={(color: CLARColor) => onSelect(color, false)}
              arcLength={chromaArcRotation[0]}
              rotationR={chromaArcRotation[1]}
              rc={{ rings: chromaDimensions[0], chords: chromaDimensions[1] }}
              radii={[radii[1] - 30, radii[1] + 75]}
              panPos={chromaPanPos}
              getColor={getChromaColor}
            />
          </View>
          <ColorWheel
            radii={radii}
            rc={{ rings: 5, chords: 24 }}
            rotationROffset={wheelRotation}
          />
        </PanManager>
      </RadialContext>
    </>
  );
}
