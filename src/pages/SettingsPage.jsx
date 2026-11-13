import React, { useState, useEffect } from "react";
import {
  Settings,
  Server,
  Cpu,
  Shield,
  Clock,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Wifi,
  WifiOff,
  Radio,
  Lock,
  KeyRound,
  ExternalLink,
  RefreshCw,
  Sliders
} from "lucide-react";
import {
  checkBackendHealth,
  USE_MOCK,
  setMockMode,
  getApiBaseUrl,
  setApiBaseUrl,
  clearStoredAudit
} from "../api";
import { toast } from "sonner";
import { cn } from "../lib/utils";

export default function SettingsPage() {
  const [health, setHealth] = useState({ connected: true, mode: USE_MOCK ? "mock" : "live", latency_ms: 12 });
  const [testingHealth, setTestingHealth] = useState(false);
  const [apiUrl, setApiUrlState] = useState(getApiBaseUrl());
  const [mockEnabled, setMockEnabledState] = useState(USE_MOCK);

  // Privacy preferences
  const [strictVerhoeff, setStrictVerhoeff] = useState(true);
  const [canarySentinel, setCanarySentinel] = useState(true);
  const [injectionDefense, setInjectionDefense] = useState(true);
  const [retentionDays, setRetentionDays] = useState("30");

  const runHealthCheck = async () => {
    setTestingHealth(true);
    try {
      const res = await checkBackendHealth();
      setHealth(res);
      if (res.connected) {
        toast.success(`Backend ping successful (${res.latency_ms}ms)`);
      } else {
        toast.error("Backend unreachable. Please verify server is running on " + apiUrl);
      }
    } catch (e) {
      toast.error("Health check failed.");
    } finally {
      setTestingHealth(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const handleToggleMock = (enabled) => {
    setMockEnabledState(enabled);
    setMockMode(enabled);
    toast.info(`Switched to ${enabled ? "Mock Mode" : "Live Backend API"}`);
    runHealthCheck();
  };

  const handleSaveApiUrl = () => {
    setApiBaseUrl(apiUrl);
    toast.success(`API URL updated to: ${apiUrl}`);
    runHealthCheck();
  };

  const handleClearAuditCache = () => {
    if (confirm("Are you sure you want to purge all locally cached audit logs?")) {
      clearStoredAudit();
      toast.success("Local audit history cleared.");
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2A2A2A] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-semibold text-[#F5F5F5] tracking-tight">System Settings</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#141414] text-[#9A9A9A] border border-[#2A2A2A]">
              Configuration Console
            </span>
          </div>
          <p className="text-xs text-[#9A9A9A] mt-1">
            Backend connectivity, external LLM provider status, privacy preferences, and audit retention.
          </p>
        </div>

        <button
          onClick={runHealthCheck}
          disabled={testingHealth}
          className="btn-secondary text-xs py-1.5 px-3"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", testingHealth && "animate-spin")} />
          <span>Test Connection</span>
        </button>
      </div>

      {/* 1. Backend Connection Status */}
      <div className="rounded-lg bg-[#141414] border border-[#2A2A2A] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#E5484D]" />
            <h2 className="text-sm font-semibold text-[#F5F5F5]">Backend API Connection</h2>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                health.connected
                  ? health.mode === "live"
                    ? "bg-[#E5484D]"
                    : "bg-[#F5A524]"
                  : "bg-[#E5484D]"
              )}
            />
            <span className="text-[#F5F5F5] font-medium">
              {health.connected
                ? health.mode === "live"
                  ? `Connected (${health.latency_ms}ms)`
                  : "Mock Mode Active"
                : "Disconnected"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Base URL configuration */}
          <div className="space-y-1.5">
            <label className="text-[#9A9A9A] font-medium block">API Base URL</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrlState(e.target.value)}
                placeholder="http://localhost:8000"
                className="bg-[#1A1A1A] text-[#F5F5F5] font-mono text-xs border border-[#2A2A2A] rounded-md px-3 py-1.5 flex-1 outline-none"
              />
              <button onClick={handleSaveApiUrl} className="btn-secondary text-xs py-1.5 px-3">
                Save
              </button>
            </div>
            <p className="text-[11px] text-[#9A9A9A]">
              Endpoint for /api/process, /api/policies, /api/audit, and /api/metrics.
            </p>
          </div>

          {/* Mock mode toggle */}
          <div className="space-y-1.5">
            <label className="text-[#9A9A9A] font-medium block">Execution Mode</label>
            <div className="flex items-center justify-between p-2.5 rounded-md bg-[#1A1A1A] border border-[#2A2A2A]">
              <div>
                <span className="font-semibold text-[#F5F5F5] block">In-Browser Mock Mode</span>
                <span className="text-[11px] text-[#9A9A9A]">
                  Run full standalone simulation without external server dependencies
                </span>
              </div>
              <input
                type="checkbox"
                checked={mockEnabled}
                onChange={(e) => handleToggleMock(e.target.checked)}
                className="w-4 h-4 accent-[#E5484D] cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. External LLM Provider Status (Never showing API secrets!) */}
      <div className="rounded-lg bg-[#141414] border border-[#2A2A2A] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#E5484D]" />
            <h2 className="text-sm font-semibold text-[#F5F5F5]">External LLM Providers</h2>
          </div>
          <span className="text-[11px] font-mono text-[#9A9A9A]">Secrets Redacted</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Gemini */}
          <div className="p-3 rounded-md bg-[#1A1A1A] border border-[#2A2A2A] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#F5F5F5]">Google Gemini 1.5 Pro</span>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#E5484D]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E5484D]" />
                Ready
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-[#9A9A9A] pt-1 border-t border-[#2A2A2A]">
              <span>Key:</span>
              <span>••••••••••••••••3821</span>
            </div>
            <span className="text-[10px] text-[#9A9A9A] block">Wire payload dispatched over TLS 1.3</span>
          </div>

          {/* OpenAI */}
          <div className="p-3 rounded-md bg-[#1A1A1A] border border-[#2A2A2A] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#F5F5F5]">OpenAI GPT-4o</span>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#E5484D]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E5484D]" />
                Ready
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-[#9A9A9A] pt-1 border-t border-[#2A2A2A]">
              <span>Key:</span>
              <span>••••••••••••••••9104</span>
            </div>
            <span className="text-[10px] text-[#9A9A9A] block">Wire payload dispatched over TLS 1.3</span>
          </div>

          {/* Local SLM */}
          <div className="p-3 rounded-md bg-[#1A1A1A] border border-[#2A2A2A] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#F5F5F5]">ZeroLeak Local SLM</span>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#E5484D]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E5484D]" />
                Active
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-[#9A9A9A] pt-1 border-t border-[#2A2A2A]">
              <span>Instance:</span>
              <span>Llama-3-8B-Airgap</span>
            </div>
            <span className="text-[10px] text-[#9A9A9A] block">Zero external cloud dispatch</span>
          </div>
        </div>
      </div>

      {/* 3. Privacy & Security Preferences */}
      <div className="rounded-lg bg-[#141414] border border-[#2A2A2A] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#E5484D]" />
            <h2 className="text-sm font-semibold text-[#F5F5F5]">Privacy & Sentinel Preferences</h2>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          {/* Verhoeff Checksum */}
          <div className="flex items-center justify-between p-3 rounded-md bg-[#1A1A1A] border border-[#2A2A2A]">
            <div>
              <span className="font-semibold text-[#F5F5F5] block">Strict Verhoeff Checksum Algorithm</span>
              <span className="text-[11px] text-[#9A9A9A]">
                Mathematically validate 12-digit Indian Aadhaar patterns to prevent false-positive masking
              </span>
            </div>
            <input
              type="checkbox"
              checked={strictVerhoeff}
              onChange={(e) => setStrictVerhoeff(e.target.checked)}
              className="w-4 h-4 accent-[#E5484D] cursor-pointer"
            />
          </div>

          {/* Outbound Canary Sentinel */}
          <div className="flex items-center justify-between p-3 rounded-md bg-[#1A1A1A] border border-[#2A2A2A]">
            <div>
              <span className="font-semibold text-[#F5F5F5] block">Outbound Canary Token Leak Sentinel</span>
              <span className="text-[11px] text-[#9A9A9A]">
                Inject ephemeral synthetic canary digests to verify zero unmasked entropy in outbound wire buffer
              </span>
            </div>
            <input
              type="checkbox"
              checked={canarySentinel}
              onChange={(e) => setCanarySentinel(e.target.checked)}
              className="w-4 h-4 accent-[#E5484D] cursor-pointer"
            />
          </div>

          {/* Prompt Injection Heuristics */}
          <div className="flex items-center justify-between p-3 rounded-md bg-[#1A1A1A] border border-[#2A2A2A]">
            <div>
              <span className="font-semibold text-[#F5F5F5] block">Prompt Injection & Jailbreak Neutralizer</span>
              <span className="text-[11px] text-[#9A9A9A]">
                Trap adversarial SYSTEM OVERRIDE exploits before payload packaging
              </span>
            </div>
            <input
              type="checkbox"
              checked={injectionDefense}
              onChange={(e) => setInjectionDefense(e.target.checked)}
              className="w-4 h-4 accent-[#E5484D] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 4. Retention Configuration & Data Governance */}
      <div className="rounded-lg bg-[#141414] border border-[#2A2A2A] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#E5484D]" />
            <h2 className="text-sm font-semibold text-[#F5F5F5]">Audit Log Retention & Cache Purge</h2>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <span className="font-semibold text-[#F5F5F5] block">DPDP Act Compliance Retention Window</span>
            <span className="text-[11px] text-[#9A9A9A]">
              Automatically cycle compliance records older than the selected window
            </span>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={retentionDays}
              onChange={(e) => setRetentionDays(e.target.value)}
              className="bg-[#1A1A1A] text-[#F5F5F5] border border-[#2A2A2A] rounded-md px-3 py-1.5 text-xs outline-none cursor-pointer font-mono"
            >
              <option value="7">7 Days</option>
              <option value="30">30 Days</option>
              <option value="90">90 Days</option>
              <option value="365">1 Year (DPDP Standard)</option>
            </select>

            <button
              onClick={handleClearAuditCache}
              className="btn-secondary text-xs py-1.5 px-3 text-[#E5484D] hover:bg-[#E5484D]/10 hover:border-[#E5484D]/40"
              title="Purge locally stored audit trail cache"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge Cache</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Application Information */}
      <div className="p-4 rounded-lg bg-[#0F0F0F] border border-[#2A2A2A] text-xs text-[#9A9A9A] space-y-2 font-mono">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <span>Application: <strong className="text-[#F5F5F5]">ZeroLeak AI</strong></span>
          <span>Version: <strong className="text-[#E5484D]">2.4.0-enterprise</strong></span>
          <span>Standard: <strong className="text-[#F5F5F5]">DPDP Act 2023</strong></span>
          <span>Core: <strong className="text-[#F5F5F5]">Presidio Indic-NER Sentinel</strong></span>
        </div>
      </div>
    </div>
  );
}
