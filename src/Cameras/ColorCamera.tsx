import { Dimensions, View } from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from "react-native-vision-camera";
import { useSharedValue as useCoreShared } from "react-native-worklets-core";
import Animated, {
  useAnimatedProps,
  useAnimatedReaction,
  useSharedValue as useAnimShared,
  useDerivedValue,
  withDecay,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useEffect, useState } from "react";
import { ColorWheel } from "../ColorWheels/ColorWheel";
import {
  RadialContext,
  wDefaultAngleToChord,
  wDefaultChordToAngle,
} from "../Radials/RadialContext";
import { tRadialObject } from "../Radials/SectorTypes";
import { fCLARColorToString, fYUVToCLARColor } from "../utils/CLAcolor";
import { GlassView } from "expo-glass-effect";
import { useUserContext } from "../Contexts/UserContext";

export function ColorCamera({
  radii = [20, 160],
  chord = 24,
  arcLength = 43.9 / 7,
  rotationR = 22 / 7,
}: tRadialObject) {
  const { hasPermission, requestPermission } = useCameraPermission();
  if (!hasPermission) {
    requestPermission();
    return null;
  }
  const device = useCameraDevice("back");
  if (device == null) return null;
  const vCamColor = useCoreShared({ ar: 0, c: 0, l: 0 });
  const vAnimAr = useAnimShared(0);
  const vChroma = useAnimShared(0);
  const [color, setColor] = useState({ ar: 0, c: 0, l: 0 });
  const { vColorModel } = useUserContext();
  useEffect(() => {
    const interval = setInterval(() => {
      let angle = wDefaultChordToAngle(
        wDefaultAngleToChord(vCamColor.value.ar, arcLength, chord, rotationR),
        arcLength,
        chord,
        rotationR,
      );
      if (Math.abs(angle - vAnimAr.value) > 22 / 7) {
        angle = angle > vAnimAr.value ? angle - 44 / 7 : angle + 44 / 7;
      }
      console.log(
        "Animating color towards camera color",
        angle,
        vCamColor.value,
        vAnimAr.value,
      );
      vAnimAr.value = withSpring(angle, {
        duration: 0.9,
        dampingRatio: 0.2,
      });
      vChroma.value = vCamColor.value.c ** 0.5;
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const frameProcessor = useFrameProcessor((frame) => {
    "worklet";
    if (frame.pixelFormat === "yuv" && frame.planesCount > 1) {
      const buffer = new Uint8Array(frame.toArrayBuffer());
      const uvPlane = buffer.slice(buffer.length / 2, buffer.length);
      let totalU = 0;
      let totalV = 0;
      for (let i = -8; i < 8; i += 2) {
        for (let j = -8; j < 8; j += 2) {
          const index =
            ((frame.height / 2 + i) * (frame.width / 2) +
              (frame.width / 2 + j)) *
            2;
          totalU += uvPlane[index];
          totalV += uvPlane[index + 1];
        }
      }
      const avgU = (totalU / 64 - 128) / 256;
      const avgV = (totalV / 64 - 128) / 256;

      vCamColor.value = fYUVToCLARColor(
        [0.5, avgU, avgV],
        vColorModel.shared.value,
      );
    }
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <Camera
        style={{ flex: 1 }}
        device={device}
        isActive={true}
        pixelFormat="yuv"
        frameProcessor={frameProcessor}
      />
      <RadialContext
        value={{
          wUpdateState: () => {
            "worklet";
          },
          origin: [
            Dimensions.get("window").width + 50,
            Dimensions.get("window").height / 2,
          ],
        }}
      >
        <ColorWheel
          vRotationROffset={vAnimAr}
          wheelCenter={22 / 7}
          chord={chord}
          radii={radii}
        />
      </RadialContext>

      <GlassView
        style={{
          flex: 1,
          position: "absolute",
          top: Dimensions.get("window").height / 2 - 20,
          left: Dimensions.get("window").width / 2 - 20,
          width: 40,
          height: 40,
          borderRadius: 20,
        }}
        glassEffectStyle={"clear"}
      />
    </View>
  );
}
