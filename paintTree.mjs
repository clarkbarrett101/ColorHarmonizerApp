import fs from "fs";
const maxClist = {};
import clarColorsList from "./src/clarColors.json" with { type: "json" };
function listAllPaintNames() {
  clarColorsList.forEach((paint) => {
    let { c, l, ar } = paint.clar;
    c = Math.round(c * 100) / 100;
    l = Math.round(l * 100) / 100;
    const index = Math.floor(ar * 7);
    if (!maxClist[index] || maxClist[index][0] < c) {
      maxClist[index] = [c, l];
    }
  });
  console.log(maxClist);
}
listAllPaintNames();
/*
00: 0.5
06: 0.7
11: 0.9
17: 0.7
22: 0.5
27: 0.3
33: 0.1
39: 0.3
*/
