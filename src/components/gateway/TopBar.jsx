import React, { useRef } from "react";
import { toast } from "sonner";
import { extractTextFromPdf } from "../../lib/pdfExtractor";
import { validateDocumentContent } from "../../lib/documentValidator";
import {
  ShieldCheck,
  Play,
  Square,
  Upload,
  FileText,
  Building2,
  FileCheck2,
  Cpu,
  Trash2,
  Sparkles,
  ChevronDown
} from "lucide-react";
import { DEPARTMENTS, TASKS, LLM_BACKENDS, SAMPLE_DOCUMENTS } from "../../mockData";
import { cn } from "../../lib/utils";

export default function TopBar({
  department,
  setDepartment,
  task,
  setTask,
  llmBackend,
  setLlmBackend,
  onSelectSample,
  onFileUpload,
  onClearText,
  onProcess,
  loading,
  isDemoRunning,
  onToggleDemo,
  hasText,
}) {
  const fileInputRef = useRef(null);

  // Allowed text-based and PDF extensions
  const ALLOWED_EXTENSIONS = [".txt", ".json", ".csv", ".log", ".md", ".pdf"];
  const ALLOWED_MIME_PREFIXES = ["text/", "application/json", "application/csv", "application/pdf"];
  const MAX_FILE_SIZE_MB = 10;

  /**
   * Checks the first 512 bytes for non-printable / binary characters.
   * Returns true if the content looks like valid readable text.
   */
  function isReadableText(content) {
    const sample = content.slice(0, 512);
    // Count non-printable characters (excluding common whitespace)
    const nonPrintable = [...sample].filter(
      (ch) => ch.charCodeAt(0) < 9 || (ch.charCodeAt(0) > 13 && ch.charCodeAt(0) < 32) || ch.charCodeAt(0) === 127
    );
    return nonPrintable.length / sample.length < 0.1; // <10% non-printable → OK
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    // Reset input so the same file can be re-selected after an error
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
          toast.error("Invalid PDF — no readable text found. Scanned or image-only PDFs are not supported.", { id: toastId });
          return;
        }

        const validation = validateDocumentContent(extractedText, file.name);
        if (!validation.valid) {
          toast.error(validation.error, { id: toastId, duration: 6000 });
          return;
        }

        toast.success(`PDF "${file.name}" loaded (${extractedText.length.toLocaleString()} characters, ${extracted.numPages} page(s)).`, { id: toastId });
        onFileUpload(extractedText, file.name, {
          size: file.size,
          type: "PDF",
          numPages: extracted.numPages
        });
      } catch (err) {
        console.error("PDF parse error:", err);
        toast.error(`Failed to parse PDF: ${err.message || "Invalid or encrypted PDF document."}`, { id: toastId, duration: 6000 });
      }
      return;
    }

    // 5. Handle plain text files
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
      toast.error(`Failed to read "${file.name}" — file may be corrupt or inaccessible.`, { duration: 6000 });
    };

    reader.readAsText(file);
  };

  return (
    <div className="bg-[#141414] border-b border-[#2A2A2A] p-3 md:p-4 sticky top-0 z-20 font-sans">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Left side selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Department Dropdown */}
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

          {/* Task / Purpose Dropdown */}
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

          {/* External LLM Selection */}
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

          {/* Samples Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#1A1A1A] px-2.5 py-1.5 rounded-md border border-[#2A2A2A] text-xs">
            <FileText className="w-3.5 h-3.5 text-[#9A9A9A]" />
            <select
              onChange={(e) => {
                if (e.target.value) {
                  onSelectSample(e.target.value);
                  e.target.value = "";
                }
              }}
              defaultValue=""
              className="bg-transparent text-[#9A9A9A] hover:text-[#F5F5F5] outline-none cursor-pointer text-xs"
            >
              <option value="" disabled className="bg-[#141414] text-[#9A9A9A]">
                Load Sample Scenario...
              </option>
              {SAMPLE_DOCUMENTS.map((doc) => (
                <option key={doc.id} value={doc.id} className="bg-[#141414] text-[#F5F5F5]">
                  {doc.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* File Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".txt,.json,.csv,.log,.md,.pdf"
            title="Upload document (.pdf, .txt, .json, .csv, .log, .md)"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary text-xs py-1.5 px-2.5"
            title="Upload document (.pdf, .txt, .json, .csv)"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload File (.pdf / text)</span>
          </button>

          {/* Clear Text Button */}
          {hasText && (
            <button
              onClick={onClearText}
              className="p-1.5 text-[#9A9A9A] hover:text-[#E5484D] transition-colors rounded-md hover:bg-[#1A1A1A]"
              title="Clear input text"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Demo Mode Button */}
          <button
            onClick={onToggleDemo}
            className={cn(
              "btn-secondary text-xs py-1.5 px-2.5",
              isDemoRunning && "border-[#E5484D] text-[#E5484D] bg-[#E5484D]/10"
            )}
            title={isDemoRunning ? "Stop automated walkthrough" : "Run automated demo walkthrough"}
          >
            {isDemoRunning ? (
              <>
                <Square className="w-3.5 h-3.5 text-[#E5484D]" />
                <span className="hidden sm:inline">Stop Demo</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Automated Demo</span>
              </>
            )}
          </button>

          {/* Process Document Primary Action */}
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
