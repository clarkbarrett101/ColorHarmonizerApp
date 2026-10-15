import Svg, { Text } from "react-native-svg";
import Animated from "react-native-reanimated";
import { cDimH, cDimW } from "../utils/ScreenDimensions";
import { ePages, useUserContext } from "../Contexts/UserContext";
import { useAnimatedProps } from "react-native-reanimated";
import { fCLARColorToString } from "../utils/CLAcolor";

export function PageTitle({ title }: { title: ePages }) {
  const titles: Record<Partial<ePages>, string> = {
    "Color Seasons": "Color by Season",
    "Color Harmonizer": "Color Harmonizer",
    "Palette Library": "Palette Library",
    "Scheme Selector": "Color Harmonizer",
    "Chip Selector": "Color Harmonizer",
    "Color Search": "Search for Colors",
    "Color Wheel": "Color Wheel",
    "Color Mixer": "Color Mixer",
    "Undertone Camera": "Undertone Camera",
    "ReColor Camera": "ReColor Camera",
    "Main Menu": "Select a Color Tool",
    "Find a Color": "",
    PayWall: "",
  };
  return (
    <Svg
      style={{
        position: "absolute",
        top: cDimH(0.012),
        right: 0,
      }}
      width={cDimH(0.3)}
      height={cDimH(0.12)}
      viewBox="-100 -50 200 100"
    >
      <Text
        x="100"
        y="0"
        textAnchor="end"
        fontFamily="Outfit"
        fontWeight="200"
        alignmentBaseline="baseline"
        fontSize="20"
        opacity="0.25"
      >
        {titles[title] ?? title}
      </Text>
    </Svg>
  );
}
