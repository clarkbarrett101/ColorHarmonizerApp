import { Dimensions, View } from "react-native";
import {
  DrawableFrame,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";
import {
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useEffect, useState } from "react";
import {
  wDefaultAngleToChord,
  wDefaultChordToAngle,
} from "../Radials/RadialContext";
import { tRadialObject } from "../Radials/SectorTypes";
import { fRGBToCLARColor, fRGBToYUV } from "../utils/CLAcolor";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { useVerse } from "../utils/Verse";
import { ThermSelect } from "./ThermSelect";
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
import { PetalBox } from "../Buttons/PetalBox";
import { scheduleOnRN } from "react-native-worklets";
import { Tutorial } from "../Buttons/Tutorial";
import { Thermo } from "./Thermo";

export function ColorCamera({
  radii = [160, 320],
  chord = 24,
  arcLength = 43.9 / 7,
  rotationR = 22 / 7,
  fSetHarmonizer,
}: tRadialObject & {
  fSetHarmonizer: () => void;
}) {
  const origin: [number, number] = [
    Dimensions.get("window").width + 50,
    Dimensions.get("window").height * 0.6,
  ];
  const { hasPermission, requestPermission } = useCameraPermission();
  if (!hasPermission) {
    requestPermission();
    return null;
  }
  const device = useCameraDevice("back");
  if (device == null) return null;
  const vThermoMode = useVerse(false);
  const vTransition = useSharedValue(0);
  const vCamColor = useIVerse({ ar: 0, c: 0, l: 0 });
  const vAnimAr = useVerse(0);
  const vTemp = useIVerse<tTemp>(kelvin_table[6000]);
  const { vColorModel, vAccentAR, vAccentC } = useUserContext();
  const SCREEN_WIDTH = Dimensions.get("window").width;
  const SCREEN_HEIGHT = Dimensions.get("window").height;
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
      vAccentAR.shared.value = angle;
      console.log(
        "thermo:",
        vThermoMode.shared.value,
        "angle:",
        angle,
        "vCamColor:",
        vCamColor.shared.value,
      );
      if (!vThermoMode.shared.value) {
        vTemp.dispatch();
      }
    }, 1000);
    return () => clearInterval(interval);
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
    return vTemp.shared.value.c;
  });
  const dL = useDerivedValue(() => {
    "worklet";
    return 1;
  });
  const dR = useDerivedValue(() => {
    "worklet";
    return fRGBToCLARColor(vTemp.shared.value.rgb, vColorModel.shared.value).ar;
  });
  usePanHitBox({
    id: "thermoMode",
    origin: [10, SCREEN_HEIGHT / 2],
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

  const fontSize = 16;
  const textProps: React.ComponentProps<typeof Text> = {
    fontSize,
    fontFamily: "Outfit",
    textAnchor: "middle",
    fill: "rgba(0,0,0,0.5)",
  };
  return (
    <>
      <SkiaCam
        preProcessor={preProcessor}
        postProcessor={frameProcessor}
        shaderCode={shaderCode}
        uniforms={{ targetWhiteRGB: vTemp.state.rgb.map((c) => c / 255) }}
      />
      <PetalBox
        origin={[50, SCREEN_HEIGHT / 2 + 100]}
        radii={[20, 110]}
        dC={dC}
        dL={dL}
        dAR={dR}
        arcLength={3 / 7}
        rotationR={-11 / 7}
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
        <G transform={[{ rotate: 11 / 7 + "rad" }]}>
          {fTextWrapSVG(
            [
              `${vThermoMode.state ? "Calibrate " : "Confirm"} Tint`,
              "Temperature",
            ],
            { ...textProps, fontSize: fontSize - 4 },
            fontSize,
            -40,
          )}
          <Circle cx="0" cy="-80" r="40" fill="url(#radGrad)" opacity="0.5" />
          <Path
            transform={[{ translateX: 0 }, { translateY: -80 }]}
            fill="url(#grad)"
            stroke="black"
            strokeWidth={0.5}
            strokeOpacity={0.3}
            d="M-13-28C-15-28-16-27-16-25V-21H-14V-25H-12V18A4 4 90 01-9 22 4 4 90 01-13 26 4 4 90 01-17 22 4 4 90 01-14 18V-21H-16V17H-16C-18 18-19 20-19 22-19 26-16 28-13 28S-7 26-7 22C-7 20-8 18-10 17H-10V-25C-10-27-11-28-13-28ZM0-26C-2-24-4-21-6-19A74 74 90 01-8-20V-17C-5-18-3-18 0-18 10-18 18-11 18 0 18 10 10 18 0 18-2 18-3 18-5 18A9 9 90 01-4 21 77 77 90 010 26C0 26 5 18 5 18 5 18 13 22 13 22 13 22 14 14 14 14A76 76 90 0122 13C22 13 18 5 18 5 18 5 26 0 26 0 26 0 18-6 18-6 18-6 22-13 22-13 14-14 22-13 14-14A76 76 90 0113-23C13-23 5-19 5-19 5-19 0-26 0-26ZM-16-20V-18H-12V-16H-16ZM0-16C-3-16-5-16-8-15V15C-5 16-4 16 0 16 9 16 16 9 16 0 16-9 9-16 0-16ZM-18-14A77 77 90 01-23-13C-23-13-19-6-19-6-19-6-26 0-26 0-26 0-19 5-19 5-19 5-23 13-23 13-21 13-19 13-18 13V6A18 18 90 01-19 0 18 18 90 01-18-6V-14ZM-16-10V-10H-12V-8H-16ZV-1H-12V1H-16ZV8H-12V10H-16ZM-13 19C-15 18-17 21-16 23-16 21-14 19-13 19Z"
          />
        </G>
      </PetalBox>
      {vThermoMode.state && (
        <>
          <HarmonizerWheel
            origin={origin}
            draggable={false}
            radii={radii}
            fOnPhase={fSetHarmonizer}
          />

          <PetalBox
            origin={[50, Dimensions.get("window").height / 2]}
            radii={[20, 50]}
            dC={dC}
            dL={dL}
            dAR={dR}
            arcLength={2.5 / 7}
            rotationR={-11 / 7}
          >
            <G transform={[{ rotate: 11 / 7 + "rad" }]}>
              <Text {...textProps} y={-25} fontSize={fontSize}>
                {vTemp.state.k + "K"}
              </Text>
            </G>
          </PetalBox>
          <PetalBox
            origin={[50, Dimensions.get("window").height / 2 - 30]}
            radii={[20, 50]}
            dC={dC}
            dL={dL}
            dAR={dR}
            arcLength={2.5 / 7}
            rotationR={-11 / 7}
          >
            <G transform={[{ rotate: 11 / 7 + "rad" }]}>
              {fTextWrapSVG(
                ["Light", "Temp"],
                { ...textProps, fontSize: fontSize - 2 },
                fontSize,
                -fontSize / 2 - 30,
              )}
            </G>
          </PetalBox>
        </>
      )}
      {!vThermoMode.state && (
        <>
          <Tutorial
            width={300}
            height={200}
            origin={[SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 250]}
          >
            <G transform={[{ translateX: 150 }, { translateY: 0 }]}>
              {fTextWrapSVG(
                [
                  "Light Thermometer:",
                  "Point the camera at a neutral white",
                  "surface (like a sheet of paper) to",
                  "calibrate to the color temperature",
                  "of the light in the scene.",
                ],
                { ...textProps, fill: "white" },
                fontSize + 5,
                50,
              )}
            </G>
          </Tutorial>
          <Thermo
            rotationR={11 / 7}
            arcLength={2.5 / 7}
            radii={[0, 30]}
            totalLength={400}
            tempK={vTemp.state.k}
            origin={[SCREEN_WIDTH - 50, SCREEN_HEIGHT / 2]}
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

function fTextWrapSVG(
  lines: string[],
  props: React.ComponentProps<typeof Text>,
  lineHeight: number,
  startY = 0,
) {
  return (
    <>
      {lines.map((line, index) => (
        <Text
          key={`${line}-${index}`}
          {...props}
          y={startY + index * lineHeight}
        >
          {line}
        </Text>
      ))}
    </>
  );
}
