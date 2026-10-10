import {
  DrawableFrame,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";
import { useDerivedValue, withSpring } from "react-native-reanimated";
import { useEffect } from "react";
import {
  wDefaultAngleToChord,
  wDefaultChordToAngle,
} from "../Radials/RadialContext";
import { tRadialObject } from "../Radials/SectorTypes";
import { fRGBToCLARColor, fRGBToYUV } from "../utils/CLAcolor";
import { useUserContext } from "../Contexts/UserContext";
import { useVerse } from "../utils/Verse";
import { tTemp, kelvin_table, fGetTempFromUV } from "./KelvinTemp";
import { SkiaCam } from "./SkiaCam";
import { useIVerse } from "../utils/iVerse";
import { AlphaType, ColorType } from "@shopify/react-native-skia";
import React from "react";
import { usePanHitBox } from "../Buttons/PanHitBox";
import { HarmonizerWheel } from "../Harmonizer/HarmonizerWheel";
import {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
  Text,
} from "react-native-svg";
import { PetalBox, PetalBoxSimple } from "../Buttons/PetalBox";
import { fTextWrapSVG, Tutorial } from "../Buttons/Tutorial";
import { Thermo } from "./Thermo";
import { cDimH, cDimW, cRaxelW } from "../utils/ScreenDimensions";
import { Paths } from "../utils/Paths";

export default function UndertoneCam({
  radii = [cRaxelW(0.4, 0.3), cRaxelW(0.8, 0.6)],
  chord = 24,
  arcLength = 43.9 / 7,
  rotationR = 22 / 7,
}: tRadialObject) {
  const origin: [number, number] = [cDimW(1.05), cDimH(0.68)];
  const { hasPermission, requestPermission } = useCameraPermission();
  if (!hasPermission) {
    requestPermission();
    return null;
  }
  const device = useCameraDevice("back");
  const vThermoMode = useVerse(false);
  const vCamColor = useIVerse({ ar: 0, c: 0, l: 0 });
  const vAnimAr = useVerse(0);
  const vTemp = useIVerse<tTemp>(kelvin_table[6000]);
  const { vColorModel, vAccentAR, vAccentC } = useUserContext();

  useEffect(() => {
    const interval = setInterval(() => {
      let angle = wDefaultChordToAngle(
        wDefaultAngleToChord(
          vCamColor.shared.value.ar,
          arcLength,
          chord,
          rotationR,
        ),
        arcLength,
        chord,
        rotationR,
      );
      if (Math.abs(angle - vAnimAr.shared.value) > 22 / 7) {
        angle = angle > vAnimAr.shared.value ? angle - 44 / 7 : angle + 44 / 7;
      }
      vAnimAr.shared.value = withSpring(angle, {
        duration: 0.9,
        dampingRatio: 0.2,
      });
      vAccentC.shared.value = vCamColor.shared.value.c ** 0.5;
      vAccentAR.shared.value = withSpring(angle, {
        duration: 0.9,
        dampingRatio: 0.2,
      });
      if (vThermoMode.shared.value) {
        vTemp.dispatch(vTemp.shared.value || kelvin_table[6000]);
      }
    }, 1000);
    return () => {
      clearInterval(interval);
      collectGarbage?.();
    };
  }, []);

  function frameProcessor(frame: DrawableFrame) {
    "worklet";
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
    const clar = fRGBToCLARColor(
      averageColor as [number, number, number],
      vColorModel.shared.value,
    );
    vCamColor.shared.value = clar;
  }
  function preProcessor(frame: DrawableFrame) {
    "worklet";
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
    vTemp.shared.value = temp;
  }
  const dC = useDerivedValue(() => {
    "worklet";
    return vTemp.shared.value.c || 0.5;
  });
  const dL = useDerivedValue(() => {
    "worklet";
    return 1;
  });
  const dR = useDerivedValue(() => {
    "worklet";
    return fRGBToCLARColor(
      vTemp.shared.value.rgb || [1, 1, 1],
      vColorModel.shared.value,
    ).ar;
  });
  usePanHitBox({
    id: "thermoMode",
    origin: [10, cDimH(0.5)],
    radii: [0, 100],
    arcLength: 15 / 7,
    rotationR: 5 / 7,
    fOnUpdate: (state, pos) => {
      "worklet";
      console.log(state.value);
      if (state.value === "release" || state.value === "tap") {
        vThermoMode.dispatch(!vThermoMode.shared.value);
        state.value = "leave";
      }
    },
  });

  const fontSize = cDimH(0.02);
  const textProps: React.ComponentProps<typeof Text> = {
    fontSize,
    fontFamily: "Outfit",
    textAnchor: "middle",
    fill: "rgba(0,0,0,0.5)",
    alignmentBaseline: "middle",
    verticalAlign: "middle",
  };
  return (
    <>
      {device != null && (
        <SkiaCam
          preProcessor={preProcessor}
          postProcessor={frameProcessor}
          shaderCode={shaderCode}
          uniforms={{
            targetWhiteRGB: vTemp.state.rgb.map((c) => c / 255),
          }}
          fps={8}
          camActive={device != null}
        />
      )}
      <PetalBoxSimple
        origin={[cDimH(0.05), cDimH(0.55)]}
        radii={[cDimH(0.05), cDimH(0.1)]}
        dC={dC}
        dL={dL}
        dAR={dR}
        size={[cDimH(0.1), cDimH(0.1)]}
        viewBox={[110, 110]}
      >
        <Defs>
          <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="rgb(255,200,0)" stopOpacity="1" />
            <Stop offset="55%" stopColor="rgb(255,255,200)" stopOpacity="1" />
            <Stop offset="100%" stopColor="rgb(175,255,255)" stopOpacity="1" />
          </LinearGradient>
          <RadialGradient id="radGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="30%" stopColor="black" stopOpacity="1" />
            <Stop offset="100%" stopColor="rgb(150,150,150)" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <G transform={[{ rotate: 0 / 7 + "rad" }]}>
          {fTextWrapSVG(
            [
              `${vThermoMode.state ? "Confirm" : "Calibrate"} Tint`,
              "Temperature",
            ],
            26,
            [0, 30],
            { ...textProps, fontSize: 14 },
          )}
          <Circle cx="0" cy="-20" r="40" fill="url(#radGrad)" opacity="0.5" />
          <Path
            transform={[{ translateY: -20 }]}
            fill="url(#grad)"
            stroke="black"
            strokeWidth={0.5}
            strokeOpacity={0.3}
            d={Paths.thermo}
          />
        </G>
      </PetalBoxSimple>
      {!vThermoMode.state && (
        <>
          <Tutorial
            width={cDimW(0.8)}
            height={cDimH(0.25)}
            origin={[cDimW(0.5), cDimH(0.3)]}
            infoIconOrigin={[cDimW(0.9), cDimH(0.4)]}
            infoIconSize={cDimH(0.05)}
            maxOpacity={0.8}
          >
            <G>
              {fTextWrapSVG(
                [
                  "Point the camera at a surface",
                  " to find its undertone color.",
                  "",
                  "Select two colors to see possible",
                  "harmonious color schemes.",
                  "",
                  "Calibrate the tint temperature",
                  "to compensate for lighting color.",
                ],
                70,
                [0, 0],
                { ...textProps, fill: "white", fontSize: 10 },
              )}
            </G>
          </Tutorial>
          <HarmonizerWheel origin={origin} draggable={false} radii={radii} />
          <PetalBoxSimple
            origin={[cDimH(0.05), cDimH(0.48)]}
            dC={dC}
            dL={dL}
            dAR={dR}
            viewBox={[30, 15]}
            size={[75, 75]}
          >
            <Text {...textProps} fontSize={8}>
              {vTemp.state.k + "K"}
            </Text>
          </PetalBoxSimple>
          <PetalBoxSimple
            origin={[cDimH(0.05), cDimH(0.44)]}
            viewBox={[30, 15]}
            size={[75, 75]}
            dC={dC}
            dL={dL}
            dAR={dR}
          >
            <G>
              {fTextWrapSVG(["Light", "Temp"], 14, [0, 0], {
                ...textProps,
                fontSize: 8,
              })}
            </G>
          </PetalBoxSimple>
        </>
      )}
      {vThermoMode.state && (
        <>
          <Tutorial
            width={cDimW(0.8)}
            height={cDimH(0.25)}
            origin={[cDimW(0.5), cDimH(0.25)]}
            maxOpacity={0.8}
            infoIconOrigin={[cDimW(0.9), cDimH(0.1)]}
            infoIconSize={cDimH(0.05)}
          >
            <G>
              {fTextWrapSVG(
                [
                  "Light Thermometer:",
                  "Point the camera at a neutral white",
                  "surface (like a sheet of paper) to",
                  "calibrate to the color temperature",
                  "of the lights in your environment.",
                ],
                70,
                [0, 0],
                { ...textProps, fill: "white", fontSize: 10 },
              )}
            </G>
          </Tutorial>
          <Thermo
            rotationR={11 / 7}
            arcLength={2.5 / 7}
            radii={[0, cDimH(0.03)]}
            totalLength={cDimH(0.4)}
            tempK={vTemp.state.k | 6500}
            origin={[cDimW(0.9), cDimH(0.5)]}
            tempList={[
              4000, 4500, 5000, 5500, 6000, 6300, 6600, 7000, 7500, 8000, 9500,
              10500, 12000,
            ]}
          />
        </>
      )}
    </>
  );
}

const shaderCode = /* glsl */ `
uniform shader image;
uniform vec3 targetWhiteRGB;
half4 main(float2 pos) {
  half4 color = image.eval(pos);
  color.rgb = color.rgb / targetWhiteRGB;
  return color;
}
`;
function collectGarbage() {
  "worklet";
  globalThis.gc;
}
