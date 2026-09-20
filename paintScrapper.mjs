import fs from "fs";
import colorList from "./src/clarColors2.json" with { type: "json" };
import newColorList from "./colors.json" with { type: "json" };

function normalizeCode(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim().toUpperCase();
}

function numericVariant(code) {
  const digitsOnly = code.replace(/\D+/g, "");
  if (!digitsOnly) {
    return "";
  }

  return String(Number(digitsOnly));
}

const byCode = new Map();
for (const scraped of newColorList) {
  const normalized = normalizeCode(scraped.code);
  if (!normalized) {
    continue;
  }

  byCode.set(normalized, scraped);

  const numeric = numericVariant(normalized);
  if (numeric) {
    byCode.set(numeric, scraped);
  }
}

let totalBenjaminMoore = 0;
let updatedCount = 0;
let alreadyCorrectCount = 0;
let noMatchCount = 0;

for (const color of colorList) {
  if (color.brand !== "Benjamin Moore") {
    continue;
  }

  totalBenjaminMoore += 1;
  const label = normalizeCode(color.label);
  const labelNumeric = numericVariant(label);
  const match =
    byCode.get(label) || (labelNumeric ? byCode.get(labelNumeric) : undefined);

  if (!match) {
    noMatchCount += 1;
    continue;
  }

  if (color.name === match.name) {
    alreadyCorrectCount += 1;
    continue;
  }

  color.name = match.name;
  updatedCount += 1;
}

fs.writeFileSync("./updatedColors.json", JSON.stringify(colorList, null, 2));

console.log(`Benjamin Moore colors checked: ${totalBenjaminMoore}`);
console.log(`Names updated: ${updatedCount}`);
console.log(`Already correct: ${alreadyCorrectCount}`);
console.log(`No code match: ${noMatchCount}`);
