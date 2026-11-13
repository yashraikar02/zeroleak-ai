/**
 * ZeroLeak AI - DOCX Text Extractor
 * Uses mammoth.js to extract plain text from .docx files in the browser.
 */
import mammoth from "mammoth";

/**
 * Extract plain text from a .docx ArrayBuffer.
 * @param {ArrayBuffer} arrayBuffer
 * @returns {Promise<{ text: string, messages: Array }>}
 */
export async function extractTextFromDocx(arrayBuffer) {
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = result.value || "";
  if (!text || text.trim().length < 5) {
    throw new Error(
      "No readable text found in this DOCX file. The document may be empty or contain only images/tables without text."
    );
  }
  return {
    text: text.trim(),
    messages: result.messages || [],
  };
}
