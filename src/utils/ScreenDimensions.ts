import { Dimensions } from "react-native";
export const cWide =
  Dimensions.get("window").width / Dimensions.get("window").height > 0.6;
  const width= Math.min(Dimensions.get("window").width, Dimensions.get("window").height);
  const height= Math.min(Dimensions.get("window").width, Dimensions.get("window").height);
export function cDimW(value = 1) {
  "worklet";
  if (value < 0) {
    return width * (1 + value);
  }
  return width * value;
}
export function cDimH(value = 1) {
  "worklet";
  if (value < 0) {
    return height * (1 + value);
  }
  return height * value;
}
export function cRaxelW(tall = 1, wide = tall) {
  "worklet";
  if (cWide) {
    return cDimW(wide);
  }
  return cDimW(tall);
}
export function cRaxelH(tall = 1, wide = tall) {
  "worklet";
  if (cWide) {
    return cDimH(wide);
  }
  return cDimH(tall);
}
