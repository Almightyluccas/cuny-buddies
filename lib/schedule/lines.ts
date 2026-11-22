// Rebuilds text lines from positioned PDF text items. Positions are used only
// to join the pieces of one printed line; parsing never relies on layout.

export interface TextItem {
  str: string;
  x: number;
  y: number; // PDF space: larger is higher on the page
  width: number;
  height: number;
}

// Vertical drift allowed within one printed line. Prints put separate lines as
// little as 2.3 points apart (a section line next to a meeting line), so this
// can't be larger.
const SAME_LINE = 2;

export function itemsToLines(pages: TextItem[][]): string[] {
  const lines: string[] = [];
  for (const items of pages) {
    // Items sorted top to bottom join the current row while they stay within
    // SAME_LINE of its average height, so gradual drift doesn't split a line.
    const rows: { y: number; items: TextItem[] }[] = [];
    const sorted = items
      .filter((item) => item.str.trim())
      .sort((a, b) => b.y - a.y || a.x - b.x);
    for (const item of sorted) {
      const row = rows.at(-1);
      if (row && Math.abs(row.y - item.y) <= SAME_LINE) {
        row.items.push(item);
        row.y += (item.y - row.y) / row.items.length;
      } else {
        rows.push({ y: item.y, items: [item] });
      }
    }
    for (const { items: row } of rows) {
      row.sort((a, b) => a.x - b.x);
      let line = "";
      let prevEnd = -Infinity;
      for (const item of row) {
        // A visible gap means a new word; touching pieces are one word
        // (some prints split the first letter of a line into its own item).
        const gap = item.x - prevEnd;
        const fontSize = item.height || 10;
        if (line && gap > fontSize * 0.15 && !line.endsWith(" ") && !item.str.startsWith(" ")) line += " ";
        line += item.str;
        prevEnd = item.x + item.width;
      }
      lines.push(line.replace(/\s+/g, " ").trim());
    }
  }
  return lines;
}
