import React, { useState } from "react";
import {
  Edit3,
  Eye,
  Trash2,
  Lock,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { renderHighlightedText } from "../../lib/highlightText";
import { cn } from "../../lib/utils";
import { toast } from "sonner";
import { extractTextFromPdf } from "../../lib/pdfExtractor";
import { validateDocumentContent } from "../../lib/documentValidator";

export default function OriginalDocumentPanel({
  text,
  setText,
  entities = [],
  processed,
  processedResult,
  hoveredPlaceholder,
  onHoverPlaceholder,
  loading,
  uploadedFileMeta,
  onFileUpload
}) {
  const [viewMode, setViewMode] = useState("highlights"); // "highlights" | "edit"
  const [isDragging, setIsDragging] = useState(false);
  const [inputError, setInputError] = useState(null);

  const charCount = text ? text.length : 0;
  const wordCount = text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const showHighlights = processed && viewMode === "highlights" && entities.length > 0;

  const injection = processedResult?.prompt_injection;

  // ---- Drag & Drop with comprehensive PDF & file validation ----
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const isPdf = lowerName.endsWith(".pdf");
    const allowed = [".pdf", ".txt", ".json", ".csv", ".log", ".md"];
    const hasExt = allowed.some((ext) => lowerName.endsWith(ext));
    if (!hasExt) {
      const err = `Unsupported file format (PC-11): "${file.name}". Supported formats: .pdf, .txt, .json, .csv, .log, .md.`;
      toast.error(err, { duration: 6000 });
      setInputError(err);
      return;
    }
    if (file.size === 0) {
      const err = "Invalid file — the uploaded file is empty (0 bytes).";
      toast.error(err);
      setInputError(err);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      const err = `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed is 10 MB.`;
      toast.error(err);
      setInputError(err);
      return;
    }

    if (isPdf) {
      const toastId = toast.loading(`Parsing PDF document "${file.name}"...`);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const extracted = await extractTextFromPdf(arrayBuffer);
        const res = validateDocumentContent(extracted.text, file.name);
        if (!res.valid) {
          toast.error(res.error, { id: toastId, duration: 6000 });
          setInputError(res.error);
          return;
        }
        setInputError(null);
        setText(extracted.text);
        if (onFileUpload) {
          onFileUpload(extracted.text, file.name, {
            size: file.size,
            type: "PDF",
            numPages: extracted.numPages
          });
        }
        toast.success(`PDF "${file.name}" loaded (${extracted.text.length.toLocaleString()} chars, ${extracted.numPages} page(s)).`, { id: toastId });
      } catch (err) {
        toast.error(err.message || "Failed to extract text from PDF.", { id: toastId, duration: 6000 });
        setInputError(err.message);
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result;
      const res = validateDocumentContent(content, file.name);
      if (!res.valid) {
        toast.error(res.error, { duration: 6000 });
        setInputError(res.error);
        return;
      }
      setInputError(null);
      setText(content);
      if (onFileUpload) {
        onFileUpload(content, file.name, {
          size: file.size,
          type: file.name.split(".").pop().toUpperCase()
        });
      }
      toast.success(`"${file.name}" loaded (${content.length.toLocaleString()} chars).`);
    };
    reader.onerror = () => {
      const err = `Could not read "${file.name}" — file may be corrupt or inaccessible.`;
      toast.error(err);
      setInputError(err);
    };
    reader.readAsText(file);
  };

  // ---- Textarea change handler with live validation ----
  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
    if (!val || !val.trim()) {
      setInputError(null);
      return;
    }
    const res = validateDocumentContent(val);
    setInputError(res.valid ? null : res.error);
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full rounded-xl bg-[#141414] border overflow-hidden transition-all",
        isDragging ? "border-[#E5484D] bg-[#1A1A1A]" : "border-[#2A2A2A]"
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {/* ── Panel Header ── */}
      <div className="px-4 py-3 border-b border-[#2A2A2A] bg-[#0F0F0F] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Step badge */}
          <span className="w-6 h-6 rounded-md bg-[#1A1A1A] border border-[#2A2A2A] text-[#9A9A9A] text-[11px] font-bold flex items-center justify-center">
            1
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold text-[#F5F5F5] leading-tight">Original Document</h2>
              {uploadedFileMeta && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1A1A1A] text-[#10B981] border border-emerald-500/30">
                  {uploadedFileMeta.name} ({uploadedFileMeta.type || "DOC"})
                </span>
              )}
            </div>
            <p className="text-[10px] text-[#9A9A9A] leading-tight mt-0.5">
              Type, paste or upload (.pdf, .txt, .json, .csv, .log, .md) — raw PII stays here
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Highlight / Edit toggle */}
          {processed && entities.length > 0 && (
            <div className="flex items-center bg-[#1A1A1A] border border-[#2A2A2A] rounded-md p-0.5 text-[11px]">
              <button
                onClick={() => setViewMode("highlights")}
                className={cn(
                  "px-2 py-0.5 rounded flex items-center gap-1 transition-colors",
                  viewMode === "highlights" ? "bg-[#2A2A2A] text-[#E5484D] font-medium" : "text-[#9A9A9A] hover:text-[#F5F5F5]"
                )}
                title="Show detected PII highlights"
              >
                <Eye className="w-3 h-3" /> Highlights
              </button>
              <button
                onClick={() => setViewMode("edit")}
                className={cn(
                  "px-2 py-0.5 rounded flex items-center gap-1 transition-colors",
                  viewMode === "edit" ? "bg-[#2A2A2A] text-[#E5484D] font-medium" : "text-[#9A9A9A] hover:text-[#F5F5F5]"
                )}
                title="Edit raw text"
              >
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            </div>
          )}
          <button
            onClick={() => { setText(""); setInputError(null); }}
            disabled={!text}
            className="p-1 text-[#9A9A9A] hover:text-red-400 disabled:opacity-30 transition-colors"
            title="Clear input"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Loading banner */}
      {loading && (
        <div className="px-4 py-1.5 bg-[#E5484D]/10 border-b border-[#E5484D]/20 flex items-center gap-2 text-xs font-mono text-[#E5484D]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E5484D] animate-ping" />
          Scanning document: Running Prompt Injection Defender &amp; Presidio PII recognizers…
        </div>
      )}

      {/* ── Prompt Injection Alert Banner ── */}
      {injection?.detected && (
        <div className="p-3 bg-red-950/50 border-b border-red-500/50 text-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xs uppercase text-red-400">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              PROMPT INJECTION DETECTED
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-900/60 text-red-300 border border-red-700/50">
              Threat Level: {injection.threat_level}
            </span>
          </div>
          <div className="text-[11px] mt-1.5 space-y-1">
            <div><span className="font-semibold text-red-300">Threat Type:</span> {injection.threat_type}</div>
            <div><span className="font-semibold text-red-300">Description:</span> {injection.description}</div>
            <div className="flex items-center justify-between pt-1 border-t border-red-800/40 text-[10.5px]">
              <span><span className="font-semibold text-red-300">Action Taken:</span> External AI transmission blocked.</span>
              <span className="font-bold text-emerald-400">Status: PROTECTED</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Validation Error Banner (Suggested UI) ── */}
      {inputError && !injection?.detected && (
        <div className="p-3 bg-red-950/40 border-b border-red-500/40 text-red-300">
          <div className="flex items-center gap-2 font-bold text-xs uppercase text-red-400">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            INVALID INPUT DETECTED
          </div>
          <p className="text-[11px] mt-1 text-red-200">
            The submitted content does not appear to be a valid document or supported text input.
          </p>
          <p className="text-[10px] text-red-400/80 mt-0.5">
            Please provide a relevant business document, customer record, financial document, healthcare record or HR document.
          </p>
          <div className="text-[9.5px] font-mono text-red-400/90 mt-1 pt-1 border-t border-red-800/30">
            Diagnostics: {inputError}
          </div>
        </div>
      )}

      {/* ── Main Content Area ── */}
      <div className="flex-1 p-4 overflow-y-auto min-h-[320px] max-h-[500px] text-sm leading-relaxed relative">
        {text && showHighlights ? (
          <div className="font-mono text-[12.5px] whitespace-pre-wrap select-text leading-relaxed text-[#F5F5F5]/90">
            {renderHighlightedText(text, entities, hoveredPlaceholder, onHoverPlaceholder)}
          </div>
        ) : (
          /* Always show a textarea — even when empty so users can type directly */
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder={"Paste or type your document here…\n\nExamples:\n• Loan / KYC application with Aadhaar, PAN, phone\n• Healthcare intake / patient record\n• HR onboarding form\n• Support ticket with customer PII\n\nOr drag-and-drop / upload a .pdf, .docx, .txt, .json, .csv, .log or .md file above."}
            className="w-full h-full min-h-[300px] bg-transparent text-[#F5F5F5] font-mono text-[12.5px] leading-relaxed resize-none outline-none placeholder:text-[#9A9A9A]/40"
            spellCheck={false}
            autoFocus={!text}
          />
        )}
      </div>

      {/* ── Footer Status Bar ── */}
      <div className="px-4 py-2 border-t border-[#2A2A2A] bg-[#0F0F0F] flex items-center justify-between text-[11px] text-[#9A9A9A] font-mono">
        <div className="flex items-center gap-3">
          <span>{charCount.toLocaleString()} chars</span>
          <span>·</span>
          <span>{wordCount.toLocaleString()} words</span>
          {processedResult?.document_validation && (
            <>
              <span>·</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Valid Doc
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[#E5484D]">
          <Lock className="w-3 h-3" />
          <span>{entities.length > 0 ? `${entities.length} PII detected` : "Awaiting scan"}</span>
        </div>
      </div>
    </div>
  );
}
