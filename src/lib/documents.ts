import crypto from "node:crypto";
import path from "node:path";

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const MAX_EXTRACTED_CHARS = 18000;

const allowedExtensions = new Set([
  ".pdf",
  ".ppt",
  ".pptx",
  ".doc",
  ".docx",
  ".txt",
  ".md",
  ".csv",
  ".xls",
  ".xlsx"
]);

export function validateUpload(file: File) {
  const extension = path.extname(file.name).toLowerCase();

  if (!allowedExtensions.has(extension)) {
    return "Unsupported file type. Upload a PDF, PowerPoint, Word, text, markdown, CSV, or spreadsheet file.";
  }

  if (file.size <= 0) {
    return "The uploaded file is empty.";
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return "The file is too large. Upload a document smaller than 20 MB.";
  }

  return null;
}

export function safeStoredName(originalName: string) {
  const extension = path.extname(originalName).toLowerCase();
  return `${crypto.randomUUID()}${extension}`;
}

export function fileToDataUrl(buffer: Buffer, mimeType: string) {
  const mediaType = mimeType || "application/octet-stream";
  return `data:${mediaType};base64,${buffer.toString("base64")}`;
}

export async function extractDocumentText(buffer: Buffer, filename: string) {
  const extension = path.extname(filename).toLowerCase();

  if (extension === ".pdf") {
    const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
    const result = await pdfParse(buffer);
    return cleanExtractedText(result.text);
  }

  if ([".txt", ".md", ".csv"].includes(extension)) {
    return cleanExtractedText(buffer.toString("utf8"));
  }

  return "";
}

export function limitExtractedText(text: string) {
  if (text.length <= MAX_EXTRACTED_CHARS) {
    return text;
  }

  return `${text.slice(0, MAX_EXTRACTED_CHARS)}\n\n[Document text was truncated to keep the AI request affordable.]`;
}

function cleanExtractedText(text: string) {
  return text.replace(/\u0000/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{4,}/g, "\n\n\n").trim();
}
