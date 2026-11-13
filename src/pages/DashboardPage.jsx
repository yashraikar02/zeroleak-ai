import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Flame,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Radio,
  Server,
  Zap,
  RefreshCw
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";
import { getMetrics, getAuditHistory, checkBackendHealth, USE_MOCK } from "../api";
import { formatTimestamp, getEntityStyle, cn } from "../lib/utils";
import { useAnimations } from "../context/AnimationContext";
import { useGSAP } from "@gsap/react";
import { gsap } from "../gsap";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [health, setHealth] = useState({ connected: true, mode: "mock", latency_ms: 12 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef(null);
  const { animationsEnabled } = useAnimations();

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [m, a, h] = await Promise.all([
        getMetrics().catch(() => null),
        getAuditHistory().catch(() => []),
        checkBackendHealth().catch(() => ({ connected: false, mode: "unknown" }))
      ]);
      setMetrics(m);
      setAuditLogs(Array.isArray(a) ? a : []);
      setHealth(h);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useGSAP(
    () => {
      if (!animationsEnabled || loading) return;
      gsap.from(".dash-metric-card", {
        opacity: 0,
        y: 10,
        duration: 0.35,
        stagger: 0.05,
        ease: "power2.out",
      });
    },
    { scope: containerRef, dependencies: [animationsEnabled, loading] }
  );

  // Derived real operational statistics
  const totalDocuments = auditLogs.length;
  let totalEntities = 0;
  let requestsBlocked = 0;
  let outboundLeaks = 0;
  let totalLatency = 0;
  const securityEvents = [];
  const entityTypeCounts = {};

  auditLogs.forEach((log) => {
    if (log.latency_ms) totalLatency += log.latency_ms;
    if (log.leak_passed === false) outboundLeaks += 1;
    if (log.is_blocking || log.alerts?.some((a) => a.blocking)) requestsBlocked += 1;

    if (Array.isArray(log.entities)) {
      totalEntities += log.entities.length;
      log.entities.forEach((ent) => {
        entityTypeCounts[ent.type] = (entityTypeCounts[ent.type] || 0) + 1;
      });
    }

    if (Array.isArray(log.alerts) && log.alerts.length > 0) {
      log.alerts.forEach((alert) => {
        securityEvents.push({
          ...alert,
          request_id: log.request_id,
          timestamp: log.timestamp,
          department: log.department,
        });
      });
    }
  });

  const averageLatency = totalDocuments > 0 ? Math.round(totalLatency / totalDocuments) : 0;

  // Chart data from actual logs (chronological bucket by document index or timestamp)
  const activityChartData = auditLogs.slice(0, 10).reverse().map((log, idx) => ({
    name: log.request_id ? `#${log.request_id.slice(-4)}` : `Doc ${idx + 1}`,
    entities: log.entities?.length || 0,
    latency: log.latency_ms || 0,
    timestamp: log.timestamp ? formatTimestamp(log.timestamp) : `Req ${idx + 1}`,
  }));

  // Entity distribution array
  const entityDistributionData = Object.entries(entityTypeCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div ref={containerRef} className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2A2A2A] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-semibold text-[#F5F5F5] tracking-tight">Enterprise Overview</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#141414] text-[#9A9A9A] border border-[#2A2A2A]">
              DPDP Operations Console
            </span>
          </div>
          <p className="text-xs text-[#9A9A9A] mt-1">
            Real-time telemetry, zero-leakage verification, and policy enforcement metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="btn-secondary text-xs py-1.5 px-3"
            title="Refresh dashboard telemetry"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          <Link to="/app/gateway" className="btn-primary text-xs py-1.5 px-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Process Document</span>
          </Link>
        </div>
      </div>

      {/* 6 Key Operational Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Total Documents Processed */}
        <div className="dash-metric-card p-4 rounded-lg bg-[#141414] border border-[#2A2A2A] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#9A9A9A] mb-2">
            <span className="text-xs font-medium">Documents Processed</span>
            <FileText className="w-4 h-4 text-[#9A9A9A]" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono tracking-tight text-[#F5F5F5]">
              {loading ? "—" : totalDocuments.toLocaleString()}
            </div>
            <p className="text-[11px] text-[#9A9A9A] mt-1">
              {totalDocuments === 0 ? "No processing activity yet" : "Verified through gateway"}
            </p>
          </div>
        </div>

        {/* Total PII Entities Detected */}
        <div className="dash-metric-card p-4 rounded-lg bg-[#141414] border border-[#2A2A2A] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#9A9A9A] mb-2">
            <span className="text-xs font-medium">PII Entities Detected</span>
            <Lock className="w-4 h-4 text-[#E5484D]" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono tracking-tight text-[#F5F5F5]">
              {loading ? "—" : totalEntities.toLocaleString()}
            </div>
            <p className="text-[11px] text-[#9A9A9A] mt-1">
              {totalEntities === 0 ? "0 entities isolated" : "100% locally isolated"}
            </p>
          </div>
        </div>

        {/* Requests Blocked */}
        <div className="dash-metric-card p-4 rounded-lg bg-[#141414] border border-[#2A2A2A] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#9A9A9A] mb-2">
            <span className="text-xs font-medium">Requests Blocked</span>
            <ShieldAlert className="w-4 h-4 text-[#F5A524]" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono tracking-tight text-[#F5F5F5]">
              {loading ? "—" : requestsBlocked}
            </div>
            <p className="text-[11px] text-[#9A9A9A] mt-1">
              {requestsBlocked === 0 ? "0 policy violations" : "Outbound transmission halted"}
            </p>
          </div>
        </div>

        {/* Outbound PII Leakage Count */}
        <div className="dash-metric-card p-4 rounded-lg bg-[#141414] border border-[#2A2A2A] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#9A9A9A] mb-2">
            <span className="text-xs font-medium">Outbound Leakage</span>
            <Radio className={cn("w-4 h-4", outboundLeaks > 0 ? "text-[#E5484D]" : "text-[#E5484D]")} />
          </div>
          <div>
            <div className="text-xl font-bold font-mono tracking-tight text-[#F5F5F5]">
              {loading ? "—" : outboundLeaks}
            </div>
            <p className="text-[11px] text-[#9A9A9A] mt-1">
              {outboundLeaks === 0 ? "Zero leaks recorded" : "Quarantine triggered"}
            </p>
          </div>
        </div>

        {/* Average Processing Latency */}
        <div className="dash-metric-card p-4 rounded-lg bg-[#141414] border border-[#2A2A2A] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#9A9A9A] mb-2">
            <span className="text-xs font-medium">Avg Latency</span>
            <Clock className="w-4 h-4 text-[#9A9A9A]" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono tracking-tight text-[#F5F5F5]">
              {loading ? "—" : averageLatency > 0 ? `${averageLatency}ms` : "—"}
            </div>
            <p className="text-[11px] text-[#9A9A9A] mt-1">
              Gateway + LLM round-trip
            </p>
          </div>
        </div>

        {/* Security Health Indicator */}
        <div className="dash-metric-card p-4 rounded-lg bg-[#141414] border border-[#2A2A2A] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#9A9A9A] mb-2">
            <span className="text-xs font-medium">Gateway Health</span>
            <Server className={cn("w-4 h-4", health.connected ? "text-[#E5484D]" : "text-[#E5484D]")} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-base font-semibold text-[#F5F5F5]">
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
              <span className="text-xs font-mono">
                {health.connected ? (health.mode === "live" ? "Live Connected" : "Mock Ready") : "Disconnected"}
              </span>
            </div>
            <p className="text-[11px] text-[#9A9A9A] mt-1">
              {health.connected ? "Sentinel engines online" : "Waiting for backend"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Processing Activity Timeline Chart */}
        <div className="lg:col-span-8 p-5 rounded-lg bg-[#141414] border border-[#2A2A2A] space-y-4">
          <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#F5F5F5]">Recent Processing Activity</h2>
              <p className="text-xs text-[#9A9A9A]">
                Actual PII entities detected and gateway latency per document execution
              </p>
            </div>
            <span className="text-[11px] font-mono text-[#9A9A9A]">
              {activityChartData.length} records plotted
            </span>
          </div>

          <div className="h-64 w-full">
            {activityChartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#9A9A9A]">
                <FileText className="w-8 h-8 text-[#9A9A9A]/50 mb-2" />
                <p className="text-sm font-medium text-[#F5F5F5]">No processing activity yet</p>
                <p className="text-xs mt-1 max-w-sm">
                  Documents processed through the Privacy Gateway will chart real entity counts and latency profiles here.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#2A2A2A" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#9A9A9A"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "#2A2A2A" }}
                  />
                  <YAxis
                    stroke="#9A9A9A"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "#2A2A2A" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0F0F0F",
                      borderColor: "#2A2A2A",
                      borderRadius: "6px",
                      fontSize: "12px",
                      color: "#F5F5F5",
                    }}
                  />
                  <Bar dataKey="entities" name="Entities Isolated" fill="#E5484D" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Entity Classification Distribution */}
        <div className="lg:col-span-4 p-5 rounded-lg bg-[#141414] border border-[#2A2A2A] flex flex-col">
          <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#F5F5F5]">Detected PII Categories</h2>
              <p className="text-xs text-[#9A9A9A]">Distribution of isolated personal data</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-64 space-y-2 pr-1">
            {entityDistributionData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#9A9A9A]">
                <Lock className="w-8 h-8 text-[#9A9A9A]/50 mb-2" />
                <p className="text-xs font-medium text-[#F5F5F5]">No entities detected yet</p>
                <p className="text-[11px] mt-1">Awaiting document analysis</p>
              </div>
            ) : (
              entityDistributionData.map(({ type, count }) => {
                const style = getEntityStyle(type);
                const percent = Math.round((count / (totalEntities || 1)) * 100);
                return (
                  <div key={type} className="flex items-center justify-between text-xs py-1.5 border-b border-[#2A2A2A]/60 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-mono border", style.chip)}>
                        {type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-[#9A9A9A]">{percent}%</span>
                      <span className="font-semibold text-[#F5F5F5]">{count}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Security Event Table & Recent Audit Records */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Security Events Table */}
        <div className="lg:col-span-6 p-5 rounded-lg bg-[#141414] border border-[#2A2A2A] space-y-3">
          <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#F5A524]" />
              <h2 className="text-sm font-semibold text-[#F5F5F5]">Security Events & Alerts</h2>
            </div>
            <span className="text-[11px] font-mono text-[#9A9A9A]">
              {securityEvents.length} recorded
            </span>
          </div>

          <div className="overflow-y-auto max-h-64 space-y-2">
            {securityEvents.length === 0 ? (
              <div className="py-10 text-center text-[#9A9A9A] text-xs">
                <CheckCircle2 className="w-6 h-6 text-[#E5484D] mx-auto mb-1.5 opacity-80" />
                <p className="font-medium text-[#F5F5F5]">No security events recorded</p>
                <p className="text-[11px] mt-0.5">All outbound payloads passed zero-leakage verification.</p>
              </div>
            ) : (
              securityEvents.map((event, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-md bg-[#1A1A1A] border border-[#2A2A2A] text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "font-mono text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border",
                        event.severity === "critical"
                          ? "bg-[#E5484D]/15 text-[#E5484D] border-[#E5484D]/30"
                          : "bg-[#F5A524]/15 text-[#F5A524] border-[#F5A524]/30"
                      )}
                    >
                      {event.type}
                    </span>
                    <span className="text-[10px] font-mono text-[#9A9A9A]">
                      {event.timestamp ? formatTimestamp(event.timestamp) : "Recent"}
                    </span>
                  </div>
                  <p className="text-xs text-[#F5F5F5] leading-relaxed">{event.message}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Audit Records */}
        <div className="lg:col-span-6 p-5 rounded-lg bg-[#141414] border border-[#2A2A2A] space-y-3">
          <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#E5484D]" />
              <h2 className="text-sm font-semibold text-[#F5F5F5]">Recent Audit Records</h2>
            </div>
            <Link
              to="/app/audit"
              className="text-[11px] text-[#E5484D] hover:underline flex items-center gap-1 font-medium"
            >
              <span>View full audit log</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {auditLogs.length === 0 ? (
              <div className="py-10 text-center text-[#9A9A9A] text-xs">
                <FileText className="w-6 h-6 text-[#9A9A9A]/50 mx-auto mb-1.5" />
                <p className="font-medium text-[#F5F5F5]">0 actual records</p>
                <p className="text-[11px] mt-0.5">Process documents to create verifiable compliance records.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#2A2A2A] text-[#9A9A9A] text-[11px] font-mono uppercase">
                    <th className="pb-2 font-medium">Request</th>
                    <th className="pb-2 font-medium">Department</th>
                    <th className="pb-2 font-medium">Model</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium text-right">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A2A]/60">
                  {auditLogs.slice(0, 5).map((log) => {
                    const isBlocked = log.is_blocking || log.alerts?.some((a) => a.blocking);
                    return (
                      <tr key={log.request_id} className="table-row-hover">
                        <td className="py-2.5 font-mono text-[11px] text-[#F5F5F5]">
                          {log.request_id}
                        </td>
                        <td className="py-2.5 text-[#9A9A9A]">{log.department || "General"}</td>
                        <td className="py-2.5 text-[#9A9A9A] max-w-[120px] truncate">
                          {log.model || "Default LLM"}
                        </td>
                        <td className="py-2.5">
                          {isBlocked ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#E5484D]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#E5484D]" />
                              Blocked
                            </span>
                          ) : log.leak_passed === false ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#F5A524]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#F5A524]" />
                              Quarantine
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#E5484D]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#E5484D]" />
                              Passed
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 font-mono text-[11px] text-right text-[#9A9A9A]">
                          {log.latency_ms ? `${log.latency_ms}ms` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
