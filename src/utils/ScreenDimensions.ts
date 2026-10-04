import { Dimensions } from "react-native";
export const cWide =
  Dimensions.get("window").width / Dimensions.get("window").height > 0.6;
export function cDimW(value = 1) {
  "worklet";
  if (value < 0) {
    return Dimensions.get("window").width * (1 + value);
  }
  return Dimensions.get("window").width * value;
}
export function cDimH(value = 1) {
  "worklet";
  if (value < 0) {
    return Dimensions.get("window").height * (1 + value);
  }
  return Dimensions.get("window").height * value;
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
