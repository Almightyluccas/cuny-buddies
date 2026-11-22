// Reads a Schedule Builder PDF in the browser; the file never leaves the device.

import { itemsToLines } from "@/lib/schedule/lines";

export const MAX_PDF_BYTES = 5 * 1024 * 1024;
const MAX_PAGES = 20;
const TIMEOUT_MS = 20_000;

export class ScheduleFileError extends Error {}

type Doc = { loadingTask: { destroy(): Promise<void> } };

export async function readPdfLines(file: File): Promise<string[]> {
  if (file.size > MAX_PDF_BYTES) throw new ScheduleFileError("That file is over 5 MB. Print just your schedule and try again.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  // The spec allows a short preamble before the header, so look in the first 1 KB.
  if (!new TextDecoder("latin1").decode(bytes.slice(0, 1024)).includes("%PDF-")) {
    throw new ScheduleFileError("That isn't a PDF. Save your Schedule Builder print as a PDF and try again.");
  }

  let unpdf: typeof import("unpdf");
  try {
    unpdf = await import("unpdf"); // ~1.6 MB, loaded only when importing
  } catch {
    throw new ScheduleFileError("This browser can't read PDFs. Update it, or add your free time manually.");
  }

  // The timeout covers opening and reading. Whichever finishes first, the
  // document is released: on timeout now, or as soon as it finishes opening.
  let doc: Doc | undefined;
  let timedOut = false;
  const release = () => void doc?.loadingTask.destroy();

  const work = (async () => {
    const pdf = await unpdf.getDocumentProxy(bytes);
    doc = pdf;
    try {
      if (timedOut) throw new ScheduleFileError("Reading the PDF took too long.");
      if (pdf.numPages > MAX_PAGES) throw new ScheduleFileError("That PDF has too many pages to be a schedule.");
      const { items } = await unpdf.extractTextItems(pdf);
      return itemsToLines(items);
    } finally {
      release();
    }
  })();

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      release();
      reject(new ScheduleFileError("Reading the PDF took too long."));
    }, TIMEOUT_MS);
  });
  work.catch(() => {}); // a late failure after the timeout isn't reported twice

  try {
    return await Promise.race([work, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
