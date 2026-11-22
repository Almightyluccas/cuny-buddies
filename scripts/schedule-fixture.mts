// Turns a Schedule Builder PDF into a parser test fixture: the extracted lines,
// with the given names replaced. The PDF itself is never committed.
// Usage: npx tsx scripts/schedule-fixture.mts <pdf> <out.txt> ["Name=Replacement" ...]

import { readFileSync, writeFileSync } from "node:fs";
import { extractTextItems } from "unpdf";
import { itemsToLines } from "../lib/schedule/lines";

const [input, output, ...replacements] = process.argv.slice(2);
if (!input || !output) {
  console.error('Usage: npx tsx scripts/schedule-fixture.mts <pdf> <out.txt> ["Name=Replacement" ...]');
  process.exit(2);
}

const { items } = await extractTextItems(new Uint8Array(readFileSync(input)));
let text = itemsToLines(items).join("\n");
for (const pair of replacements) {
  const [from, to] = pair.split("=");
  text = text.replaceAll(from, to);
}
writeFileSync(output, text + "\n");
console.log(`${output}: ${text.split("\n").length} lines`);
