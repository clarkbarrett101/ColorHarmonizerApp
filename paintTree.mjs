import masterList from "./src/masterList.mjs";
import fs from "fs";
const adjListcsv = fs.readFileSync("./adjectives.csv", "utf8");
const adjList = [];
const paintAdjectives = {};
const paintNouns = {};
adjListcsv.split("\n").forEach((line) => {
  const [paint, ...adjPaints] = line.split(",");
  adjList.push({ paint, adjPaints: adjPaints.filter((p) => p !== "") });
});
function listAllPaintNames() {
  for (let paint in masterList) {
    const name = masterList[paint].name.toLowerCase();
    const uv = fRGBToYUV(masterList[paint].rgb);
    const split = name.split(" ");
    split.forEach((word) => {
      if (adjList.find((adj) => adj.paint === word)) {
        if (!paintAdjectives[word]) {
          paintAdjectives[word] = uv;
        }
      } else {
        if (!paintNouns[word]) {
          paintNouns[word] = uv;
        }
      }
    });
  }
  fs.writeFileSync(
    "paintAdjectives.json",
    JSON.stringify(paintAdjectives, null, 2),
  );
  fs.writeFileSync("paintNouns.json", JSON.stringify(paintNouns, null, 2));
}
listAllPaintNames();
function fRGBToYUV(rgb) {
  "worklet";
  const [r, g, b] = rgb.map((c) => c / 255);
  const y = Math.round((0.299 * r + 0.587 * g + 0.114 * b) * 1000) / 1000;
  const u = Math.round((-0.14713 * r - 0.28886 * g + 0.436 * b) * 1000) / 1000;
  const v = Math.round((0.615 * r - 0.51499 * g - 0.10001 * b) * 1000) / 1000;
  return [y, u, v];
}
