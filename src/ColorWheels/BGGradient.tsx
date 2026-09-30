import {
  Canvas,
  Circle,
  RadialGradient,
  Rect,
  Shadow,
  Skia,
  SweepGradient,
} from "@shopify/react-native-skia";
import { Dimensions, View } from "react-native";
import { useDerivedValue } from "react-native-reanimated";
import { useVerseRelay } from "../utils/Verse";
import { fCLARColorToString, fCLARColorToRGB } from "../utils/CLAcolor";
import { eLayers, ePages, useUserContext } from "../Contexts/UserContext";
import { use, useEffect } from "react";
import { cDimH, cDimW } from "../utils/ScreenDimensions";

export default function BGGradient() {
  const { vColorModel, dAccentColor, vSelected, vPage } = useUserContext();
  const harmonizerPages: ePages[] = [
    "Color Harmonizer",
    "Scheme Selector",
    "Chip Selector",
  ];
  const colors = useDerivedValue(() => {
    if (!harmonizerPages.includes(vPage.shared.value)) {
      return [
        fCLARColorToString(
          {
            c: dAccentColor.value.c ** 1.5,
            l: dAccentColor.value.l ** 0.25,
            ar: dAccentColor.value.ar,
          },
          vColorModel.shared.value,
        ),
      ];
    }
    const cs = vSelected.shared.value.map((ar, index) => {
      const c = dAccentColor.value.c;
      const l = dAccentColor.value.l ** 0.5;
      const rgb = fCLARColorToRGB({ c, l, ar }, vColorModel.shared.value);
      return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    });
    console.log("vSelected.shared.value:", cs);
    return cs;
  });
  const shadow = useDerivedValue(() => {
    return fCLARColorToString(
      {
        c: dAccentColor.value.c * 0.1,
        l: dAccentColor.value.l * 0.5,
        ar: dAccentColor.value.ar,
      },
      vColorModel.shared.value,
    );
  });

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: Dimensions.get("window").width,
        height: Dimensions.get("window").height,
        zIndex: eLayers.background,
      }}
    >
      <Canvas
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: Dimensions.get("window").width,
          height: Dimensions.get("window").height,
          zIndex: eLayers.background,
        }}
      >
        <Rect
          x={0}
          y={0}
          width={Dimensions.get("window").width}
          height={Dimensions.get("window").height}
        >
          <SweepGradient
            colors={colors}
            c={{
              x: Dimensions.get("window").width,
              y: Dimensions.get("window").height / 2,
            }}
            start={90}
            end={270}
          />
          <Shadow dx={5} dy={0} blur={25} color={shadow} inner />
        </Rect>
        <Circle cx={0} cy={cDimH()} r={cDimW(0.4)} blendMode="multiply">
          <RadialGradient
            colors={["rgba(0,0,0,0.75)", "rgba(0,0,0,0)"]}
            c={{ x: 0, y: cDimH() }}
            r={cDimW(0.4)}
          />
        </Circle>
      </Canvas>
    </View>
  );
}
