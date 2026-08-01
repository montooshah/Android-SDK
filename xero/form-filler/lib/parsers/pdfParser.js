/**
 * PDF → { key: value } via PDF.js text extraction, then TXT heuristics.
 * Requires lib/pdfjs/pdf.min.js and pdf.worker.min.js to be loaded first.
 */
(function (global) {
  const ns = (global.XeroFormFiller = global.XeroFormFiller || {});
  const parsers = (ns.parsers = ns.parsers || {});

  async function extractPdfText(arrayBuffer) {
    if (!global.pdfjsLib) {
      throw new Error("PDF.js is not loaded. Ensure lib/pdfjs/pdf.min.js is included.");
    }

    const pdfjsLib = global.pdfjsLib;
    if (pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL("lib/pdfjs/pdf.worker.min.js");
    }

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const parts = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      // Reconstruct roughly line-oriented text by y-position clustering
      const items = content.items.filter((it) => it.str && it.str.trim());
      const lines = [];
      let currentY = null;
      let buf = [];
      for (const item of items) {
        const y = item.transform ? item.transform[5] : 0;
        if (currentY == null || Math.abs(currentY - y) < 4) {
          buf.push(item.str);
          currentY = currentY == null ? y : currentY;
        } else {
          lines.push(buf.join(" ").trim());
          buf = [item.str];
          currentY = y;
        }
      }
      if (buf.length) lines.push(buf.join(" ").trim());
      parts.push(lines.filter(Boolean).join("\n"));
    }

    return parts.join("\n\n");
  }

  async function parsePdf(arrayBuffer) {
    const text = await extractPdfText(arrayBuffer);
    if (!text || !text.trim()) {
      return {
        data: {},
        text: "",
        meta: {
          format: "pdf",
          fields: 0,
          warning:
            "No extractable text found. This may be a scanned/image PDF. Use CSV/TXT, or provide a text PDF.",
        },
      };
    }

    const parsed = parsers.txt(text);
    return {
      data: parsed.data,
      text,
      meta: {
        format: "pdf",
        fields: Object.keys(parsed.data).length,
        keyValueLines: parsed.meta.keyValueLines,
        charCount: text.length,
      },
    };
  }

  parsers.pdf = parsePdf;
  parsers.extractPdfText = extractPdfText;
})(globalThis);
