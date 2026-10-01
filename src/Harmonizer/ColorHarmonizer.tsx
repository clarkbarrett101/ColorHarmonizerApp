import { useEffect } from "react";
import { useChipContext } from "../Chips/ChipContext";
import { useDemo } from "../Contexts/DemoContext";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { HarmonizerWheel } from "./HarmonizerWheel";
import { useVerseRelay } from "../utils/Verse";
import { fCLARColorToString, fGetRandomPalette } from "../utils/CLAcolor";
import { Paths } from "../utils/Paths";
import { useAnimatedProps, useDerivedValue } from "react-native-reanimated";
import { Svg, Circle, Path } from "react-native-svg";
import Animated from "react-native-reanimated";
import { cDimH, cDimW } from "../utils/ScreenDimensions";
import { CurvedText } from "../Buttons/CurvedText";
import React from "react";
import Button from "../Buttons/Button";
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
export default function ColorHarmonizer() {
  const { vAccentAR, vColorModel, vPage, pagesVisited, vUserPalette } =
    useUserContext();
  const color = useDerivedValue(() =>
    fCLARColorToString(
      { ar: vAccentAR.shared.value, c: 0.4, l: 0.7 },
      vColorModel.state,
    ),
  );
  const animProps = useAnimatedProps(() => ({
    fill: color.value,
  }));
  const linkRaduius = 100;
  const linkOrigin = [cDimW(0.6), cDimH(0.75)];
  const vPagesVisitedRelay = useVerseRelay(pagesVisited);
  const { fPlaySequence } = useDemo();
  const { holdChip } = useChipContext();
  useEffect(() => {
    if (!pagesVisited.shared.value["Color Harmonizer"]) {
      if (vUserPalette.shared.value.paints.length === 0) {
        vUserPalette.dispatch(fGetRandomPalette(1));
      }
      fPlaySequence([
        {
          touching: 0,
          duration: 1000,
          toPos: [cDimW(0.1), cDimH(0.9)],
          callback: () => {
            "worklet";
            holdChip(eLayers.chipHand);
          },
        },
        {
          touching: 1,
          duration: 1000,
          toPos: [cDimW(0.9), cDimH(0.5)],
          callback: () => {
            "worklet";
            holdChip();
          },
        },
        {
          touching: 0,
          duration: 1000,
          toPos: [cDimW(0.7), cDimH(0.5)],
        },
        {
          touching: 1,
          duration: 1000,
          toPos: [cDimW(0.8), cDimH(0.6)],
        },
        {
          touching: 0,
          duration: 1000,
          toPos: [cDimW(0.3), cDimH(0.6)],
        },
        {
          touching: 1,
          duration: 300,
          toPos: [cDimW(0.3), cDimH(0.6)],
        },
        {
          touching: 0,
          duration: 300,
          toPos: [cDimW(0.3), cDimH(0.6)],
        },
        {
          touching: 0,
          duration: 300,
          toPos: [-100, cDimH(0.6)],
        },
      ]);
      pagesVisited.dispatch({
        ...pagesVisited.shared.value,
        "Color Harmonizer": true,
      });
    }
  }, [vPagesVisitedRelay.state]);

  return (
    <>
      <HarmonizerWheel />
      <Svg
        width={linkRaduius}
        height={linkRaduius}
        style={{
          position: "absolute",
          top: linkOrigin[1] - linkRaduius / 2,
          left: linkOrigin[0] - linkRaduius / 2,
          zIndex: eLayers.buckets - 5,
          shadowColor: "black",
          shadowOffset: { width: -2, height: 2 },
          shadowOpacity: 0.5,
          shadowRadius: 2,
        }}
        viewBox={`-${85} -${85} ${170} ${170}`}
        onTouchStart={() => vPage.dispatch("Undertone Camera")}
      >
        <AnimatedCircle cx={0} cy={0} r={85} animatedProps={animProps} />
        <Path
          d="M40-25H28L18-35H-18L-28-25H-40C-47-25-50-22-50-15V20C-50 27-47 30-40 30H40C47 30 50 27 50 20V-15C50-22 47-25 40-25ZM45 20C45 23 43 25 40 25H-40C-43 25-45 23-45 20V-15C-45-18-43-20-40-20H-25L-15-30H15L25-20H40C43-20 45-18 45-15V20ZM0-22C-12-22-22-12-22 0S-12 22 0 22 22 12 22 0 12-22 0-22ZM0 16C-9 16-16 9-16 0S-9-16 0-16 16-9 16 0 9 16 0 16Z"
          fill={"white"}
        />
      </Svg>
      <CurvedText
        text="Undertone"
        radii={[0, linkRaduius / 2]}
        convex={true}
        rotationR={3 / 7}
        origin={linkOrigin as [number, number]}
        layer={eLayers.buckets - 5}
        color="white"
        fontSize={16}
        drawCurve={false}
      />
      <CurvedText
        text="C a m e r a"
        radii={[0, linkRaduius * 0.45]}
        convex={false}
        rotationR={-5 / 7}
        origin={linkOrigin as [number, number]}
        layer={eLayers.buckets - 5}
        color="white"
        fontSize={16}
        drawCurve={false}
      />
      <Button
        path={Paths.replay}
        layer={eLayers.superMax}
        origin={[cDimW(0.9), cDimH(0.8)]}
        viewRadius={30}
        onPress={() => {
          pagesVisited.dispatch({
            ...pagesVisited.shared.value,
            "Color Harmonizer": false,
          });
        }}
      />

      <CurvedText
        text="Choose two colors"
        radii={[cDimW(0.5), cDimW(0.9)]}
        convex={true}
        rotationR={4 / 7}
        origin={[cDimW(), cDimH(0.55)]}
        layer={eLayers.colorMixer}
        color="rgba(0,0,0,.65)"
        fontSize={30}
        drawCurve={false}
      />
      <CurvedText
        text="to Harmonize"
        radii={[cDimW(0.5), cDimW(0.8)]}
        convex={true}
        rotationR={4.5 / 7}
        origin={[cDimW(), cDimH(0.55)]}
        layer={eLayers.colorMixer}
        color="rgba(0,0,0,.65)"
        fontSize={30}
        drawCurve={false}
      />
    </>
  );
}
