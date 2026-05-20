import { View } from "react-native";
import React, { useState } from "react";
import { tBrand, tCLARColor } from "./CLAcolor";
import { ColorButton } from "./ColorButton";
import PanManager from "./PanManager";
import { RadialMenu } from "./RadialMenu";
import { tAttributeModifier } from "./Actor";
import { transform } from "@babel/core";
import { TextProps, Text } from "react-native-svg";
import { PetalMenu } from "./PetalMenu";
export type tBrandFilter = {
  brand: tBrand;
  setBrand: (brand: tBrand) => void;
  width?: number;
  height?: number;
};
export default function BrandFilter({
  brand,
  setBrand,
  width = 200,
  height = 200,
}: tBrandFilter) {
  const [open, setOpen] = useState(true);
  const brands: tBrand[] = [
    "All Brands",
    "Behr",
    "Benjamin Moore",
    "Sherwin-Williams",
    "PPG",
    "Valspar",
  ];

  const toggleOpen = () => setOpen((prev) => !prev);
  const optionNodes = () => {
    const nodes = [];
    if (open) {
      for (const key in brands) {
        nodes.push(<Text key={key}>{brands[key]}</Text>);
      }
    } else {
      nodes.push(<Text key={"selected"}>{brand}</Text>);
    }
    return nodes;
  };
  function onValueChange(index: number) {
    setBrand(brands[index]);
    toggleOpen();
  }
  return (
    <PetalMenu
      options={open ? brands : [brand]}
      width={width}
      height={height}
      onValueChange={onValueChange}
    />
  );
}
