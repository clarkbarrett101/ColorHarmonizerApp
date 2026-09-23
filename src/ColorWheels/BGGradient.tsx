import {
  Canvas,
  Rect,
  Shadow,
  SweepGradient,
} from "@shopify/react-native-skia";
import { Dimensions, View } from "react-native";
import { useDerivedValue } from "react-native-reanimated";
import { useVerseRelay } from "../utils/Verse";
import { fCLARColorToString } from "../utils/CLAcolor";
import { eLayers, ePages, useUserContext } from "../Contexts/UserContext";
import { use, useEffect } from "react";

export default function BGGradient() {
  const { vColorModel, vAccentAR, vAccentC, vAccentL, vSelected, vPage } =
    useUserContext();
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
            c: vAccentC.shared.value ** 1.5,
            l: vAccentL.shared.value ** 0.25,
            ar: vAccentAR.shared.value,
          },
          vColorModel.shared.value,
        ),
      ];
    }

    const cs = vSelected.shared.value.map((ar, index) => {
      const c = vAccentC.shared.value ** 1.5;
      const l = vAccentL.shared.value ** 0.25;
      return fCLARColorToString({ c, l, ar }, vColorModel.shared.value);
    });
    return cs;
  });
  const shadow = useDerivedValue(() => {
    return fCLARColorToString(
      {
        c: vAccentC.shared.value * 0.1,
        l: vAccentL.shared.value * 0.5,
        ar: vAccentAR.shared.value,
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
      </Canvas>
    </View>
  );
}
