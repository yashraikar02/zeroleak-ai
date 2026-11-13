import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  History,
  Search,
  Download,
  X,
  ShieldCheck,
  ShieldAlert,
  ArrowUpDown,
  Copy,
  Check,
  Clock,
  Eye,
  RefreshCw,
  Filter,
  FileText,
  ChevronLeft,
  ChevronRight,
  Radio,
  Lock
} from "lucide-react";
import { getAuditHistory } from "../api";
import { getEntityStyle, formatTimestamp, cn } from "../lib/utils";
import { toast } from "sonner";

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterRisk, setFilterRisk] = useState("all");
  const [sortField, setSortField] = useState("timestamp");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadLogs = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getAuditHistory();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load audit history:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `zeroleak_audit_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Audit records exported to JSON");
  };

  const handleExportCSV = () => {
    if (logs.length === 0) {
      toast.warning("No records to export.");
      return;
    }
    const headers = ["request_id", "timestamp", "department", "task", "model", "risk_level", "risk_score", "leak_passed", "latency_ms"];
    const rows = logs.map((l) => [
      l.request_id || "",
      l.timestamp || "",
      l.department || "",
      l.task || "",
      l.model || "",
      l.risk_level || "",
      l.risk_score || "",
      l.leak_passed !== false ? "PASSED" : "FLAGGED",
      l.latency_ms || "",
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", encodeURI(csvContent));
    downloadAnchor.setAttribute("download", `zeroleak_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Audit records exported to CSV");
  };

  const handleCopyPayload = (payload) => {
    navigator.clipboard.writeText(payload);
    setCopiedPayload(true);
    toast.success("Sanitized outbound wire payload copied");
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Filter and sort
  const filteredLogs = logs
    .filter((log) => {
      const q = searchTerm.toLowerCase();
      const matchId = log.request_id?.toLowerCase().includes(q);
      const matchDept = log.department?.toLowerCase().includes(q);
      const matchTask = log.task?.toLowerCase().includes(q);
      const matchModel = log.model?.toLowerCase().includes(q);
      const matchEntities = log.entity_types?.some((t) => t.toLowerCase().includes(q));

      const matchesSearch = !q || matchId || matchDept || matchTask || matchModel || matchEntities;
      const matchesDept = filterDept === "all" || log.department?.toLowerCase() === filterDept.toLowerCase();
      const matchesRisk = filterRisk === "all" || log.risk_level?.toLowerCase() === filterRisk.toLowerCase();

      return matchesSearch && matchesDept && matchesRisk;
    })
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (sortField === "timestamp") {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

  // Pagination calculation
  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2A2A2A] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-semibold text-[#F5F5F5] tracking-tight">Audit Trail & Compliance Records</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#141414] text-[#9A9A9A] border border-[#2A2A2A]">
              DPDP Act 2023 Log
            </span>
          </div>
          <p className="text-xs text-[#9A9A9A] mt-1">
            Immutable, verifiable records of every document processed, sanitized, and dispatched.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadLogs(true)}
            disabled={refreshing}
            className="btn-secondary text-xs py-1.5 px-3"
            title="Reload records from backend"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="btn-secondary text-xs py-1.5 px-3"
            title="Export audit records to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="btn-secondary text-xs py-1.5 px-3"
            title="Export audit records to JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#141414] p-3 rounded-lg border border-[#2A2A2A]">
        {/* Search */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#1A1A1A] rounded-md border border-[#2A2A2A] text-xs flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[#9A9A9A]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by Request ID, department, model, or entity type..."
            className="bg-transparent text-[#F5F5F5] placeholder:text-[#9A9A9A]/50 outline-none w-full text-xs"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Dept filter */}
          <select
            value={filterDept}
            onChange={(e) => {
              setFilterDept(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#1A1A1A] text-[#F5F5F5] border border-[#2A2A2A] rounded-md px-2.5 py-1 text-xs outline-none cursor-pointer"
          >
            <option value="all">All Departments</option>
            <option value="banking">Banking</option>
            <option value="healthcare">Healthcare</option>
            <option value="human resources">Human Resources</option>
            <option value="marketing">Marketing</option>
          </select>

          {/* Risk filter */}
          <select
            value={filterRisk}
            onChange={(e) => {
              setFilterRisk(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#1A1A1A] text-[#F5F5F5] border border-[#2A2A2A] rounded-md px-2.5 py-1 text-xs outline-none cursor-pointer"
          >
            <option value="all">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>

          {/* Page size */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-[#1A1A1A] text-[#F5F5F5] border border-[#2A2A2A] rounded-md px-2 py-1 text-xs outline-none cursor-pointer font-mono"
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
          </select>
        </div>
      </div>

      {/* Main Audit Records Table */}
      <div className="rounded-lg bg-[#141414] border border-[#2A2A2A] overflow-hidden">
        {logs.length === 0 ? (
          <div className="py-16 text-center text-[#9A9A9A] text-xs">
            <History className="w-8 h-8 text-[#9A9A9A]/40 mx-auto mb-2" />
            <p className="font-medium text-[#F5F5F5]">No audit records found</p>
            <p className="text-[11px] mt-0.5 max-w-sm mx-auto">
              Process documents through the Privacy Gateway to generate immutable compliance audit trails.
            </p>
            <Link to="/app/gateway" className="btn-primary text-xs py-1.5 px-3 mt-4 inline-flex">
              Open Privacy Gateway
            </Link>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-[#9A9A9A] text-xs">
            <p>No audit records matched your filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#2A2A2A] text-[#9A9A9A] text-[11px] font-mono uppercase bg-[#0F0F0F]">
                  <th
                    className="py-3 px-4 font-medium cursor-pointer hover:text-[#F5F5F5]"
                    onClick={() => toggleSort("request_id")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Request ID</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 font-medium cursor-pointer hover:text-[#F5F5F5]"
                    onClick={() => toggleSort("timestamp")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Timestamp</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 font-medium">Department & Purpose</th>
                  <th className="py-3 px-4 font-medium">External LLM</th>
                  <th className="py-3 px-4 font-medium">Detected Entities</th>
                  <th
                    className="py-3 px-4 font-medium cursor-pointer hover:text-[#F5F5F5]"
                    onClick={() => toggleSort("risk_score")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Risk</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 font-medium">Outbound Status</th>
                  <th
                    className="py-3 px-4 font-medium text-right cursor-pointer hover:text-[#F5F5F5]"
                    onClick={() => toggleSort("latency_ms")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Latency</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 font-medium text-center">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]/60">
                {paginatedLogs.map((log) => {
                  const isBlocked = log.is_blocking || log.alerts?.some((a) => a.blocking);
                  const isLeakFlagged = log.leak_passed === false;
                  const riskLevel = log.risk_level || "low";

                  return (
                    <tr key={log.request_id} className="table-row-hover">
                      {/* Request ID */}
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-[#F5F5F5]">
                        {log.request_id}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 text-[#9A9A9A] font-mono text-[11px] whitespace-nowrap">
                        {formatTimestamp(log.timestamp)}
                      </td>

                      {/* Department & Purpose */}
                      <td className="py-3 px-4">
                        <div className="text-[#F5F5F5] font-medium">{log.department || "General"}</div>
                        <div className="text-[10px] text-[#9A9A9A] truncate max-w-[150px]">
                          {log.task || "Process Document"}
                        </div>
                      </td>

                      {/* External LLM */}
                      <td className="py-3 px-4 text-[#9A9A9A] text-xs max-w-[140px] truncate font-mono">
                        {log.model || "Default LLM"}
                      </td>

                      {/* Detected Entities */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1 max-w-[180px]">
                          {(log.entity_types || []).slice(0, 3).map((t) => {
                            const style = getEntityStyle(t);
                            return (
                              <span
                                key={t}
                                className={cn(
                                  "text-[9px] font-mono px-1 py-0.2 rounded border",
                                  style.chip
                                )}
                              >
                                {t}
                              </span>
                            );
                          })}
                          {(log.entity_types || []).length > 3 && (
                            <span className="text-[9px] font-mono text-[#9A9A9A]">
                              +{(log.entity_types || []).length - 3}
                            </span>
                          )}
                          {(!log.entity_types || log.entity_types.length === 0) && (
                            <span className="text-[#9A9A9A] text-[11px]">None</span>
                          )}
                        </div>
                      </td>

                      {/* Risk */}
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "font-mono text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border inline-block",
                            riskLevel === "high"
                              ? "bg-[#E5484D]/15 text-[#E5484D] border-[#E5484D]/30"
                              : riskLevel === "medium"
                              ? "bg-[#F5A524]/15 text-[#F5A524] border-[#F5A524]/30"
                              : "bg-[#E5484D]/15 text-[#E5484D] border-[#E5484D]/30"
                          )}
                        >
                          {riskLevel}
                        </span>
                      </td>

                      {/* Outbound Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#E5484D]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E5484D]" />
                            Blocked
                          </span>
                        ) : isLeakFlagged ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#F5A524]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F5A524]" />
                            Quarantine
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#E5484D]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E5484D]" />
                            Zero Leakage
                          </span>
                        )}
                      </td>

                      {/* Latency */}
                      <td className="py-3 px-4 text-right font-mono text-xs text-[#9A9A9A]">
                        {log.latency_ms ? `${log.latency_ms}ms` : "—"}
                      </td>

                      {/* Inspect Button */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="btn-secondary text-[11px] py-1 px-2 text-[#9A9A9A] hover:text-[#F5F5F5]"
                          title="Inspect full audit record"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredLogs.length > 0 && (
          <div className="px-4 py-3 border-t border-[#2A2A2A] bg-[#0F0F0F] flex items-center justify-between text-xs text-[#9A9A9A]">
            <div className="font-mono text-[11px]">
              Showing {Math.min((currentPage - 1) * pageSize + 1, filteredLogs.length)} to{" "}
              {Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length} records
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn-secondary text-xs py-1 px-2 disabled:opacity-30"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <span className="font-mono text-[11px] px-2 text-[#F5F5F5]">
                Page {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn-secondary text-xs py-1 px-2 disabled:opacity-30"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Request Details Drawer / Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-[#2A2A2A] bg-[#0F0F0F] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#E5484D]" />
                <h3 className="text-sm font-semibold text-[#F5F5F5]">
                  Audit Record: <span className="font-mono text-[#E5484D]">{selectedLog.request_id}</span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-md text-[#9A9A9A] hover:text-[#F5F5F5] hover:bg-[#1A1A1A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#1A1A1A] p-3 rounded-md border border-[#2A2A2A]">
                <div>
                  <span className="text-[#9A9A9A] text-[10px] uppercase font-mono block">Department</span>
                  <span className="font-semibold text-[#F5F5F5]">{selectedLog.department || "General"}</span>
                </div>
                <div>
                  <span className="text-[#9A9A9A] text-[10px] uppercase font-mono block">Purpose / Task</span>
                  <span className="font-semibold text-[#F5F5F5]">{selectedLog.task || "Process Document"}</span>
                </div>
                <div>
                  <span className="text-[#9A9A9A] text-[10px] uppercase font-mono block">External LLM</span>
                  <span className="font-semibold text-[#F5F5F5]">{selectedLog.model || "Default"}</span>
                </div>
                <div>
                  <span className="text-[#9A9A9A] text-[10px] uppercase font-mono block">Latency</span>
                  <span className="font-semibold text-[#F5F5F5]">{selectedLog.latency_ms ? `${selectedLog.latency_ms}ms` : "—"}</span>
                </div>
              </div>

              {/* Wire Sanitized Payload */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#F5F5F5] text-xs">Exact Outbound Wire Payload</span>
                  <button
                    onClick={() => handleCopyPayload(selectedLog.sanitized_text)}
                    className="text-[11px] text-[#E5484D] hover:underline flex items-center gap-1 font-mono"
                  >
                    {copiedPayload ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPayload ? "Copied" : "Copy Wire Text"}</span>
                  </button>
                </div>
                <div className="p-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-md font-mono text-[12px] text-[#F5F5F5]/90 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {selectedLog.sanitized_text || "No wire payload stored."}
                </div>
              </div>

              {/* Final AI Response if present */}
              {selectedLog.final_response && (
                <div className="space-y-1.5">
                  <span className="font-semibold text-[#F5F5F5] text-xs">Restored AI Response</span>
                  <div className="p-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-md font-mono text-[12px] text-[#F5F5F5]/90 whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {selectedLog.final_response}
                  </div>
                </div>
              )}

              {/* Detected Entities */}
              {Array.isArray(selectedLog.entities) && selectedLog.entities.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-semibold text-[#F5F5F5] text-xs">
                    Isolated Entities ({selectedLog.entities.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedLog.entities.map((e, i) => {
                      const style = getEntityStyle(e.type);
                      return (
                        <div
                          key={i}
                          className="p-2 rounded bg-[#0F0F0F] border border-[#2A2A2A] flex items-center justify-between text-[11px]"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className={cn("px-1.5 py-0.2 rounded font-mono text-[9px] border", style.chip)}>
                              {e.type}
                            </span>
                            <span className="font-mono text-[#F5F5F5] truncate max-w-[120px]" title={e.original}>
                              {e.original}
                            </span>
                          </div>
                          <span className="font-mono text-[#E5484D]">{e.placeholder}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-[#2A2A2A] bg-[#0F0F0F] flex items-center justify-between text-xs text-[#9A9A9A]">
              <span className="font-mono text-[11px]">DPDP Act 2023 Cryptographic Trail</span>
              <button onClick={() => setSelectedLog(null)} className="btn-secondary text-xs py-1 px-3">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
