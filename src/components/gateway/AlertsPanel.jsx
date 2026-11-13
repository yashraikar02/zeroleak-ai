import React from "react";
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  ShieldAlert,
  Flame,
  Radio,
  FileWarning,
  CheckCircle2
} from "lucide-react";
import { cn } from "../../lib/utils";

export default function AlertsPanel({ alerts = [] }) {
  const hasBlocking = alerts.some((a) => a.blocking);

  const getAlertIcon = (type, severity) => {
    if (type === "prompt_injection") return Flame;
    if (type === "canary_leak") return Radio;
    if (type === "policy_violation") return FileWarning;
    if (severity === "critical") return AlertOctagon;
    if (severity === "warning") return AlertTriangle;
    return Info;
  };

  return (
    <div className="rounded-lg bg-[#141414] border border-[#2A2A2A] p-5 space-y-4 font-sans h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F5F5F5] flex items-center gap-2">
            <span>Security & Compliance Alerts</span>
            <span
              className={cn(
                "text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded border",
                alerts.length > 0
                  ? "bg-[#E5484D]/15 text-[#E5484D] border-[#E5484D]/30"
                  : "bg-[#E5484D]/15 text-[#E5484D] border-[#E5484D]/30"
              )}
            >
              {alerts.length} Alert{alerts.length !== 1 ? "s" : ""}
            </span>
          </h3>
          <p className="text-[11px] text-[#9A9A9A] mt-0.5">
            Adversarial prompt injection, policy violation, and canary token monitoring
          </p>
        </div>

        {hasBlocking && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#E5484D]/15 border border-[#E5484D]/30 text-[#E5484D] text-[10px] font-mono font-semibold rounded">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>DISPATCH BLOCKED</span>
          </div>
        )}
      </div>

      {/* Full-width blocking alert banner if blocking=true */}
      {hasBlocking && (
        <div className="p-3 rounded-md bg-[#E5484D]/10 border border-[#E5484D]/30 text-[#E5484D] flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="font-semibold text-xs">Transmission Halted: Policy Block Triggered</h4>
            <p className="text-[11px] text-[#F5F5F5]/80 leading-relaxed">
              This request was completely blocked from leaving the local perimeter. Input violates mandatory DPDP governance configured for this department. No data was sent to the cloud.
            </p>
          </div>
        </div>
      )}

      {/* Alerts list */}
      <div className="space-y-2 flex-1 overflow-y-auto max-h-48 pr-1">
        {alerts.length > 0 ? (
          alerts.map((alert, idx) => {
            const Icon = getAlertIcon(alert.type, alert.severity);
            const isCrit = alert.severity === "critical";
            const isWarn = alert.severity === "warning";

            return (
              <div
                key={idx}
                className={cn(
                  "p-2.5 rounded-md border flex items-start gap-2.5 text-xs transition-colors",
                  isCrit
                    ? "bg-[#1A1616] border-[#E5484D]/30 text-[#F5F5F5]"
                    : isWarn
                    ? "bg-[#1A1814] border-[#F5A524]/30 text-[#F5F5F5]"
                    : "bg-[#1A1A1A] border-[#2A2A2A] text-[#F5F5F5]"
                )}
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded flex items-center justify-center flex-shrink-0",
                    isCrit
                      ? "bg-[#E5484D]/15 text-[#E5484D]"
                      : isWarn
                      ? "bg-[#F5A524]/15 text-[#F5A524]"
                      : "bg-[#E5484D]/15 text-[#E5484D]"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[#141414] border border-[#2A2A2A] text-[#9A9A9A]">
                      {alert.type?.replace(/_/g, " ")}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-mono font-medium capitalize",
                        isCrit ? "text-[#E5484D]" : isWarn ? "text-[#F5A524]" : "text-[#E5484D]"
                      )}
                    >
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-xs text-[#F5F5F5]/90 leading-relaxed">{alert.message}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-[#9A9A9A]">
            <CheckCircle2 className="w-6 h-6 text-[#E5484D] mb-1.5 opacity-80" />
            <p className="text-xs font-medium text-[#F5F5F5]">No Security Alerts</p>
            <p className="text-[11px] mt-0.5">Payload passed prompt injection and leak verification</p>
          </div>
        )}
      </div>
    </div>
  );
}
