/*import fs from "fs";

const kelvin_table1 = {
  1000: [255, 56, 0],
  2000: [255, 138, 18],
  3000: [255, 180, 107],
  4000: [255, 209, 163],
  5000: [255, 228, 206],
  6000: [255, 243, 239],
  7000: [245, 243, 255],
  8000: [227, 233, 255],
  9000: [214, 225, 255],
  10000: [207, 218, 255],
  11000: [200, 213, 255],
  12000: [195, 209, 255],
};
const kelvin_table = {
  1000: [255, 56, 0],
  1100: [255, 71, 0],
  1200: [255, 83, 0],
  1300: [255, 93, 0],
  1400: [255, 101, 0],
  1500: [255, 109, 0],
  1600: [255, 115, 0],
  1700: [255, 121, 0],
  1800: [255, 126, 0],
  1900: [255, 131, 0],
  2000: [255, 138, 18],
  2100: [255, 142, 33],
  2200: [255, 147, 44],
  2300: [255, 152, 54],
  2400: [255, 157, 63],
  2500: [255, 161, 72],
  2600: [255, 165, 79],
  2700: [255, 169, 87],
  2800: [255, 173, 94],
  2900: [255, 177, 101],
  3000: [255, 180, 107],
  3100: [255, 184, 114],
  3200: [255, 187, 120],
  3300: [255, 190, 126],
  3400: [255, 193, 132],
  3500: [255, 196, 137],
  3600: [255, 199, 143],
  3700: [255, 201, 148],
  3800: [255, 204, 153],
  3900: [255, 206, 159],
  4000: [255, 209, 163],
  4100: [255, 211, 168],
  4200: [255, 213, 173],
  4300: [255, 215, 177],
  4400: [255, 217, 182],
  4500: [255, 219, 186],
  4600: [255, 221, 190],
  4700: [255, 223, 194],
  4800: [255, 225, 198],
  4900: [255, 227, 202],
  5000: [255, 228, 206],
  5100: [255, 230, 210],
  5200: [255, 232, 213],
  5300: [255, 233, 217],
  5400: [255, 235, 220],
  5500: [255, 236, 224],
  5600: [255, 238, 227],
  5700: [255, 239, 230],
  5800: [255, 240, 233],
  5900: [255, 242, 236],
  6000: [255, 243, 239],
  6100: [255, 244, 242],
  6200: [255, 245, 245],
  6300: [255, 246, 247],
  6400: [255, 248, 251],
  6500: [255, 249, 253],
  6600: [254, 249, 255],
  6700: [252, 247, 255],
  6800: [249, 246, 255],
  6900: [247, 245, 255],
  7000: [245, 243, 255],
  7100: [243, 242, 255],
  7200: [240, 241, 255],
  7300: [239, 240, 255],
  7400: [237, 239, 255],
  7500: [235, 238, 255],
  7600: [233, 237, 255],
  7700: [231, 236, 255],
  7800: [230, 235, 255],
  7900: [228, 234, 255],
  8000: [227, 233, 255],
  8100: [225, 232, 255],
  8200: [224, 231, 255],
  8300: [222, 230, 255],
  8400: [221, 230, 255],
  8500: [220, 229, 255],
  8600: [218, 229, 255],
  8700: [217, 227, 255],
  8800: [216, 227, 255],
  8900: [215, 226, 255],
  9000: [214, 225, 255],
  9100: [212, 225, 255],
  9200: [211, 224, 255],
  9300: [210, 223, 255],
  9400: [209, 223, 255],
  9500: [208, 222, 255],
  9600: [207, 221, 255],
  9700: [207, 221, 255],
  9800: [206, 220, 255],
  9900: [205, 220, 255],
  10000: [207, 218, 255],
  10100: [207, 218, 255],
  10200: [206, 217, 255],
  10300: [205, 217, 255],
  10400: [204, 216, 255],
  10500: [204, 216, 255],
  10600: [203, 215, 255],
  10700: [202, 215, 255],
  10800: [202, 214, 255],
  10900: [201, 214, 255],
  11000: [200, 213, 255],
  11100: [200, 213, 255],
  11200: [199, 212, 255],
  11300: [198, 212, 255],
  11400: [198, 212, 255],
  11500: [197, 211, 255],
  11600: [197, 211, 255],
  11700: [197, 210, 255],
  11800: [196, 210, 255],
  11900: [195, 210, 255],
  12000: [195, 209, 255],
};

let angles = {};
function rgbToAngle(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  let y = 0.299 * r + 0.587 * g + 0.114 * b;
  let u = -0.14713 * r - 0.28886 * g + 0.436 * b;
  let v = 0.615 * r - 0.51499 * g - 0.10001 * b;
  let c = Math.sqrt(u * u + v * v);
  let ar = Math.atan2(v, u);

  c = Math.round(c * 10000) / 10000;
  ar = Math.round(ar * 100000) / 100000;
  y = Math.round(y * 10000) / 10000;
  u = Math.round(u * 10000) / 10000;
  v = Math.round(v * 10000) / 10000;
  const temp = {
    y,
    u,
    v,
    c,
    ar,
  };
  return temp;
}
let uvRange = { u: [0, 0], v: [0, 0] };
let yRange = [1, 0];
for (let k in kelvin_table) {
  const [r, g, b] = kelvin_table[k];
  const angle = rgbToAngle(r, g, b);
  angle.k = parseInt(k, 10);
  angles[k] = angle;
  if (angle.u < uvRange.u[0]) {
    uvRange.u[0] = angle.u;
  }
  if (angle.u > uvRange.u[1]) {
    uvRange.u[1] = angle.u;
  }
  if (angle.v < uvRange.v[0]) {
    uvRange.v[0] = angle.v;
  }
  if (angle.v > uvRange.v[1]) {
    uvRange.v[1] = angle.v;
  }
  if (angle.y < yRange[0]) {
    yRange[0] = angle.y;
  }
  if (angle.y > yRange[1]) {
    yRange[1] = angle.y;
  }
}
console.log("uvRange", uvRange);
console.log("yRange", yRange);

fs.writeFile(
  `./src/ts/kelvinAngles.json`,
  JSON.stringify(angles, null, 2),
  "utf8",
  (err) => {
    if (err) {
      console.error("Error writing file:", err);
    } else {
      console.log(`File kelvinAngles.json has been written successfully.`);
    }
  },
);
*/

