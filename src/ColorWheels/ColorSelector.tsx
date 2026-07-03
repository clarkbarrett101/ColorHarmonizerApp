import { useCallback, useEffect, useState } from "react";
import { fCLARColorToRGB, tBrand, tCLARColor, tPaint } from "../utils/CLAcolor";
import { ColorWheel } from "../ColorWheels/ColorWheel";
import { TintSelector } from "../ColorWheels/TintSelector";
import { Dimensions, View } from "react-native";
import PanManager from "../Contexts/PanManager";
import {
  RadialContext,
  wDefaultAngleToChord,
  wDefaultChordToAngle,
} from "../Radials/RadialContext";
import { useDerivedValue, useSharedValue } from "react-native-reanimated";
import { ColorChipFan } from "../Chips/ChipStack";
import { scheduleOnRN } from "react-native-worklets";
import { eLayers } from "../Contexts/UserContext";
import { eChipSizes } from "../Chips/PaintChip";
import { useVerse } from "../utils/Verse";
import { useBucketContext } from "../Buckets/BucketContext";
import { BGGradient } from "../ColorWheels/BGGradient";
import { tAttributeModifier } from "../utils/Actor";
import { tRadialObject } from "../Radials/SectorTypes";
import { BrandFilter } from "../ColorWheels/BrandFilter";

