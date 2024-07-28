import masterList from "./src/masterList.mjs";
import fs from "fs";
import { Hsluv } from "hsluv";
let outList = [];
for (let i = 0; i < masterList.length; i++) {
  const color = masterList[i];
  const hsluv = new Hsluv();
  hsluv.hsluv_h = color.hsluv[0];
  hsluv.hsluv_s = color.hsluv[1];
  hsluv.hsluv_l = color.hsluv[2];
  hsluv.hsluvToHex();
  color.hex = hsluv.hex;
  console.log(color.hex);
  outList.push(color);
}
const start = "const masterList = ";
const end = "; export default masterList;";
fs.writeFileSync("src/masterList.mjs", start + JSON.stringify(outList) + end);
