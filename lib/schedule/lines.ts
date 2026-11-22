// Rebuilds text lines from positioned PDF text items. Positions are used only
// to join the pieces of one printed line; parsing never relies on layout.

export interface TextItem {
  str: string;
  x: number;
  y: number; // PDF space: larger is higher on the page
  width: number;
  height: number;
}

const SAME_LINE = 2; // points of vertical drift within one printed line

export function itemsToLines(pages: TextItem[][]): string[] {
  const lines: string[] = [];
  for (const items of pages) {
    const rows: TextItem[][] = [];
    const sorted = items
      .filter((item) => item.str.trim())
      .sort((a, b) => b.y - a.y || a.x - b.x);
    for (const item of sorted) {
      const row = rows.find((r) => Math.abs(r[0].y - item.y) <= SAME_LINE);
      if (row) row.push(item);
      else rows.push([item]);
    }
    for (const row of rows) {
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