import masterList from "./src/masterList.mjs";
import { fRGBToYUV, fRGBToCLARColor } from "./src/utils/CLAcolor.js";
import fs from "fs";
const clarColors = new Array(44).fill([0, 0]);
masterList.map((item) => {
  let [r, g, b] = item.rgb;
  let [y, u, v] = fRGBToYUV([r, g, b]);
  let { c, l, ar } = fRGBToCLARColor([r, g, b]);
  let index = Math.round((ar / (2 * Math.PI)) * 44);
  if (clarColors[index][0] < c) {
    clarColors[index] = [c, l];
  }
  item.yuv = [y, u, v];
  item.clar = { c, l, ar };
  let by = Math.abs(ar / (2 * Math.PI) - 0.75);
  if (by > 0.5) {
    by = 1 - by;
  }
  by /= 0.5;
  let depth = c / 0.2;
  let winterScore = (1 - by) * depth * (1 - l);
  let summerScore = (1 - by) * (1 - depth) * l;
  let autumnScore = by * (1 - depth) * (1 - l);
  let springScore = by * depth * l;
  item.psaw = [springScore, summerScore, autumnScore, winterScore];

  clarColors.push(item);
});
clarColors.sort(
  (a, b) =>
    (a.clar.ar - b.clar.ar) * 100 +
    (a.clar.l - b.clar.l) * 10 +
    (a.clar.c - b.clar.c),
);
/*
const refList = [];
for (let ar = 0; ar < 44; ar++) {
  for (let l = 1; l < 12; l++) {
    for (let c = 1; c < 10; c++) {
      const clarColor = { c: c / 10, l: l / 12, ar: ar / 7 };
      let dist = [];
      for (let i = 0; i < clarColors.length; i++) {
        const item = clarColors[i];
        const dc = item.clar.c - clarColor.c;
        const dl = item.clar.l - clarColor.l;
        const dar = Math.min(
          Math.abs(item.clar.ar - clarColor.ar),
          2 * Math.PI - Math.abs(item.clar.ar - clarColor.ar),
        );
        dist.push({
          index: i,
          distance: Math.sqrt(dc * dc + dl * dl + dar * dar),
        });
      }
      dist.sort((a, b) => a.distance - b.distance);
      const closestColors = dist.slice(0, 15).map((d) => d.index);
      closestColors.sort((a, b) =>
        clarColors[a].brand === "Behr"
          ? 1
          : clarColors[b].brand === "Behr"
            ? -1
            : 0,
      );
      const topColors = closestColors.slice(0, 10).sort((a, b) => a - b);
      refList.push({ ...clarColor, paintIndexes: topColors });
    }
  }
    */

asJson(clarColors);

function asJson(colors) {
  const jsonString = JSON.stringify(colors, null, 2);
  fs.writeFile(`./src/ts/clarColors.json`, jsonString, "utf8", (err) => {
    if (err) {
      console.error("Error writing file:", err);
    } else {
      console.log(`File clarColors.json has been written successfully.`);
    }
  });
}
function asCSV(colors) {
  const csvLines = colors.map((item) => {
    const [r, g, b] = item.rgb;
    const [y, u, v] = item.yuv;
    const { c, l, ar } = item.clar;
    return `${item.name},${item.brand},${item.hex},${r},${g},${b},${y},${u},${v},${c},${l},${ar}`;
  });
  const csvContent =
    "name,brand,hex,r,g,b,y,u,v,c,l,ar\n" + csvLines.join("\n");
  fs.writeFile(`./src/ts/colors.csv`, csvContent, "utf8", (err) => {
    if (err) {
      console.error("Error writing file:", err);
    } else {
      console.log(`File colors.csv has been written successfully.`);
    }
  });
}
