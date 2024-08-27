export default function harmonizeColors(color0, color1, numSections = 36) {
  function invertColor(color) {
    return (color + numSections / 2) % numSections;
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
  if (colorA + numSections - colorB < different) {
    different = colorA + numSections - colorB;
    middle = (colorA + numSections + colorB) / 2;
    loopSide = true;
  }
  const diff = (100 * different) / numSections;
  if (invertColor(colorA) === colorB) {
    complementary.push([colorA, colorB]);
    tetradic.push([
      colorA,
      colorB,
      colorA + numSections / 4,
      colorB + numSections / 4,
    ]);
    doubleSplitComplementary.push([
      colorA,
      colorB,
      colorA + numSections * 0.08,
      colorB + numSections * 0.08,
    ]);
    doubleSplitComplementary.push([
      colorA,
      colorB,
      colorA - numSections * 0.08,
      colorB - numSections * 0.08,
    ]);
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
  let output = [
    ...analogous,
    ...complementary,
    ...splitComplementary,
    ...triadic,
    ...doubleSplitComplementary,
    ...tetradic,
  ];

  return output;
}
