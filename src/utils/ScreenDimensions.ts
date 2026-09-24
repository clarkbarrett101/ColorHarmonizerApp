import { Dimensions } from "react-native";

export function cDimW(value = 1) {
  if (value < 0) {
    return Dimensions.get("window").width * (1 + value);
  }
  return Dimensions.get("window").width * value;
}
export function cDimH(value = 1) {
  if (value < 0) {
    return Dimensions.get("window").height * (1 + value);
  }
  return Dimensions.get("window").height * value;
}
