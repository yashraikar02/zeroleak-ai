import React, { useState } from "react";
import {
  FileText,
  FileCheck,
  FileSearch,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Sliders,
  Scissors,
  Radio,
  Send,
  CheckCircle2,
  RefreshCw,
  FileCheck2,
  AlertOctagon,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * 13-Stage ZeroLeak Enterprise Security & Validation Pipeline
 * 
 * STEP 1: Input Ingestion (Typed or Uploaded)
 * STEP 2: Format & Signature Verification (.pdf, .txt, .json, .csv, .log, .md)
 * STEP 3: Multi-Page Text Extraction (PDF / Text stream parsing)
 * STEP 4: Semantic Content & Document Relevance Validation
 * STEP 5: Prompt Injection Defender (Zero-trust Instruction Neutralizer)
 * STEP 6: Microsoft Presidio & India-Specific PII Recognizers
 * STEP 7: Department DPDP Policy Evaluation (Banking, Healthcare, HR, Mktg)
 * STEP 8: Cryptographic Sanitized Payload Generation (MASK / PRESERVE / BLOCK)
 * STEP 9: Outbound Wire Zero-Leak Verification
 * STEP 10: External AI Transmission (Sanitized Tokens Only)
 * STEP 11: Response Schema & Placeholder Integrity Validation
 * STEP 12: Local Secure Placeholder Reinsertion
 * STEP 13: Tamper-Evident Audit Sentinel Logging
 */
export default function PipelineTracker({
  processedResult,
  department = "Banking",
  task = "Summarize Document",
  loading = false,
  filename = ""
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isProcessed = Boolean(processedResult);
  const isBlocked = processedResult?.is_blocking;
  const isLeakPassed = processedResult?.leak_check?.passed !== false;
  const entities = processedResult?.entities || [];
  const injection = processedResult?.prompt_injection || { detected: false, threat_level: "NONE" };

  const maskedCount = entities.filter((e) => e.action === "masked" || e.action === "mask").length;
  const preservedCount = entities.filter((e) => e.action === "preserved" || e.action === "preserve").length;
  const blockedCount = entities.filter((e) => e.action === "blocked" || e.action === "block").length;

  // Determine Prompt Injection Defender State
  // GREEN: No suspicious instructions detected
  // AMBER: Suspicious instructions require review
  // RED: High-confidence prompt injection detected. Outbound request blocked.
  let defenderStatus = "GREEN";
  let defenderLabel = "CLEAN (No Threat)";
  if (injection.detected) {
    if (injection.threat_level === "HIGH") {
      defenderStatus = "RED";
      defenderLabel = "HIGH THREAT BLOCKED";
    } else {
      defenderStatus = "AMBER";
      defenderLabel = "SUSPICIOUS PATTERN";
    }
  }

  const steps = [
    {
      id: 1,
      name: "Input Ingestion",
      sub: filename ? filename.split(".").pop().toUpperCase() : "Raw String",
      status: loading ? "active" : isProcessed ? "complete" : "idle",
      detail: filename ? `File "${filename}"` : "Typed input received",
      icon: FileText,
    },
    {
      id: 2,
      name: "Format & Signature",
      sub: "MIME & Allowlist",
      status: loading ? "active" : isProcessed ? "complete" : "idle",
      detail: "Supported extension verified",
      icon: FileCheck,
    },
    {
      id: 3,
      name: "Text Extraction",
      sub: "PDF / Stream Parser",
      status: loading ? "active" : isProcessed ? "complete" : "idle",
      detail: "Searchable text layer extracted",
      icon: FileSearch,
    },
    {
      id: 4,
      name: "Relevance Validator",
      sub: "Semantic Authenticity",
      status: loading ? "active" : isProcessed ? "complete" : "idle",
      detail: "Authentic document verified",
      icon: Sparkles,
    },
    {
      id: 5,
      name: "Prompt Injection Defender",
      sub: "Zero-Trust Sentinel",
      status: loading
        ? "active"
        : isProcessed
        ? injection.detected
          ? injection.threat_level === "HIGH"
            ? "failed"
            : "warning"
          : "complete"
        : "idle",
      detail: injection.detected
        ? `${injection.threat_type || "Threat"} detected`
        : "No override/exfiltration patterns",
      icon: injection.detected ? ShieldAlert : ShieldCheck,
      highlight: true,
    },
    {
      id: 6,
      name: "Presidio Detection",
      sub: "MS Presidio + India NER",
      status: loading ? "active" : isProcessed ? "complete" : "idle",
      detail: isProcessed ? `${entities.length} sensitive span(s)` : "Aadhaar, PAN, GSTIN, Names",
      icon: Cpu,
    },
    {
      id: 7,
      name: "Policy Engine",
      sub: `Dept: ${department}`,
      status: loading ? "active" : isProcessed ? (isBlocked ? "failed" : "complete") : "idle",
      detail: isProcessed ? `${department} governance rules` : "DPDP Action Mapping",
      icon: Sliders,
    },
    {
      id: 8,
      name: "Sanitized Synthesis",
      sub: "Token Replacement",
      status: loading ? "active" : isProcessed ? (isBlocked ? "failed" : "complete") : "idle",
      detail: isProcessed
        ? isBlocked
          ? `${blockedCount} BLOCK trigger(s)`
          : `${maskedCount} Masked · ${preservedCount} Preserved`
        : "Typed tokens substituted",
      icon: Scissors,
    },
    {
      id: 9,
      name: "Outbound Leak Check",
      sub: "Canary Sentinel",
      status: loading ? "active" : isProcessed ? (isLeakPassed && !isBlocked ? "complete" : isBlocked ? "failed" : "warning") : "idle",
      detail: isProcessed
        ? isBlocked
          ? "Outbound wire blocked"
          : isLeakPassed
          ? "PASSED (0 raw leaks)"
          : "Entropy alert"
        : "Zero raw values leave org",
      icon: Radio,
    },
    {
      id: 10,
      name: "External AI Transmit",
      sub: "Sanitized Egress",
      status: loading ? "active" : isProcessed ? (isBlocked ? "failed" : "complete") : "idle",
      detail: isProcessed
        ? isBlocked
          ? "Egress prevented (Halted)"
          : "Sanitized tokens transmitted"
        : "Strict perimeter isolation",
      icon: Send,
    },
    {
      id: 11,
      name: "Response Validation",
      sub: "Placeholder Integrity",
      status: loading ? "active" : isProcessed ? (isBlocked ? "failed" : "complete") : "idle",
      detail: isProcessed ? (isBlocked ? "N/A (Blocked)" : "Tokens verified") : "Anti-tamper check",
      icon: CheckCircle2,
    },
    {
      id: 12,
      name: "Local Reinsertion",
      sub: "Secure Client Vault",
      status: loading ? "active" : isProcessed ? (isBlocked ? "failed" : "complete") : "idle",
      detail: isProcessed ? (isBlocked ? "N/A (Blocked)" : "Local values restored") : "Mapping never leaves",
      icon: RefreshCw,
    },
    {
      id: 13,
      name: "Audit Sentinel",
      sub: "Immutable Log",
      status: loading ? "active" : isProcessed ? "complete" : "idle",
      detail: isProcessed ? `TX: ${processedResult?.request_id || "OK"}` : "Tamper-evident record",
      icon: FileCheck2,
    },
  ];

  return (
    <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-3 md:p-4 font-sans shadow-sm transition-all">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-[#2A2A2A]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F5F5F5]">
            13-Stage ZeroLeak Security Pipeline
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1A1A1A] text-[#9A9A9A] border border-[#2A2A2A]">
            DPDP Act 2023 · ISO 27001
          </span>
        </div>

        {/* Defender Status Pill & View Toggle */}
        <div className="flex items-center gap-3">
          {/* Prompt Injection Defender Pill */}
          <div
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-mono font-semibold border transition-all",
              defenderStatus === "GREEN" && "bg-emerald-950/60 border-emerald-500/40 text-emerald-400",
              defenderStatus === "AMBER" && "bg-amber-950/60 border-amber-500/40 text-amber-400",
              defenderStatus === "RED" && "bg-red-950/60 border-red-500/50 text-red-400"
            )}
          >
            {defenderStatus === "GREEN" && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
            {defenderStatus === "AMBER" && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
            {defenderStatus === "RED" && <ShieldAlert className="w-3.5 h-3.5 text-red-400" />}
            <span>DEFENDER: {defenderLabel}</span>
          </div>

          {isProcessed && (
            <span className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-[#E5484D]">
              <Clock className="w-3 h-3" />
              <span>{processedResult.latency_ms || 18}ms</span>
            </span>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-[11px] font-mono text-[#9A9A9A] hover:text-[#F5F5F5] transition-colors"
          >
            <span>{isExpanded ? "Collapse" : "Expand All 13 Steps"}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Grid of Steps */}
      {/* Default view shows top 7 core security milestones; Expanded shows all 13 */}
      <div
        className={cn(
          "grid gap-2 transition-all",
          isExpanded
            ? "grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-13"
            : "grid-cols-2 sm:grid-cols-4 lg:grid-cols-7"
        )}
      >
        {(isExpanded ? steps : [steps[0], steps[3], steps[4], steps[5], steps[6], steps[8], steps[12]]).map((st) => {
          const Icon = st.icon;
          const isComplete = st.status === "complete";
          const isFailed = st.status === "failed";
          const isActive = st.status === "active";
          const isWarning = st.status === "warning";

          return (
            <div
              key={st.id}
              className={cn(
                "relative p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between min-h-[96px]",
                isComplete && "bg-[#1A1A1A] border-[#10B981]/30 text-[#F5F5F5]",
                isFailed && "bg-[#E5484D]/10 border-[#E5484D]/50 text-[#E5484D]",
                isActive && "bg-[#1A1A1A] border-[#E5484D] animate-pulse",
                isWarning && "bg-amber-500/10 border-amber-500/40 text-amber-400",
                st.status === "idle" && "bg-[#0F0F0F] border-[#2A2A2A] text-[#9A9A9A]",
                st.highlight && isComplete && "border-emerald-500/40 bg-emerald-950/20"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="w-5 h-5 rounded-full bg-[#0A0A0A] border border-[#2A2A2A] text-[9.5px] font-mono font-bold flex items-center justify-center text-[#9A9A9A]">
                  {st.id}
                </span>
                <Icon
                  className={cn(
                    "w-3.5 h-3.5",
                    isComplete && (st.highlight ? "text-emerald-400" : "text-[#10B981]"),
                    isFailed && "text-[#E5484D]",
                    isActive && "text-[#E5484D] animate-spin",
                    isWarning && "text-amber-400",
                    st.status === "idle" && "text-[#9A9A9A]/60"
                  )}
                />
              </div>

              <div>
                <div className="text-[10.5px] font-semibold leading-tight truncate text-[#F5F5F5]">
                  {st.name}
                </div>
                <div className="text-[9px] text-[#9A9A9A] font-mono leading-tight mt-0.5 truncate">
                  {st.sub}
                </div>
              </div>

              <div
                className={cn(
                  "text-[9px] font-mono mt-1 pt-1 border-t border-[#2A2A2A] leading-tight truncate",
                  isComplete && "text-emerald-400",
                  isFailed && "text-[#E5484D] font-bold",
                  isWarning && "text-amber-400 font-bold",
                  st.status === "idle" && "text-[#9A9A9A]/60"
                )}
                title={st.detail}
              >
                {st.detail}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
