import { Canvas, Rect, Shadow } from "@shopify/react-native-skia";
import { Dimensions, Share, View } from "react-native";
import { useDerivedValue } from "react-native-reanimated";
import { useRadialContext } from "./RadialContext";
import { fCLARColorToString } from "./CLAcolor";
import { eLayers } from "./UserContext";

export function BGGradient() {
  const { dAR, dC, dL } = useRadialContext();
  const color = useDerivedValue(() => {
    console.log("BGGradient color updated", {
      c: dC.value,
      l: dL.value,
      ar: dAR.value,
    });
    return fCLARColorToString({
      c: dC.value * 0.25,
      l: dL.value * 0.5 + 0.5,
      ar: dAR.value,
    });
  });
  const shadow = useDerivedValue(() => {
    return fCLARColorToString({
      c: dC.value * 0.1,
      l: dL.value * 0.75,
      ar: dAR.value,
    });
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
          color={color}
        >
          <Shadow dx={5} dy={12} blur={25} color={shadow} inner />
          <Shadow dx={-12} dy={-5} blur={25} color={shadow} inner />
        </Rect>
      </Canvas>
    </View>
  );
}
