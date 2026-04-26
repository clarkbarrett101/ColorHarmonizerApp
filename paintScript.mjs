import masterList from "./src/masterList.mjs";
import fs from "fs";

const clarColors = [];
masterList.map((item) => {
  let [r, g, b] = item.rgb;
  r /= 255;
  g /= 255;
  b /= 255;
  let y = 0.299 * r + 0.587 * g + 0.114 * b;
  let u = -0.14713 * r - 0.28886 * g + 0.436 * b;
  let v = 0.615 * r - 0.51499 * g - 0.10001 * b;
  let c = Math.sqrt(u * u + v * v);
  let ar = Math.atan2(v, u);
  y = Math.round(y * 10000) / 10000;
  u = Math.round(u * 10000) / 10000;
  v = Math.round(v * 10000) / 10000;
  c = Math.round(c * 10000) / 10000;
  const l = y;
  if (ar < 0) {
    ar += 2 * Math.PI;
  }
  ar = Math.round(ar * 100000) / 100000;
  item.yuv = [y, u, v];
  item.clar = { c, l, ar };
  clarColors.push(item);
});
clarColors.sort(
  (a, b) =>
    (a.clar.ar - b.clar.ar) * 100 +
    (a.clar.l - b.clar.l) * 10 +
    (a.clar.c - b.clar.c),
);
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
}
asJson(refList);

function asJson(colors) {
  const jsonString = JSON.stringify(colors, null, 2);
  fs.writeFile(`./src/ts/refList.json`, jsonString, "utf8", (err) => {
    if (err) {
      console.error("Error writing file:", err);
    } else {
      console.log(`File refList.json has been written successfully.`);
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
