import { View } from "react-native";
import { useUserContext } from "./Contexts/UserContext";
import { usePurchaseContext } from "./Contexts/PurchaseContext";
import { cDimH, cDimW } from "./utils/ScreenDimensions";
import {
  Defs,
  LinearGradient,
  Rect,
  Stop,
  Svg,
  Text,
  G,
  Path,
  Image,
} from "react-native-svg";
import { eLayers } from "./Contexts/UserContext";
import { useEffect } from "react";
import { fTextWrapSVG } from "./Buttons/Tutorial";
import { usePanHitBox, tPanHitBox } from "./Buttons/PanHitBox";
import { scheduleOnRN } from "react-native-worklets";
const image1 = require("../assets/ReColorPromo0.png");
const image2 = require("../assets/UndertonePromo0.png");

export default function PayWall() {
  const { vAccentAR, vAccentL, vAccentC } = useUserContext();
  const { purchase, restore } = usePurchaseContext();
  const capsuleWidth = cDimW(0.5);

  useEffect(() => {
    vAccentAR.dispatch(40 / 7);
    vAccentL.dispatch(1);
    vAccentC.dispatch(0.5);
  }, []);

  return (
    <Svg
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        position: "absolute",
        zIndex: eLayers.buckets - 1,
      }}
      onTouchStart={() => {
        scheduleOnRN(purchase);
      }}
    >
      <Defs>
        <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="rgb(255,125,125)" stopOpacity="1" />
          <Stop offset="1" stopColor="rgb(125,125,255)" stopOpacity="1" />
        </LinearGradient>
        <LinearGradient id="grad2" x1="-.25" y1="0" x2="1.25" y2="1">
          <Stop offset="0" stopColor="rgb(255,75,75)" stopOpacity="1" />
          <Stop offset="1" stopColor="rgb(75,75,255)" stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad)" />
      <Text
        fill="white"
        fontSize="24"
        fontWeight="bold"
        x="50%"
        y="14%"
        textAnchor="middle"
        alignmentBaseline="middle"
        fontFamily="Outfit"
      >
        Unlock Premium Features
      </Text>
      <Text
        fill="white"
        fontSize="18"
        fontWeight="bold"
        x={cDimW(0.5)}
        y={cDimH(0.17)}
        textAnchor="middle"
        alignmentBaseline="middle"
        fontFamily="Outfit"
      >
        by subscribing for just $2 a Month
      </Text>
      <G transform={[{ translateX: cDimW(0.5) }, { translateY: cDimH(0.26) }]}>
        {fTextWrapSVG(
          [
            "Use the Undertone Camera to find the undertone colors",
            " of surfaces and find colors to harmonize with them.",
            "Then use the ReColor Camera to see what your space ",
            "would look like with your chosen color schemes.",
          ],
          cDimH(0.12),
          [0, 0],
          {
            fontSize: 16,
            fontWeight: "500",
            fill: "white",
            fontFamily: "Outfit",
            textAnchor: "middle",
            alignmentBaseline: "middle",
            letterSpacing: 0,
          },
        )}
      </G>
      <Image
        x={cDimW(0.1)}
        y={cDimH(0.33)}
        width={cDimW(0.4)}
        height={cDimW(0.85)}
        href={image1}
      />
      <Image
        x={cDimW(0.5)}
        y={cDimH(0.33)}
        width={cDimW(0.4)}
        height={cDimW(0.85)}
        href={image2}
      />
      <G transform={[{ translateX: cDimW(0.5) }, { translateY: cDimH(0.79) }]}>
        {fTextWrapSVG(
          [
            "Subscriptions help support me to continue",
            "developing new and interesting design apps,",
            "You can try the app with a 3-day free trial, and can ",
            "cancel subscriptions anytime from the App Store",
          ],
          cDimH(0.1),
          [0, 0],
          {
            fontSize: 15,
            fontWeight: "300",
            fill: "white",
            fontFamily: "Outfit",
            textAnchor: "middle",
            alignmentBaseline: "middle",
          },
        )}
      </G>
      <Path
        d={`M-${capsuleWidth / 2}-${capsuleWidth / 8}A1 1 0 00-${capsuleWidth / 2} ${capsuleWidth / 8}H${capsuleWidth / 2}A1 1 0 00${capsuleWidth / 2}-${capsuleWidth / 8}Z`}
        x={cDimW(0.5)}
        y={cDimH(0.9)}
        fill="url(#grad2)"
        stroke="white"
        strokeWidth="2"
      />
      <Text
        fill="white"
        fontSize="18"
        fontWeight="1000"
        x={cDimW(0.5)}
        y={cDimH(0.9)}
        textAnchor="middle"
        alignmentBaseline="middle"
        fontFamily="Outfit"
        opacity=".9"
      >
        Start Free Trial
      </Text>
    </Svg>
  );
}
