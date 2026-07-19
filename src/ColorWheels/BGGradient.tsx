import {
  Canvas,
  Rect,
  Shadow,
  SweepGradient,
} from "@shopify/react-native-skia";
import { Dimensions, Share, View } from "react-native";
import {
  SharedValue,
  useAnimatedReaction,
  useDerivedValue,
} from "react-native-reanimated";
import { useRadialContext } from "../Radials/RadialContext";
import { fCLARColorToString, tCLARColor } from "../utils/CLAcolor";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { tVerse } from "../utils/Verse";

export type tBGGradient = {
  dARs?: SharedValue<number[]>;
  dCs?: SharedValue<number[]>;
  dLs?: SharedValue<number[]>;
};
export function BGGradient({ dARs, dCs, dLs }: tBGGradient) {
  const { vColorModel, vAccentAR, vAccentC, vAccentL } = useUserContext();
  const colors = useDerivedValue(() => {
    if (vAccentAR) {
      return [
        fCLARColorToString(
          {
            c: vAccentC.shared.value * 0.5,
            l: vAccentL.shared.value * 0.5 + 0.5,
            ar: vAccentAR.shared.value,
          },
          vColorModel.shared.value,
        ),
      ];
    }
    const cs = dARs.value.map((ar, index) => {
      const c = dCs.value[index];
      const l = dLs.value[index];
      return fCLARColorToString({ c, l, ar }, vColorModel.shared.value);
    });
    return cs;
  });
  const shadow = useDerivedValue(() => {
    if (vAccentAR) {
      return fCLARColorToString(
        {
          c: vAccentC.shared.value * 0.1,
          l: vAccentL.shared.value * 0.75,
          ar: vAccentAR.shared.value,
        },
        vColorModel.shared.value,
      );
    }
    return fCLARColorToString(
      {
        c: dCs.value[0] * 0.1,
        l: dLs.value[0] * 0.75,
        ar: dARs.value[0],
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
          width={Dimensions.get("window").width * 2}
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
          <Shadow dx={5} dy={12} blur={25} color={shadow} inner />
          <Shadow dx={-12} dy={-5} blur={25} color={shadow} inner />
        </Rect>
      </Canvas>
    </View>
  );
}
