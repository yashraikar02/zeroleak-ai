import React, { useState } from "react";
import {
  Copy, Check, ShieldCheck, Radio, Lock,
  ShieldAlert, CheckCircle2, ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { renderSanitizedText } from "../../lib/highlightText";
import { cn } from "../../lib/utils";

export default function SanitizedPayloadPanel({
  sanitizedText,
  entities = [],
  leakCheck,
  hoveredPlaceholder,
  onHoverPlaceholder,
  processed,
  requestId,
  loading,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!sanitizedText) return;
    navigator.clipboard.writeText(sanitizedText);
    setCopied(true);
    toast.success("Sanitized payload copied — this is exactly what the LLM receives.");
    setTimeout(() => setCopied(false), 2000);
  };

  const isLeakPassed = leakCheck ? leakCheck.passed : true;
  const leakedCount = leakCheck ? leakCheck.leaked_count : 0;
  const maskedCount = entities.filter((e) => e.action === "masked" || e.action === "mask").length;
  const blockedCount = entities.filter((e) => e.action === "block").length;

  return (
    <div className="flex flex-col h-full rounded-xl bg-[#141414] border border-[#2A2A2A] overflow-hidden">
      {/* ── Panel Header ── */}
      <div className="px-4 py-3 border-b border-[#2A2A2A] bg-[#0F0F0F] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-md bg-[#E5484D]/20 border border-[#E5484D]/40 text-[#E5484D] text-[11px] font-bold flex items-center justify-center">
            2
          </span>
          <div>
            <h2 className="text-xs font-semibold text-[#F5F5F5] leading-tight">
              What Gets Sent to the AI
            </h2>
            <p className="text-[10px] text-[#9A9A9A] leading-tight mt-0.5">
              All PII replaced with safe placeholders — no raw data leaves
            </p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          disabled={!sanitizedText}
          className="btn-secondary text-[11px] py-1 px-2 disabled:opacity-40"
          title="Copy the exact payload sent to the external LLM"
        >
          {copied ? <Check className="w-3 h-3 text-[#E5484D]" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      {/* ── Zero-Leakage Notice ── */}
      <div className="px-4 py-2 bg-[#1A1A1A] border-b border-[#2A2A2A] flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2 text-[#9A9A9A]">
          <Lock className="w-3.5 h-3.5 text-[#E5484D] flex-shrink-0" />
          <span>Original values replaced with typed tokens — mapping stays local only</span>
        </div>
        <span className="ml-2 flex-shrink-0 font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#E5484D]/10 text-[#E5484D] border border-[#E5484D]/25">
          DPDP Compliant
        </span>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 p-4 overflow-y-auto min-h-[320px] max-h-[500px] text-sm leading-relaxed bg-[#141414] select-text">
        {loading ? (
          <div className="space-y-3 py-2 animate-pulse">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E5484D] animate-ping" />
              <span className="text-xs font-mono text-[#9A9A9A]">Replacing PII with typed placeholders…</span>
            </div>
            <div className="h-3.5 bg-[#1A1A1A] rounded w-11/12" />
            <div className="h-3.5 bg-[#1A1A1A] rounded w-8/12" />
            <div className="h-3.5 bg-[#1A1A1A] rounded w-10/12" />
          </div>
        ) : processed && sanitizedText ? (
          <div className="font-mono text-[12.5px] whitespace-pre-wrap leading-relaxed text-[#F5F5F5]/90">
            {renderSanitizedText(sanitizedText, entities, hoveredPlaceholder, onHoverPlaceholder)}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#9A9A9A]">
            <Radio className="w-8 h-8 text-[#9A9A9A]/40 mb-3" />
            <p className="text-xs font-medium text-[#F5F5F5]">Waiting for document processing</p>
            <p className="text-[11px] mt-1">The safe, anonymised payload will appear here</p>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-mono opacity-60">
              <span className="px-1.5 py-0.5 rounded bg-[#1A1A1A] border border-[#2A2A2A]">Your Document</span>
              <ArrowRight className="w-3 h-3" />
              <span className="px-1.5 py-0.5 rounded bg-[#E5484D]/10 border border-[#E5484D]/25 text-[#E5484D]">Presidio Scan</span>
              <ArrowRight className="w-3 h-3" />
              <span className="px-1.5 py-0.5 rounded bg-[#1A1A1A] border border-[#2A2A2A]">Safe Payload</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Leak Sentinel Status ── */}
      {processed && (
        <div className="px-4 py-2 border-t border-[#2A2A2A] bg-[#1A1A1A] flex items-center justify-between text-[11px] font-mono">
          {isLeakPassed ? (
            <div className="flex items-center gap-1.5 text-[#E5484D]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Leak Check: PASSED — 0 raw values in outbound</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-red-400">
              <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
              <span>Leak Alert: {leakedCount} raw value(s) detected in outbound!</span>
            </div>
          )}
          {requestId && (
            <span className="text-[#9A9A9A] text-[10px]">ID: {requestId}</span>
          )}
        </div>
      )}

      {/* ── Footer ── */}
      <div className="px-4 py-2 border-t border-[#2A2A2A] bg-[#0F0F0F] flex items-center justify-between text-[11px] text-[#9A9A9A] font-mono">
        <div className="flex items-center gap-3">
          <span>{sanitizedText ? sanitizedText.length.toLocaleString() : 0} chars</span>
          <span>·</span>
          <span className="text-[#E5484D]">{maskedCount} masked</span>
          {blockedCount > 0 && (
            <><span>·</span><span className="text-red-400">{blockedCount} blocked</span></>
          )}
        </div>
        <span className="text-[#E5484D]">Presidio Engine</span>
      </div>
    </div>
  );
}
