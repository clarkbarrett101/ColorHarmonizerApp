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
  litCount?: number;
  chromaCount?: number;
  chromaArcRotation?: [number, number];
  lightnessArcRotation?: [number, number];
};
export default function ColorMixer({
  radii = [50, 250],
  direction = 1,
  litCount = 5,
  chromaCount = 4,
  chromaArcRotation = [4.4 / 7, 17.5 / 7],
  lightnessArcRotation = [5.5 / 7, 27.5 / 7],
}: tColorMixer) {
  const dimensions = Dimensions.get("window");
  const [selectedColor, setSelectedColor] = useState<tCLARColor>({
    c: 0.5,
    l: 0.5,
    ar: 0,
  });
  const wheelRotation = useSharedValue(0);
  const chromaPanPos = useSharedValue({
    angle: chromaArcRotation[1],
    radius: radii[1],
  });
  const lightnessPanPos = useSharedValue({
    angle: lightnessArcRotation[1],
    radius: radii[1],
  });
  useEffect(() => {
    console.log("Selected color:", selectedColor);
  }, [selectedColor]);
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
    c = 0.1 + c * 0.9;
    let l =
      1 -
      (lightnessPanPos.value.angle -
        lightnessArcRotation[1] +
        lightnessArcRotation[0] / 2) /
        lightnessArcRotation[0];
    l = 0.25 + l * 0.8;
    const ar =
      (((wheelRotation.value + 22 / 7) % (44 / 7)) + 44 / 7) % (44 / 7);

    return { c: c, l: l, ar: ar };
  });
  const getChromaColor = useCallback(
    (src: { rings: number; chords: number }) => {
      "worklet";
      const _ = chromaPanPos.value;
      let c = src.chords / (chromaCount - 1);
      let r = src.rings / 2;
      c = 0.1 + c * 0.9;
      r = 0.5 + r / 2;
      c *= r;

      return { c, l: selectColor.value.l * r, ar: selectColor.value.ar };
    },
    [],
  );
  const getLightnessColor = useCallback(
    (src: { rings: number; chords: number }) => {
      "worklet";
      const _ = lightnessPanPos.value;
      let l = 1 - src.chords / (litCount - 1);
      l = 0.25 + l * 0.8;
      let r = src.rings / 2;
      l *= r * 0.25 + 0.75;
      r = 0.5 + r * 0.5;
      return { c: selectColor.value.c * r, l, ar: selectColor.value.ar };
    },
    [],
  );
  return (
    <>
      <PanManager>
        <RadialContext
          value={{
            origin: [dimensions.width, dimensions.height / 2],
            direction,
            angleToChord: fDefaultAngleToChord,
            chordToAngle: fDefaultChordToAngle,
            selectColor,
            setSelectColor: setSelectedColor,
          }}
        >
          <View style={{ flex: 1, zIndex: 1 }}>
            <TintSelector
              key={`Lightness Selector`}
              onSelect={(color: CLARColor) => onSelect(color, true)}
              arcLength={lightnessArcRotation[0]}
              rotationR={lightnessArcRotation[1]}
              rc={{ rings: 3, chords: litCount }}
              radii={[radii[1] - 5, radii[1] + 75]}
              panPos={lightnessPanPos}
              getColor={getLightnessColor}
            />
            <TintSelector
              key={`Chroma Selector`}
              onSelect={(color: CLARColor) => onSelect(color, false)}
              arcLength={chromaArcRotation[0]}
              rotationR={chromaArcRotation[1]}
              rc={{ rings: 3, chords: chromaCount }}
              radii={[radii[1] - 5, radii[1] + 75]}
              panPos={chromaPanPos}
              getColor={getChromaColor}
            />
          </View>
          <ColorWheel
            radii={radii}
            rc={{ rings: 5, chords: 24 }}
            rotationROffset={wheelRotation}
          />
        </RadialContext>
      </PanManager>
    </>
  );
}
