import { View, Dimensions } from "react-native";
import React from "react";
import { SkiaCam } from "./SkiaCam";
import { useVerse } from "../utils/Verse";
import { ColorType, AlphaType } from "@shopify/react-native-skia";
import { DrawableFrame } from "react-native-vision-camera";
import { fRGBToCLARColor, tCLARColor, fRGBToYUV } from "../utils/CLAcolor";
import { useUserContext } from "../Contexts/UserContext";
import { useIVerse } from "../utils/iVerse";
import { ThermSelect } from "./ThermSelect";
import { kelvin_table, tTemp, fGetTempFromUV } from "./KelvinTemp";
import { PetalBox } from "../Buttons/PetalBox";
import { useDerivedValue } from "react-native-reanimated";
import { G, Text } from "react-native-svg";
export function LightThermometer() {
  const vTargetWhiteRGB = useIVerse<[number, number, number]>([255, 255, 255]);
  const vTemp = useIVerse<tTemp>(kelvin_table[6500]);
  const { vColorModel } = useUserContext();
  const frameSize = useIVerse<[number, number]>([0, 0]);
  function frameProcessor(frame: DrawableFrame) {
    "worklet";
    if (frameSize.shared.value[0] === 0) {
      frameSize.dispatch([frame.width, frame.height]);
    }
    frame.render();
    const imageInfo = frame.readPixels(
      frame.height / 2 - 2,
      frame.width / 2 - 2,
      {
        width: 5,
        height: 5,
        colorType: ColorType.RGBA_8888,
        alphaType: AlphaType.Unpremul,
      },
    );
    let averageColor = [0, 0, 0];
    for (let i = 0; i < 25; i++) {
      averageColor[0] += imageInfo[i * 4];
      averageColor[1] += imageInfo[i * 4 + 1];
      averageColor[2] += imageInfo[i * 4 + 2];
    }
    averageColor = averageColor.map((c) => c / 25);
    const uv = fRGBToYUV(averageColor as [number, number, number]);
    const temp = fGetTempFromUV(uv[1], uv[2]);
    vTemp.dispatch(temp);
  }
  const dC = useDerivedValue(() => {
    "worklet";
    return vTemp.shared.value.c;
  });
  const dL = useDerivedValue(() => {
    "worklet";
    return 0.9;
  });
  const dAR = useDerivedValue(() => {
    "worklet";
    return fRGBToCLARColor(vTemp.shared.value.rgb, vColorModel.shared.value).ar;
  });
  const fontSize = 16;
  return (
    <>
      <SkiaCam
        shaderCode={shaderCode}
        preProcessor={frameProcessor}
        fps={12}
        uniforms={{
          targetWhiteRGB: vTemp.state.rgb.map((c) => c / 255),
          center: [frameSize.state[0] / 2, frameSize.state[1] / 2],
        }}
      />
      <PetalBox
        origin={[50, Dimensions.get("window").height / 2 + 30]}
        radii={[20, 50]}
        dC={dC}
        dL={dL}
        dAR={dAR}
        arcLength={2.5 / 7}
        rotationR={-11 / 7}
      >
        <G transform={[{ rotate: 11 / 7 + "rad" }]}>
          <Text
            y={-25}
            fill="rgba(0,0,0,0.5)"
            fontSize={fontSize}
            fontFamily="Outfit"
            alignmentBaseline="middle"
            textAnchor="middle"
          >
            {vTemp.state.k + "K"}
          </Text>
        </G>
      </PetalBox>
      <PetalBox
        origin={[50, Dimensions.get("window").height / 2]}
        radii={[20, 50]}
        dC={dC}
        dL={dL}
        dAR={dAR}
        arcLength={2.5 / 7}
        rotationR={-11 / 7}
      >
        <G transform={[{ rotate: 11 / 7 + "rad" }]}>
          <Text
            y={-fontSize / 2 - 30}
            fill="rgba(0,0,0,0.5)"
            fontSize={fontSize}
            fontFamily="Outfit"
            alignmentBaseline="middle"
            textAnchor="middle"
          >
            Light
          </Text>
          <Text
            y={fontSize / 2 - 30}
            fill="rgba(0,0,0,0.5)"
            fontSize={fontSize}
            fontFamily="Outfit"
            alignmentBaseline="middle"
            textAnchor="middle"
          >
            Temp
          </Text>
        </G>
      </PetalBox>
    </>
  );
}
const shaderCode = /* glsl */ `
uniform shader image;
uniform vec3 targetWhiteRGB;
uniform vec2 center;
half4 main(float2 pos) {
  half4 color = image.eval(pos);
  color.rgb = color.rgb / targetWhiteRGB;
  return color;
}
`;
