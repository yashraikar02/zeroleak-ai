import React, { useRef } from "react";
import { toast } from "sonner";
import { extractTextFromPdf } from "../../lib/pdfExtractor";
import { validateDocumentContent } from "../../lib/documentValidator";
import {
  ShieldCheck,
  Upload,
  Building2,
  FileCheck2,
  Cpu,
  Trash2,
} from "lucide-react";
import { DEPARTMENTS, TASKS, LLM_BACKENDS } from "../../mockData";
import { cn } from "../../lib/utils";

export default function TopBar({
  department,
  setDepartment,
  task,
  setTask,
  llmBackend,
  setLlmBackend,
  onFileUpload,
  onClearText,
  onProcess,
  loading,
  hasText,
}) {
  const fileInputRef = useRef(null);

  const ALLOWED_EXTENSIONS = [".txt", ".json", ".csv", ".log", ".md", ".pdf"];
  const MAX_FILE_SIZE_MB = 10;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    // Reset so the same file can be re-selected after an error
    e.target.value = "";

    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const isPdf = lowerName.endsWith(".pdf");

    // 1. Extension check
    const hasAllowedExt = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    if (!hasAllowedExt) {
      toast.error(
        `Invalid file format — "${file.name}". Supported: .pdf, .txt, .json, .csv, .log, .md`,
        { duration: 6000 }
      );
      return;
    }

    // 2. File size check
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(
        `File too large — "${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB. Max allowed: ${MAX_FILE_SIZE_MB} MB.`,
        { duration: 6000 }
      );
      return;
    }

    // 3. Empty file check
    if (file.size === 0) {
      toast.error("Invalid file — the uploaded file is empty.", { duration: 5000 });
      return;
    }

    // 4. Handle PDF files
    if (isPdf) {
      const toastId = toast.loading(`Parsing PDF document "${file.name}"...`);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const extracted = await extractTextFromPdf(arrayBuffer);
        const extractedText = extracted.text;

        if (!extractedText || extractedText.trim().length < 10) {
          toast.error(
            "Invalid PDF — no readable text found. Scanned or image-only PDFs are not supported.",
            { id: toastId }
          );
          return;
        }

        const validation = validateDocumentContent(extractedText, file.name);
        if (!validation.valid) {
          toast.error(validation.error, { id: toastId, duration: 6000 });
          return;
        }

        toast.success(
          `PDF "${file.name}" loaded (${extractedText.length.toLocaleString()} characters, ${extracted.numPages} page(s)).`,
          { id: toastId }
        );
        onFileUpload(extractedText, file.name, {
          size: file.size,
          type: "PDF",
          numPages: extracted.numPages,
        });
      } catch (err) {
        console.error("PDF parse error:", err);
        toast.error(
          `Failed to parse PDF: ${err.message || "Invalid or encrypted PDF document."}`,
          { id: toastId, duration: 6000 }
        );
      }
      return;
    }

    // 5. Handle plain text / structured files
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content !== "string") {
        toast.error("Invalid file — could not read file contents.", { duration: 5000 });
        return;
      }

      const validation = validateDocumentContent(content, file.name);
      if (!validation.valid) {
        toast.error(validation.error, { duration: 6000 });
        return;
      }

      toast.success(`File "${file.name}" loaded (${content.length.toLocaleString()} characters).`);
      onFileUpload(content, file.name);
    };

    reader.onerror = () => {
      toast.error(
        `Failed to read "${file.name}" — file may be corrupt or inaccessible.`,
        { duration: 6000 }
      );
    };

    reader.readAsText(file);
  };

  return (
    <div className="bg-[#141414] border-b border-[#2A2A2A] p-3 md:p-4 sticky top-0 z-20 font-sans">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">

        {/* Left — Department / Purpose / LLM selectors */}
        <div className="flex flex-wrap items-center gap-2">

          {/* Department */}
          <div className="flex items-center gap-1.5 bg-[#1A1A1A] px-2.5 py-1.5 rounded-md border border-[#2A2A2A] text-xs">
            <Building2 className="w-3.5 h-3.5 text-[#E5484D]" />
            <span className="text-[#9A9A9A] hidden sm:inline">Dept:</span>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="bg-transparent text-[#F5F5F5] font-medium outline-none cursor-pointer pr-1 text-xs"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept} className="bg-[#141414] text-[#F5F5F5]">
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Purpose / Task */}
          <div className="flex items-center gap-1.5 bg-[#1A1A1A] px-2.5 py-1.5 rounded-md border border-[#2A2A2A] text-xs">
            <FileCheck2 className="w-3.5 h-3.5 text-[#E5484D]" />
            <span className="text-[#9A9A9A] hidden sm:inline">Purpose:</span>
            <select
              value={task}
              onChange={(e) => setTask(e.target.value)}
              className="bg-transparent text-[#F5F5F5] font-medium outline-none cursor-pointer pr-1 text-xs"
            >
              {TASKS.map((t) => (
                <option key={t} value={t} className="bg-[#141414] text-[#F5F5F5]">
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* External LLM */}
          <div className="flex items-center gap-1.5 bg-[#1A1A1A] px-2.5 py-1.5 rounded-md border border-[#2A2A2A] text-xs">
            <Cpu className="w-3.5 h-3.5 text-[#E5484D]" />
            <span className="text-[#9A9A9A] hidden sm:inline">External LLM:</span>
            <select
              value={llmBackend}
              onChange={(e) => setLlmBackend(e.target.value)}
              className="bg-transparent text-[#F5F5F5] font-medium outline-none cursor-pointer pr-1 text-xs font-mono"
            >
              {LLM_BACKENDS.map((b) => (
                <option key={b.id} value={b.id} className="bg-[#141414] text-[#F5F5F5]">
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right — Upload / Clear / Process */}
        <div className="flex items-center gap-2">

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".txt,.json,.csv,.log,.md,.pdf"
            className="hidden"
          />

          {/* Upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary text-xs py-1.5 px-2.5"
            title="Upload document (.pdf, .txt, .json, .csv, .log, .md)"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload File</span>
          </button>

          {/* Clear button — only when text is present */}
          {hasText && (
            <button
              onClick={onClearText}
              className="p-1.5 text-[#9A9A9A] hover:text-[#E5484D] transition-colors rounded-md hover:bg-[#1A1A1A]"
              title="Clear input"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Process Document — primary CTA */}
          <button
            onClick={() => onProcess()}
            disabled={loading || !hasText}
            className="btn-primary text-xs py-1.5 px-3.5 shadow-sm"
          >
            <ShieldCheck className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            <span>{loading ? "Processing..." : "Process Document"}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
