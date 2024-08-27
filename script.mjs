import masterList from "./src/masterList.mjs";
import fs from "fs";
let unique = [];
for (let i = 0; i < masterList.length; i++) {
  const paintColor = masterList[i];
  let isUnique = true;
  for (let j = 0; j < masterList.length; j++) {
    const compare = masterList[j];
    if (
      i !== j &&
      paintColor.name === compare.name &&
      paintColor.hex === compare.hex &&
      paintColor.brand === compare.brand
    ) {
      isUnique = false;
    }
  }
  if (isUnique) {
    unique.push(paintColor);
  }
}
console.log(unique.length, masterList.length);
