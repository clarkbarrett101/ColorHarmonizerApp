import { scheduleOnRN } from "react-native-worklets";
import RevenueCatUI from "react-native-purchases-ui";
import { useEffect } from "react";
import { View } from "react-native";
import { useUserContext, eLayers } from "./Contexts/UserContext";
import { usePurchaseContext } from "./Contexts/PurchaseContext";
export default function PayWall() {
  const { vAccentAR, vAccentL, vAccentC } = useUserContext();
  const { restore } = usePurchaseContext();
  useEffect(() => {
    vAccentAR.dispatch(40 / 7);
    vAccentL.dispatch(1);
    vAccentC.dispatch(0.5);
  }, []);

  return (
    <View style={{ flex: 1, zIndex: eLayers.superMax - 1 }}>
      <RevenueCatUI.Paywall onPurchaseCompleted={restore} />
    </View>
  );
}
/*
const image1 = require("../assets/ReColorPromo0.png");
const image2 = require("../assets/UndertonePromo0.png");
export default function PayWall() {
  const { vAccentAR, vAccentL, vAccentC } = useUserContext();
  const { purchase, restore } = usePurchaseContext();
  const capsuleWidth = cRaxelW(0.5, 0.3);

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
        fontSize={cDimH(0.035)}
        fontWeight="bold"
        x={cDimW(0.5)}
        y={cRaxelH(0.14, 0.1)}
        textAnchor="middle"
        alignmentBaseline="middle"
        fontFamily="Outfit"
      >
        Unlock Premium Features
      </Text>
      <Text
        fill="white"
        fontSize={cDimH(0.025)}
        fontWeight="bold"
        x={cDimW(0.5)}
        y={cRaxelH(0.17, 0.13)}
        textAnchor="middle"
        alignmentBaseline="middle"
        fontFamily="Outfit"
      >
        by subscribing for just $2 a Month
      </Text>
      <G>
        {fTextWrapSVG(
          [
            "Use the Undertone Camera to find the undertone colors",
            " of surfaces and find colors to harmonize with them.",
            "Then use the ReColor Camera to see what your space ",
            "would look like with your chosen color schemes.",
          ],
          cDimH(0.12),
          [cDimW(0.5), cRaxelH(0.26, 0.22)],
          {
            fontSize: cRaxelH(0.017, 0.02),
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
        x={cRaxelW(0.1, 0.15)}
        y={cRaxelH(0.33, 0.29)}
        width={cRaxelW(0.4, 0.33)}
        height={cRaxelW(0.85, 0.58)}
        href={image1}
        preserveAspectRatio="xMidYMin slice"
      />
      <Image
        x={cRaxelW(0.5, 0.55)}
        y={cRaxelH(0.33, 0.29)}
        width={cRaxelW(0.4, 0.33)}
        height={cRaxelW(0.85, 0.58)}
        href={image2}
        preserveAspectRatio="xMidYMin slice"
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
            fontSize: cDimH(0.018),
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
        fontSize={cDimH(0.03)}
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
*/
