/**
 * ZeroLeak AI - Enterprise PDF Document Extractor & Validator
 * 
 * Supports:
 * - Multi-page PDF extraction with boundary markers
 * - Page count limits (max 50 pages)
 * - Empty PDF detection
 * - Scanned / Image-only PDF detection (clear OCR requirement message)
 * - Password-protected / Encrypted PDF detection
 * - Corrupted / Non-PDF file detection
 * - Safe fallback stream parser for environments without web workers
 */

export const MAX_PDF_PAGES = 50;

/**
 * Extracts and validates text from a PDF ArrayBuffer.
 * 
 * @param {ArrayBuffer} arrayBuffer - Raw bytes of uploaded PDF
 * @returns {Promise<{ text: string, numPages: number, metadata: object }>}
 */
export async function extractTextFromPdf(arrayBuffer) {
  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
    throw new Error("Empty PDF document: The uploaded file has a size of 0 bytes.");
  }

  // Quick PDF Magic Number header check: %PDF-
  const headerBytes = new Uint8Array(arrayBuffer.slice(0, 5));
  const headerStr = String.fromCharCode(...headerBytes);
  if (headerStr !== "%PDF-") {
    throw new Error("Corrupted PDF document: Missing valid '%PDF-' header signature. The file is corrupt or not a genuine PDF.");
  }

  try {
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.js");
    
    // In browser environment, configure worker source safely
    if (typeof window !== "undefined" && pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || "3.11.174"}/pdf.worker.min.js`;
    }

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      disableFontFace: true,
      isEvalSupported: false,
    });

    // Handle password-protected PDFs explicitly
    loadingTask.onPassword = (updatePassword, reason) => {
      throw new Error("Password-protected PDF: This document is encrypted with a password. Please unlock the file or provide an unencrypted version.");
    };

    const doc = await loadingTask.promise;
    const numPages = doc.numPages;

    // 1. Empty page count check
    if (numPages === 0) {
      throw new Error("Empty PDF document: The file contains zero pages.");
    }

    // 2. Max page limit check
    if (numPages > MAX_PDF_PAGES) {
      throw new Error(`Maximum page count exceeded: This PDF has ${numPages} pages (maximum allowed is ${MAX_PDF_PAGES} pages).`);
    }

    let fullText = "";
    let totalItemsFound = 0;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const content = await page.getTextContent();
      const pageStrings = content.items.map((item) => item.str || "").filter(Boolean);
      totalItemsFound += pageStrings.length;

      const pageText = pageStrings.join(" ").replace(/[ \t]+/g, " ").trim();
      if (pageText) {
        if (numPages > 1) {
          fullText += `--- [Page ${pageNum} of ${numPages}] ---\n${pageText}\n\n`;
        } else {
          fullText += `${pageText}\n\n`;
        }
      }
    }

    const cleanedText = fullText.trim();

    // 3. Scanned PDF Detection (Pages exist, but no extractable text characters)
    if (cleanedText.length < 20 || totalItemsFound === 0) {
      throw new Error("Scanned or image-only PDF detected: No searchable text layers found. ZeroLeak AI requires optical character recognition (OCR) to process scanned image documents.");
    }

    return {
      text: cleanedText,
      numPages,
      metadata: {
        numPages,
        byteLength: arrayBuffer.byteLength,
        isSearchable: true
      }
    };
  } catch (err) {
    const errMsg = err.message || "";
    // If the error was already one of our structured exceptions, re-throw directly
    if (
      errMsg.includes("Password-protected") ||
      errMsg.includes("Scanned or image-only") ||
      errMsg.includes("Maximum page count exceeded") ||
      errMsg.includes("Empty PDF document")
    ) {
      throw err;
    }

    // Check for password / encrypted errors from pdfjs
    if (err.name === "PasswordException" || /password|encrypted/i.test(errMsg)) {
      throw new Error("Password-protected PDF: This document is encrypted. Please provide an unencrypted PDF.");
    }

    // Check for invalid or corrupt PDF structure
    if (err.name === "InvalidPDFException" || /invalid pdf|corrupted/i.test(errMsg)) {
      throw new Error("Corrupted PDF document: File structure is damaged and could not be parsed.");
    }

    // Try fallback text stream parsing for simple text streams
    const fallbackText = extractRawPdfText(arrayBuffer);
    if (fallbackText && fallbackText.trim().length > 30) {
      return {
        text: fallbackText.trim(),
        numPages: 1,
        metadata: { numPages: 1, fallbackUsed: true }
      };
    }

    throw new Error(`PDF Processing Error: ${errMsg || "Failed to extract text from document."}`);
  }
}

/**
 * Fallback parser that scans for text operators in uncompressed / simple PDF streams
 */
function extractRawPdfText(arrayBuffer) {
  try {
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    const len = Math.min(bytes.byteLength, 1000000); // scan up to 1 MB
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    let extracted = "";
    // Match (string) Tj
    const tjRegex = /\(([^)]+)\)\s*Tj/g;
    let match;
    while ((match = tjRegex.exec(binary)) !== null) {
      extracted += match[1] + " ";
    }

    // Match [(str) -10 (str2)] TJ
    const arrayRegex = /\[([^\]]+)\]\s*TJ/g;
    while ((match = arrayRegex.exec(binary)) !== null) {
      const parts = match[1].match(/\(([^)]+)\)/g);
      if (parts) {
        extracted += parts.map((p) => p.slice(1, -1)).join("") + " ";
      }
    }

    return extracted.replace(/\s+/g, " ").trim();
  } catch (e) {
    return "";
  }
}
