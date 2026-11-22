// Turns a Schedule Builder PDF into a parser test fixture: the extracted lines,
// with the given names replaced. The PDF itself is never committed.
// Usage: npx tsx scripts/schedule-fixture.mts <pdf> <out.txt> ["Name=Replacement" ...]

import { readFileSync, writeFileSync } from "node:fs";
import { extractTextItems } from "unpdf";
import { itemsToLines } from "../lib/schedule/lines";

const usage = 'Usage: npx tsx scripts/schedule-fixture.mts <pdf> <out.txt> ["Name=Replacement" ...]';
const [input, output, ...pairs] = process.argv.slice(2);
if (!input || !output) {
  console.error(usage);
  process.exit(2);
}

// Split on the first "=" so replacements may contain one.
const replacements = pairs.map((pair) => {
  const split = pair.indexOf("=");
  if (split < 1) {
    console.error(`Replacement "${pair}" must look like "Name=Replacement".\n${usage}`);
    process.exit(2);
  }
  return [pair.slice(0, split), pair.slice(split + 1)] as const;
});

const { items } = await extractTextItems(new Uint8Array(readFileSync(input)));
let text = itemsToLines(items).join("\n");
for (const [from, to] of replacements) text = text.replaceAll(from, to);
writeFileSync(output, text + "\n");
console.log(`${output}: ${text.split("\n").length} lines`);
