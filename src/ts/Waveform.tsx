import { View, Text, Dimensions } from "react-native";
import React, { use, useMemo, useRef } from "react";
import Skia, {
  Canvas,
  Circle,
  Line,
  SkPoint,
} from "@shopify/react-native-skia";
import { useSoundContext } from "./SoundContext";
import { useFrameCallback, useSharedValue } from "react-native-reanimated";
import { eLayers } from "./UserContext";

type Point = {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  color: string;
};
export function Waveform() {
  const { analyzer } = useSoundContext();
  const rCanvas = useRef<Skia.CanvasRef>(null);
  const freqs = useSharedValue<Uint8Array>(new Uint8Array(32));

  return (
    <Canvas
      ref={rCanvas}
      style={{ flex: 1, backgroundColor: "black", zIndex: eLayers.chipHand }}
    ></Canvas>
  );
}
