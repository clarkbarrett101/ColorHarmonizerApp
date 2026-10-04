import { useEffect } from "react";
import { usePurchaseContext } from "../Contexts/PurchaseContext";
import { useChipContext } from "../Chips/ChipContext";
import { useDemo } from "../Contexts/DemoContext";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { HarmonizerWheel } from "./HarmonizerWheel";
import { useVerseRelay } from "../utils/Verse";
import { fCLARColorToString, fGetRandomPalette } from "../utils/CLAcolor";
import { Paths } from "../utils/Paths";
import { cDimH, cDimW, cRaxelW } from "../utils/ScreenDimensions";
import { CurvedText } from "../Buttons/CurvedText";
import React from "react";
import Button from "../Buttons/Button";
export default function ColorHarmonizer() {
  const { premium } = usePurchaseContext();
  const { vPage, pagesVisited, vUserPalette } = useUserContext();
  const linkOrigin = [cDimW(0.85), cDimH(0.1)];
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
          duration: 500,
          toPos: [cDimW(0.3), cDimH(0.6)],
        },
        {
          touching: 1,
          duration: 150,
          toPos: [cDimW(0.3), cDimH(0.6)],
        },
        {
          touching: 0,
          duration: 150,
          toPos: [cDimW(0.3), cDimH(0.6)],
        },
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
          toPos: [cDimW(1), cDimH(0.5)],
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
          toPos: [cDimW(0.4), cDimH(0.6)],
        },
        {
          touching: 1,
          duration: 300,
          toPos: [cDimW(0.4), cDimH(0.6)],
        },
        {
          touching: 0,
          duration: 300,
          toPos: [cDimW(0.4), cDimH(0.6)],
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
      <Button
        path={Paths.camera}
        layer={eLayers.superMax}
        origin={linkOrigin as [number, number]}
        size={cDimH(0.1)}
        viewRadius={85}
        onPress={() => {
          vPage.dispatch("Undertone Camera");
        }}
        textCircle={{
          topText: "Undertone",
          bottomText: "Camera",
          radii: [65, 70],
          topTextProps: {
            fontSize: 20,
            fill: "rgba(255,255,255,1)",
            letterSpacing: 1,
          },
          bottomTextProps: {
            fontSize: 20,
            fill: "rgba(255,255,255,1)",
            letterSpacing: 4,
          },
        }}
      />

      <Button
        path={Paths.replay}
        layer={eLayers.superMax}
        origin={[cDimH(0.05), cDimH(0.14)]}
        size={cDimH(0.05)}
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
        radii={[0, cRaxelW(0.9, 0.65)]}
        convex={true}
        rotationR={3.5 / 7}
        origin={[cDimW(), cDimH(0.55)]}
        layer={eLayers.colorMixer}
        color="rgba(0,0,0,.65)"
        fontSize={30}
        drawCurve={false}
      />
      <CurvedText
        text="to Harmonize"
        radii={[0, cRaxelW(0.8, 0.6)]}
        convex={true}
        rotationR={3.8 / 7}
        origin={[cDimW(), cDimH(0.55)]}
        layer={eLayers.colorMixer}
        color="rgba(0,0,0,.65)"
        fontSize={30}
        drawCurve={false}
      />
    </>
  );
}
