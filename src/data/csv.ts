/** Minimal CSV parser. Does not alter source bytes beyond UTF-8 decode + BOM strip. */

export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  const src = text.replace(/^\uFEFF/, "");
  let cell = "";
  let row: string[] = [];
  let i = 0;
  let quoted = false;

  while (i < src.length) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        quoted = false;
        i += 1;
        continue;
      }
      cell += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      quoted = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      row.push(cell);
      cell = "";
      i += 1;
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i += 1;
      row.push(cell);
      cell = "";
      if (row.some((c) => c.length)) rows.push(row);
      row = [];
      i += 1;
      continue;
    }
    cell += ch;
    i += 1;
  }
  if (cell.length || row.length) {
    row.push(cell);
    if (row.some((c) => c.length)) rows.push(row);
  }

  const header = (rows.shift() ?? []).map((h) => h.trim());
  const out: Record<string, string>[] = [];
  for (const cells of rows) {
    const rec: Record<string, string> = {};
    for (let c = 0; c < header.length; c++) rec[header[c]] = cells[c] ?? "";
    out.push(rec);
  }
  return out;
}
