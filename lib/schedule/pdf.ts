// Reads a Schedule Builder PDF in the browser; the file never leaves the device.

import { itemsToLines } from "@/lib/schedule/lines";

export const MAX_PDF_BYTES = 5 * 1024 * 1024;
const MAX_PAGES = 20;
const TIMEOUT_MS = 20_000;

export class ScheduleFileError extends Error {}

export async function readPdfLines(file: File): Promise<string[]> {
  if (file.size > MAX_PDF_BYTES) throw new ScheduleFileError("That file is over 5 MB. Print just your schedule and try again.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") {
    throw new ScheduleFileError("That isn't a PDF. Save your Schedule Builder print as a PDF and try again.");
  }

  let unpdf: typeof import("unpdf");
  try {
    unpdf = await import("unpdf"); // ~1 MB, loaded only when importing
  } catch {
    throw new ScheduleFileError("This browser can't read PDFs. Update it, or add your free time manually.");
  }
  const pdf = await unpdf.getDocumentProxy(bytes);
  if (pdf.numPages > MAX_PAGES) throw new ScheduleFileError("That PDF has too many pages to be a schedule.");

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new ScheduleFileError("Reading the PDF took too long.")), TIMEOUT_MS),
  );
  const { items } = await Promise.race([unpdf.extractTextItems(pdf), timeout]);
  return itemsToLines(items);
}
