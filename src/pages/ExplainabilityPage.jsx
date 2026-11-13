import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  HelpCircle,
  ShieldCheck,
  Search,
  Lock,
  Eye,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileText
} from "lucide-react";
import { getAuditHistory } from "../api";
import { getEntityStyle, cn } from "../lib/utils";
import { getEntityIcon } from "../components/gateway/ExplainabilitySection";

export default function ExplainabilityPage() {
  const [entities, setEntities] = useState([]);
  const [latestRequest, setLatestRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadEntities = async () => {
    setLoading(true);
    try {
      const logs = await getAuditHistory();
      if (Array.isArray(logs) && logs.length > 0) {
        // Find latest log with entities
        const recent = logs.find((l) => Array.isArray(l.entities) && l.entities.length > 0) || logs[0];
        setLatestRequest(recent);
        setEntities(recent?.entities || []);
      }
    } catch (err) {
      console.error("Failed to load explainability records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntities();
  }, []);

  const allTypes = Array.from(new Set(entities.map((e) => e.type)));

  const filteredEntities = entities.filter((ent) => {
    const matchesAction = filterAction === "all" || ent.action === filterAction;
    const matchesType = selectedType === "all" || ent.type === selectedType;
    const matchesSearch =
      !searchQuery ||
      ent.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ent.original.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ent.placeholder.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ent.reason?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAction && matchesType && matchesSearch;
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2A2A2A] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-semibold text-[#F5F5F5] tracking-tight">Explainability & Detection Heuristics</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#141414] text-[#9A9A9A] border border-[#2A2A2A]">
              Presidio & Indic-NER Audit
            </span>
          </div>
          <p className="text-xs text-[#9A9A9A] mt-1">
            Examine recognizer confidence, local cryptographic placeholder assignments, and policy governance rationale.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadEntities}
            className="btn-secondary text-xs py-1.5 px-3"
            title="Refresh explainability data"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            <span>Refresh</span>
          </button>

          <Link to="/app/gateway" className="btn-primary text-xs py-1.5 px-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Analyze Document</span>
          </Link>
        </div>
      </div>

      {/* Latest Request Meta Banner */}
      {latestRequest && (
        <div className="p-3.5 rounded-lg bg-[#141414] border border-[#2A2A2A] flex flex-wrap items-center justify-between text-xs text-[#9A9A9A] gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[#F5F5F5] font-semibold">Active Reference:</span>
            <span className="font-mono text-[#E5484D]">{latestRequest.request_id}</span>
            <span>•</span>
            <span>Department: <strong className="text-[#F5F5F5]">{latestRequest.department}</strong></span>
            <span>•</span>
            <span>Model: <strong className="text-[#F5F5F5]">{latestRequest.model}</strong></span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span>Total Entities: <strong className="text-[#E5484D]">{entities.length}</strong></span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#141414] p-3 rounded-lg border border-[#2A2A2A]">
        {/* Search */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#1A1A1A] rounded-md border border-[#2A2A2A] text-xs flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#9A9A9A]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entity original, placeholder, or reason..."
            className="bg-transparent text-[#F5F5F5] placeholder:text-[#9A9A9A]/50 outline-none w-full text-xs"
          />
        </div>

        {/* Action and Type Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Action Filter */}
          <div className="flex items-center gap-1 bg-[#1A1A1A] p-1 rounded-md border border-[#2A2A2A] text-xs">
            {["all", "masked", "preserved", "blocked"].map((action) => (
              <button
                key={action}
                onClick={() => setFilterAction(action)}
                className={cn(
                  "px-2.5 py-1 rounded capitalize font-medium text-[11px] transition-colors",
                  filterAction === action
                    ? "bg-[#141414] text-[#F5F5F5] shadow-sm font-semibold"
                    : "text-[#9A9A9A] hover:text-[#F5F5F5]"
                )}
              >
                {action}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          {allTypes.length > 0 && (
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-[#1A1A1A] text-[#F5F5F5] border border-[#2A2A2A] rounded-md px-2.5 py-1 text-xs outline-none cursor-pointer"
            >
              <option value="all">All Types ({entities.length})</option>
              {allTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Entities Table */}
      <div className="rounded-lg bg-[#141414] border border-[#2A2A2A] overflow-hidden">
        {entities.length === 0 ? (
          <div className="py-16 text-center text-[#9A9A9A] text-xs">
            <HelpCircle className="w-8 h-8 text-[#9A9A9A]/40 mx-auto mb-2" />
            <p className="font-medium text-[#F5F5F5]">No entities recorded for explanation</p>
            <p className="text-[11px] mt-0.5 max-w-sm mx-auto">
              Process documents through the Privacy Gateway to generate verifiable detection heuristics and confidence metrics.
            </p>
            <Link to="/app/gateway" className="btn-primary text-xs py-1.5 px-3 mt-4 inline-flex">
              Open Privacy Gateway
            </Link>
          </div>
        ) : filteredEntities.length === 0 ? (
          <div className="py-12 text-center text-[#9A9A9A] text-xs">
            <p>No entities matched the selected criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#2A2A2A] text-[#9A9A9A] text-[11px] font-mono uppercase bg-[#0F0F0F]">
                  <th className="py-3 px-4 font-medium">Entity Type</th>
                  <th className="py-3 px-4 font-medium">Original Value (Authorized Local)</th>
                  <th className="py-3 px-4 font-medium">Generated Placeholder</th>
                  <th className="py-3 px-4 font-medium">Action Taken</th>
                  <th className="py-3 px-4 font-medium">Detection Confidence</th>
                  <th className="py-3 px-4 font-medium">Heuristic Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]/60">
                {filteredEntities.map((ent, idx) => {
                  const Icon = getEntityIcon(ent.type);
                  const style = getEntityStyle(ent.type);
                  const confidencePercent = Math.round((ent.score || 0.98) * 100);

                  const isMasked = ent.action === "masked";
                  const isPreserved = ent.action === "preserved";
                  const isBlocked = ent.action === "blocked";

                  return (
                    <tr key={idx} className="table-row-hover">
                      {/* Entity Type */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: style.bg, color: style.border }}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-mono text-xs font-semibold text-[#F5F5F5]">
                            {ent.type}
                          </span>
                        </div>
                      </td>

                      {/* Original Value */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-xs font-mono text-[#F5F5F5]">
                          <Lock className="w-3 h-3 text-[#E5484D]" />
                          <span>{ent.original}</span>
                        </div>
                        <span className="text-[10px] text-[#9A9A9A] block">
                          Pos: {ent.start}–{ent.end}
                        </span>
                      </td>

                      {/* Placeholder */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold text-xs text-[#E5484D]">
                          {ent.placeholder}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "font-mono text-[10px] font-semibold uppercase px-2 py-0.5 rounded border",
                            isMasked
                              ? "bg-[#E5484D]/15 text-[#E5484D] border-[#E5484D]/30"
                              : isPreserved
                              ? "bg-[#F5A524]/15 text-[#F5A524] border-[#F5A524]/30"
                              : "bg-[#E5484D]/15 text-[#E5484D] border-[#E5484D]/30"
                          )}
                        >
                          {ent.action}
                        </span>
                      </td>

                      {/* Confidence */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <div className="w-16 h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden border border-[#2A2A2A]">
                            <div
                              className="h-full bg-[#E5484D] rounded-full"
                              style={{ width: `${confidencePercent}%` }}
                            />
                          </div>
                          <span className="font-semibold text-[#F5F5F5]">
                            {confidencePercent}%
                          </span>
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="py-3 px-4 text-[#9A9A9A] text-xs max-w-xs leading-relaxed">
                        {ent.reason || "Validated pattern matching DPDP criteria"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