type tColorSelector = tRadialObject & {
  wheelCenter?: number;
  direction?: 1 | -1;
  litDimensions?: [number, number];
  litRange?: [number, number];
  chromaRange?: [number, number];
  chromaDimensions?: [number, number];
  chromaArcRotation?: [number, number];
  lightnessArcRotation?: [number, number];
};
export default function ColorSelector({
  wheelCenter = 22 / 7,
  radii = [50, 250],
  litDimensions = [4, 5],
  litRange = [0.15, 1],
  chromaRange = [0.1, 0.8],
  chromaDimensions = [4, 4],
  chromaArcRotation = [4.4 / 7, 16 / 7],
  lightnessArcRotation = [5.5 / 7, 28 / 7],
  origin = [
    Dimensions.get("window").width + radii[1] * 0.3,
    Dimensions.get("window").height * 0.45,
  ],
}: tColorSelector) {
  /// O N  M O U N T ///

  const vSideA = useVerse(true);
  const vTargetColor = useVerse<tCLARColor>({
    c: 0.5,
    l: 0.5,
    ar: 0,
  });
  const [brand, setBrand] = useState<tBrand>("All Brands");
  const vWheelRotation = useSharedValue(wheelCenter);
  const vChromaPanPos = useSharedValue({
    angle: chromaArcRotation[1] + chromaArcRotation[0] / 3,
    radius: radii[1],
  });
  const vLightnessPanPos = useSharedValue({
    angle: lightnessArcRotation[1],
    radius: radii[1],
  });
  const { registerBucket, unregisterBucket } = useBucketContext();

  useEffect(() => {
    registerBucket({
      origin: [
        Dimensions.get("window").width - eChipSizes.default[0] / 3,
        Dimensions.get("window").height / 2,
      ],
      radii: [radii[1] - 75, radii[1]],
      callback: fOnDrop,
      targetLayerRange: [eLayers.chipHand, eLayers.chipHand + 100],
      id: 20,
    });
    return () => {
      unregisterBucket("" + 20);
    };
  }, []);

  /// C L AR  C O L O R ///

  const dC = useDerivedValue(() => {
    let c =
      (vChromaPanPos.value.angle -
        chromaArcRotation[1] +
        chromaArcRotation[0] / 2) /
      chromaArcRotation[0];
    c = (c - 0.5 / chromaDimensions[1]) / (1 - 1 / chromaDimensions[1]);
    c = chromaRange[0] + c * (chromaRange[1] - chromaRange[0]);
    c = Math.round(c * 100) / 100;
    return c;
  });
  const dL = useDerivedValue(() => {
    let l =
      1 -
      (vLightnessPanPos.value.angle -
        lightnessArcRotation[1] +
        lightnessArcRotation[0] / 2) /
        lightnessArcRotation[0];
    l = (l - 0.5 / litDimensions[1]) / (1 - 1 / litDimensions[1]);
    l = litRange[0] + l * (litRange[1] - litRange[0]);
    l = Math.round(l * 100) / 100;
    return l;
  });
  const dAR = useDerivedValue(() => {
    let ar = ((vWheelRotation.value % (44 / 7)) + 44 / 7) % (44 / 7);
    ar = Math.round(ar * 100) / 100;
    return ar;
  });

  /// C A L L B A C K S ///

  const chromaModifier: tAttributeModifier = {
    modID: 0,
    deps: [dC, dL, dAR],
    modifier: (input) => {
      "worklet";
      const _ = vChromaPanPos.value;
      let chord = input.chord / (chromaDimensions[1] - 1);
      let rd = input.ring / (chromaDimensions[0] - 1);
      let c = chromaRange[0] + chord * (chromaRange[1] - chromaRange[0]);
      rd = 0.5 + rd * 0.5;
      c *= rd;
      const l = dL.value * rd;
      const ar = dAR.value;
      const [r, g, b] = fCLARColorToRGB({ c, l, ar });
      return {
        ...input,
        red: r,
        green: g,
        blue: b,
      };
    },
  };

  const lightnessModifier: tAttributeModifier = {
    modID: 1,
    deps: [dC, dAR],
    modifier: (input) => {
      "worklet";
      const _ = vLightnessPanPos.value;
      let l = 1 - (input.chord + 0.5) / (litDimensions[1] - 1);
      l = litRange[0] + l * (litRange[1] - litRange[0]);
      let r = input.ring / (litDimensions[0] - 1);
      l *= r * 0.25 + 0.75;
      r = 0.5 + r * 0.5;
      const c = dC.value * r;
      const ar = dAR.value;
      const [red, green, blue] = fCLARColorToRGB({ c, l, ar });
      return {
        ...input,
        red,
        green,
        blue,
      };
    },
  };

  const wUpdateState = useCallback(
    (pc?, pl?, par?) => {
      "worklet";
      const c = pc !== undefined ? pc : dC.value;
      const l = pl !== undefined ? pl : dL.value;
      const ar = par !== undefined ? par : dAR.value;
      console.log("Updating state with", { c, l, ar });
      vTargetColor.dispatch({
        c,
        l,
        ar,
      });
      vSideA.dispatch(!vSideA.shared.value);
    },
    [dC, dL, dAR, vTargetColor, vSideA],
  );

  const fOnDrop = useCallback((paint: tPaint) => {
    console.log("Dropped paint", paint);
    const c = paint.clar.c;
    const l = paint.clar.l;
    let pAR = wDefaultAngleToChord(paint.clar.ar, 44 / 7, 24, 0);
    pAR = wDefaultChordToAngle(pAR, 44 / 7, 24, 0);
    vWheelRotation.value = pAR;
    let pL =
      lightnessArcRotation[1] -
      lightnessArcRotation[0] / 2 +
      lightnessArcRotation[0] * (1 - l);
    pL = wDefaultAngleToChord(
      pL,
      lightnessArcRotation[0],
      litDimensions[1],
      lightnessArcRotation[1],
    );
    pL = wDefaultChordToAngle(
      pL,
      lightnessArcRotation[0],
      litDimensions[1],
      lightnessArcRotation[1],
    );
    vLightnessPanPos.value = { angle: pL, radius: radii[1] };
    let pC =
      chromaArcRotation[1] -
      chromaArcRotation[0] / 2 +
      chromaArcRotation[0] * c;
    pC = wDefaultAngleToChord(
      pC,
      chromaArcRotation[0],
      chromaDimensions[1],
      chromaArcRotation[1],
    );
    pC = wDefaultChordToAngle(
      pC,
      chromaArcRotation[0],
      chromaDimensions[1],
      chromaArcRotation[1],
    );
    vChromaPanPos.value = { angle: pC, radius: radii[1] };
    wUpdateState(paint.clar.c, paint.clar.l, paint.clar.ar);
  }, []);

  function dispatchBrand(brand: tBrand) {
    setBrand(brand);
    wUpdateState();
  }

  /// R E N D E R ///
  return (
    <>
      <View>
        <RadialContext
          value={{
            radii,
            origin,
            dC,
            dL,
            dAR,
            wUpdateState,
          }}
        >
          <BGGradient />
          <TintSelector
            key={`Lightness Selector`}
            arcLength={lightnessArcRotation[0]}
            rotationR={lightnessArcRotation[1]}
            ring={litDimensions[0]}
            chord={litDimensions[1]}
            radii={[radii[1] - 50, radii[1] + 75]}
            vPanPos={vLightnessPanPos}
            colorModifier={lightnessModifier}
          />
          <TintSelector
            key={`Chroma Selector`}
            arcLength={chromaArcRotation[0]}
            rotationR={chromaArcRotation[1]}
            ring={chromaDimensions[0]}
            chord={chromaDimensions[1]}
            radii={[radii[1] - 50, radii[1] + 75]}
            vPanPos={vChromaPanPos}
            colorModifier={chromaModifier}
          />
          <ColorWheel
            radii={radii}
            ring={5}
            chord={24}
            vRotationROffset={vWheelRotation}
            wheelCenter={wheelCenter}
          />
        </RadialContext>
      </View>
      <PanManager zIndex={eLayers.chipHand}>
        <BrandFilter
          brand={brand}
          setBrand={dispatchBrand}
          height={50}
          width={(50 * (1 + Math.sqrt(5))) / 2}
          totalArcLength={3 / 7}
          mainRotationR={11 / 7}
          origin={[Dimensions.get("window").width - 60, 75]}
          dAR={dAR}
          dC={dC}
          dL={dL}
        />
      </PanManager>
      <ColorChipFan
        targetColor={vTargetColor.state}
        targetNumber={9}
        brand={brand}
        origin={origin}
        size={"default"}
        rotationR={21.5 / 7}
        arcLength={13 / 7}
        radius={radii[1] * 1.6}
        sideA={vSideA.state}
        cSteps={chromaDimensions[1]}
        lSteps={litDimensions[1]}
        arSteps={24}
        groupLayer={eLayers.chipFan}
      />
    </>
  );
}
/*
    
             
      */
