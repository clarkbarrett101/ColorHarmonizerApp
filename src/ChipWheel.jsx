import * as React from "react";
import { useEffect } from "react";
import Svg, { G, Path } from "react-native-svg";
import { Hsluv } from "./hsluv";
export default function ChipWheel({
  hue,
  setHue,
  saturation,
  setSaturation,
  lightness,
  setLightness,
}) {
  const [chipIndex, setChipIndex] = React.useState(0);
  const [chips, setChips] = React.useState([]);
  const numSections = 12;
  function getFill(index) {
    let hsluv = new Hsluv();
    hsluv.hsluv_h = index * (360 / numSections);
    hsluv.hsluv_s = saturation;
    hsluv.hsluv_l = lightness;
    return hsluv.hsluvToHex();
  }
  useEffect(() => {
    let chipList = [];
    chipList.push(
      <Path
        d="M186 31.7l5.5 24c.2.9 0 1.8-.4 2.5l-37.4 64.9c-1 1.7-3.1 2.3-4.8 1.3L87.8 89c-1.7-1-2.3-3.1-1.3-4.8l46.4-80.5c1-1.7 3.1-2.3 4.8-1.3l46.6 27c.8.5 1.4 1.3 1.7 2.3z"
        fill={getFill(0)}
        stroke="#000"
        strokeWidth=".8px"
      />
    );
    chipList.push(
      <Path
        d="M139.2 3.2l16.7 18c.6.7.9 1.5.9 2.4v74.9c0 1.9-1.6 3.5-3.5 3.5H82.7c-1.9-.1-3.5-1.7-3.5-3.7V5.5c0-1.9 1.6-3.5 3.5-3.5h53.9c1 0 1.9.5 2.6 1.2z"
        stroke="#000"
        strokeWidth=".8px"
        fill={getFill(1)}
      />
    );
    chipList.push(
      <Path
        d="M81.9 2.1l23.5 7.2c.9.3 1.6.8 2 1.6l37.4 64.9c1 1.7.4 3.8-1.3 4.8l-61.2 35.2c-1.7 1-3.8.4-4.8-1.3L31.1 34.1c-1-1.7-.4-3.8 1.3-4.8L79.1 2.4c.8-.5 1.9-.6 2.8-.3z"
        fill={getFill(2)}
        stroke="#000"
        strokeWidth=".8px"
      />
    );
    chipList.push(
      <Path
        d="M31.4 29.5l24-5.5c.9-.2 1.8 0 2.5.4l64.9 37.4c1.7 1 2.3 3.1 1.3 4.8l-35.4 61.1c-1 1.7-3.1 2.3-4.8 1.3L3.5 82.7c-1.7-1-2.3-3.1-1.3-4.8l27-46.7c.5-.8 1.3-1.4 2.3-1.7z"
        fill={getFill(3)}
        stroke="#000"
        strokeWidth=".8px"
      />
    );
    chipList.push(
      <Path
        d="M2.9 77.5l18-16.7c.7-.6 1.5-.9 2.4-.9h74.9c1.9 0 3.5 1.6 3.5 3.5V134c-.1 1.9-1.7 3.5-3.7 3.5H5.2c-1.9 0-3.5-1.6-3.5-3.5V80.1c0-1 .5-1.9 1.2-2.6z"
        fill={getFill(4)}
        stroke="#000"
        strokeWidth=".8px"
      />
    );
    chipList.push(
      <Path
        d="M1.9 132.7l7.2-23.5c.3-.9.8-1.6 1.6-2l64.9-37.4c1.7-1 3.8-.4 4.8 1.3l35.2 61.2c1 1.7.4 3.8-1.3 4.8l-80.4 46.4c-1.7 1-3.8.4-4.8-1.3L2.2 135.5c-.5-.8-.6-1.9-.3-2.8z"
        fill={getFill(5)}
        stroke="#000"
        strokeWidth=".8px"
      />
    );
    chipList.push(
      <Path
        d="M29.6 183.2l-5.5-24c-.2-.9 0-1.8.4-2.5l37.4-64.9c1-1.7 3.1-2.3 4.8-1.3l61.1 35.4c1.7 1 2.3 3.1 1.3 4.8l-46.4 80.4c-1 1.7-3.1 2.3-4.8 1.3l-46.6-27c-.8-.5-1.4-1.3-1.7-2.3z"
        fill={getFill(6)}
        stroke="#000"
        strokeWidth=".8px"
      />
    );
    chipList.push(
      <Path
        d="M78.5 211.8l-16.7-18c-.6-.7-.9-1.5-.9-2.4v-74.9c0-1.9 1.6-3.5 3.5-3.5H135c1.9.1 3.5 1.7 3.5 3.7v92.8c0 1.9-1.6 3.5-3.5 3.5H81.1c-1 0-1.9-.5-2.6-1.2z"
        fill={getFill(7)}
        stroke="#000"
        strokeWidth=".8px"
      />
    );
    chipList.push(
      <Path
        d="M135.7 212.8l-23.5-7.2c-.9-.3-1.6-.8-2-1.6l-37.4-64.9c-1-1.7-.4-3.8 1.3-4.8l61.2-35.2c1.7-1 3.8-.4 4.8 1.3l46.4 80.4c1 1.7.4 3.8-1.3 4.8l-46.7 26.9c-.8.5-1.9.6-2.8.3z"
        fill={getFill(8)}
        stroke="#000"
        strokeWidth=".8px"
      />
    );
    chipList.push(
      <Path
        d="M184.4 186.3l-24 5.5c-.9.2-1.8 0-2.5-.4L93 154c-1.7-1-2.3-3.1-1.3-4.8l35.4-61.1c1-1.7 3.1-2.3 4.8-1.3l80.4 46.4c1.7 1 2.3 3.1 1.3 4.8l-27 46.6c-.5.8-1.3 1.4-2.3 1.7z"
        fill={getFill(9)}
        stroke="#000"
        strokeWidth=".8px"
      />
    );
    chipList.push(
      <Path
        d="M212.8 138.1l-18 16.7c-.7.6-1.5.9-2.4.9h-74.9c-1.9 0-3.5-1.6-3.5-3.5V81.6c.1-1.9 1.7-3.5 3.7-3.5h92.8c1.9 0 3.5 1.6 3.5 3.5v53.9c0 1-.5 1.9-1.2 2.6z"
        fill={getFill(10)}
        stroke="#000"
        strokeWidth=".8px"
      />
    );
    chipList.push(
      <Path
        d="M213.8 82.6l-7.2 23.5c-.3.9-.8 1.6-1.6 2l-64.9 37.4c-1.7 1-3.8.4-4.8-1.3L100.1 83c-1-1.7-.4-3.8 1.3-4.8l80.4-46.4c1.7-1 3.8-.4 4.8 1.3l26.9 46.7c.5.8.6 1.9.3 2.8z"
        fill={getFill(11)}
        stroke="#000"
        strokeWidth=".8px"
      />
    );

    setChips(chipList);
  }, []);

  return (
    <Svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 215.3 214.7">
      {chips}
    </Svg>
  );
}
