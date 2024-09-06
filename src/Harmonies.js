export default function harmonizeColors(color0, color1, numSections = 36) {
  function invertColor(color) {
    return (color + 180) % 360;
  }
  let colorA = color0;
  let colorB = color1;
  if (colorA === -1 || colorB === -1) {
    return [];
  }

  let complementary = [];
  let splitComplementary = [];
  let triadic = [];
  let analogous = [];
  let doubleSplitComplementary = [];
  let tetradic = [];

  if (colorA > colorB) {
    let temp = colorA;
    colorA = colorB;
    colorB = temp;
  }
  let different = colorB - colorA;
  let middle = (colorA + colorB) / 2;
  let loopSide = false;
  if (colorA + 360 - colorB < different) {
    different = colorA + 360 - colorB;
    middle = (colorA + 360 + colorB) / 2;
    loopSide = true;
  }
  const diff = (100 * different) / 360;
  const mod = 360 / numSections;
  if (diff > 46) {
    complementary.push([colorA, colorB]);
    tetradic.push([colorA, colorB, colorA + 90, colorB + 90]);
    doubleSplitComplementary.push([colorA, colorB, colorA + 30, colorB + 30]);
    doubleSplitComplementary.push([colorA, colorB, colorA - 30, colorB - 30]);
  } else {
    if (diff < 28 && diff > 20) {
      tetradic.push([colorA, colorB, invertColor(colorA), invertColor(colorB)]);
    } else {
      doubleSplitComplementary.push([
        colorA,
        colorB,
        invertColor(colorA),
        invertColor(colorB),
      ]);
    }
    if (diff < 40 && diff > 28) {
      triadic.push([colorA, colorB, invertColor(middle)]);
    }
    if (diff <= 30) {
      analogous.push([colorA, colorB, middle]);
      if (diff <= 28) {
        splitComplementary.push([colorB, colorA, invertColor(middle)]);
        if (diff < 15) {
          analogous.push([colorA, colorB, middle + 1.5 * different]);
          analogous.push([colorA, colorB, middle - 1.5 * different]);
        }
      }
    } else if (diff > 40) {
      splitComplementary.push([
        colorA,
        colorB,
        loopSide ? colorB + 2 * different : colorB - 2 * different,
      ]);

      splitComplementary.push([
        colorA,
        colorB,
        loopSide ? colorA - 2 * different : colorA + 2 * different,
      ]);
    }
  }
  let total = 0;
  if (analogous.length > 0) {
    total++;
  }
  if (complementary.length > 0) {
    total++;
  }
  if (splitComplementary.length > 0) {
    total++;
  }
  if (triadic.length > 0) {
    total++;
  }
  if (tetradic.length > 0) {
    total++;
  }
  if (doubleSplitComplementary.length > 0) {
    total++;
  }

  const flags = {
    analogous: analogous.length > 0,
    complementary: complementary.length > 0,
    splitComplementary: splitComplementary.length > 0,
    triadic: triadic.length > 0,
    tetradic: tetradic.length > 0,
    doubleSplitComplementary: doubleSplitComplementary.length > 0,
    total: total,
  };

  let output = [
    ...analogous,
    ...complementary,
    ...splitComplementary,
    ...triadic,
    ...tetradic,
    ...doubleSplitComplementary,
  ];

  return [output, flags];
}
