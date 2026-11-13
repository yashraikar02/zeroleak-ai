import React, { useState } from "react";
import {
  ShieldAlert, Copy, Check, Cpu, Clock,
  Info, CheckCircle2, ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { renderRestoredText } from "../../lib/highlightText";
import { cn } from "../../lib/utils";

export default function FinalResponsePanel({
  finalResponse,
  entities = [],
  model,
  latencyMs,
  isBlocked,
  processedResult,
  hoveredPlaceholder,
  onHoverPlaceholder,
  processed,
  loading,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!finalResponse) return;
    navigator.clipboard.writeText(finalResponse);
    setCopied(true);
    toast.success("Final response (with original values restored) copied.");
    setTimeout(() => setCopied(false), 2000);
  };

  const droppedEntities = entities.filter((e) => e.returned_by_llm === false);

  return (
    <div className="flex flex-col h-full rounded-xl bg-[#141414] border border-[#2A2A2A] overflow-hidden">
      {/* ── Panel Header ── */}
      <div className="px-4 py-3 border-b border-[#2A2A2A] bg-[#0F0F0F] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-md bg-[#1A1A1A] border border-[#2A2A2A] text-[#9A9A9A] text-[11px] font-bold flex items-center justify-center">
            3
          </span>
          <div>
            <h2 className="text-xs font-semibold text-[#F5F5F5] leading-tight">
              AI Response — Restored Locally
            </h2>
            <p className="text-[10px] text-[#9A9A9A] leading-tight mt-0.5">
              Placeholders swapped back for real values — never sent outbound
            </p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          disabled={!finalResponse || isBlocked}
          className="btn-secondary text-[11px] py-1 px-2 disabled:opacity-40"
          title="Copy final AI response with restored values"
        >
          {copied ? <Check className="w-3 h-3 text-[#E5484D]" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      {/* ── Model & Latency bar ── */}
      {processed && !isBlocked && (
        <div className="px-4 py-2 bg-[#1A1A1A] border-b border-[#2A2A2A] flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-2 text-[#9A9A9A]">
            <Cpu className="w-3.5 h-3.5 text-[#E5484D]" />
            <span className="text-[#F5F5F5]">{model || "External LLM"}</span>
          </div>
          <div className="flex items-center gap-3 text-[#9A9A9A]">
            <span className="flex items-center gap-1 text-[#E5484D]">
              <CheckCircle2 className="w-3 h-3" />
              Locally restored
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {latencyMs ? `${latencyMs}ms` : "—"}
            </span>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 p-4 overflow-y-auto min-h-[320px] max-h-[500px] text-sm leading-relaxed bg-[#141414] select-text">
        {loading ? (
          <div className="space-y-3 py-2 animate-pulse">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E5484D] animate-ping" />
              <span className="text-xs font-mono text-[#9A9A9A]">Receiving LLM response &amp; restoring values locally…</span>
            </div>
            <div className="h-3.5 bg-[#1A1A1A] rounded w-11/12" />
            <div className="h-3.5 bg-[#1A1A1A] rounded w-9/12" />
            <div className="h-3.5 bg-[#1A1A1A] rounded w-10/12" />
          </div>
        ) : isBlocked ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-400">
                {processedResult?.prompt_injection?.detected && processedResult?.prompt_injection?.threat_level === "HIGH"
                  ? "Transmission Blocked: Prompt Injection Defender"
                  : "Transmission Blocked: DPDP Policy Enforcement"}
              </h3>
              <p className="text-xs text-[#9A9A9A] max-w-sm mt-1.5 leading-relaxed">
                {processedResult?.prompt_injection?.detected && processedResult?.prompt_injection?.threat_level === "HIGH"
                  ? "Adversarial instructions attempting to bypass security boundaries or extract tokens were neutralized. Egress halted."
                  : "This document contains entities configured with the BLOCK action under active DPDP governance rules. Egress prevented."}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/30 text-red-400 text-[10.5px] font-mono rounded">
                Egress Halted (0 bytes sent)
              </span>
              <span className="px-2.5 py-1 bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-[10.5px] font-mono rounded font-semibold">
                Status: PROTECTED
              </span>
            </div>
          </div>
        ) : processed && finalResponse ? (
          <div className="space-y-4">
            <div className="font-mono text-[12.5px] whitespace-pre-wrap leading-relaxed text-[#F5F5F5]/90">
              {renderRestoredText(finalResponse, entities, hoveredPlaceholder, onHoverPlaceholder)}
            </div>

            {droppedEntities.length > 0 && (
              <div className="p-3 rounded-md bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs flex items-start gap-2.5">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-0.5">Placeholder(s) Not Returned by LLM</div>
                  <p className="text-[11px] text-[#F5F5F5]/80 leading-relaxed">
                    The external model dropped{" "}
                    <span className="font-mono text-yellow-400">
                      {droppedEntities.map((e) => e.placeholder).join(", ")}
                    </span>
                    . Original values remain secure in local session memory.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#9A9A9A]">
            <Cpu className="w-8 h-8 text-[#9A9A9A]/40 mb-3" />
            <p className="text-xs font-medium text-[#F5F5F5]">Waiting for AI response</p>
            <p className="text-[11px] mt-1">The LLM reply will be restored here with real values</p>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-mono opacity-60">
              <span className="px-1.5 py-0.5 rounded bg-[#1A1A1A] border border-[#2A2A2A]">LLM Reply</span>
              <ArrowLeft className="w-3 h-3" />
              <span className="px-1.5 py-0.5 rounded bg-[#E5484D]/10 border border-[#E5484D]/25 text-[#E5484D]">Local Restore</span>
              <ArrowLeft className="w-3 h-3" />
              <span className="px-1.5 py-0.5 rounded bg-[#1A1A1A] border border-[#2A2A2A]">Your Answer</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="px-4 py-2 border-t border-[#2A2A2A] bg-[#0F0F0F] flex items-center justify-between text-[11px] text-[#9A9A9A] font-mono">
        <span>{finalResponse ? finalResponse.length.toLocaleString() : 0} chars</span>
        <div className="flex items-center gap-1.5 text-[#E5484D]">
          <CheckCircle2 className="w-3 h-3" />
          <span>Local Reinsertion Complete</span>
        </div>
      </div>
    </div>
  );
}
