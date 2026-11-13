import React, { useState } from "react";
import {
  User,
  CreditCard,
  Hash,
  MapPin,
  Phone,
  Mail,
  FileBadge,
  ShieldCheck,
  AlertOctagon,
  HelpCircle,
  Calendar,
  Building,
  Search,
  Lock,
  Eye,
  Info
} from "lucide-react";
import { getEntityStyle, cn } from "../../lib/utils";

export function getEntityIcon(type) {
  switch (type?.toUpperCase()) {
    case "PERSON":
      return User;
    case "AADHAAR":
      return Hash;
    case "PAN":
      return CreditCard;
    case "GSTIN":
      return FileBadge;
    case "ADDRESS":
      return MapPin;
    case "PHONE":
      return Phone;
    case "EMAIL":
      return Mail;
    case "PASSPORT":
      return FileBadge;
    case "VOTER_ID":
      return ShieldCheck;
    case "DATE_OF_BIRTH":
      return Calendar;
    case "BANK_ACCOUNT":
      return Building;
    default:
      return HelpCircle;
  }
}

export default function ExplainabilitySection({ entities = [] }) {
  const [filter, setFilter] = useState("all"); // "all" | "masked" | "preserved" | "blocked"
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEntities = entities.filter((ent) => {
    const matchesFilter = filter === "all" || ent.action === filter;
    const matchesSearch =
      !searchQuery ||
      ent.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ent.original.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ent.placeholder.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ent.reason?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const countMasked = entities.filter((e) => e.action === "masked").length;
  const countPreserved = entities.filter((e) => e.action === "preserved").length;
  const countBlocked = entities.filter((e) => e.action === "blocked").length;

  return (
    <div className="rounded-lg bg-[#141414] border border-[#2A2A2A] p-5 space-y-4 font-sans">
      {/* Header and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2A2A2A] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#F5F5F5] flex items-center gap-2">
              <span>PII Explainability & Detection Rationale</span>
              <span className="text-xs font-mono font-medium text-[#E5484D]">
                ({entities.length} Detected)
              </span>
            </h3>
          </div>
          <p className="text-xs text-[#9A9A9A] mt-0.5">
            Presidio & Indic-NER recognizer confidence scores, local isolation mappings, and policy decisions
          </p>
        </div>

        {/* Filter chips & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1A1A1A] rounded-md border border-[#2A2A2A] text-xs">
            <Search className="w-3.5 h-3.5 text-[#9A9A9A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter entities..."
              className="bg-transparent text-[#F5F5F5] placeholder:text-[#9A9A9A]/50 outline-none w-28 sm:w-36 text-xs"
            />
          </div>

          {/* Action Filter Buttons */}
          <div className="flex items-center gap-1 bg-[#1A1A1A] p-0.5 rounded-md border border-[#2A2A2A] text-xs">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "px-2 py-0.5 rounded transition-colors text-[11px]",
                filter === "all"
                  ? "bg-[#141414] text-[#F5F5F5] font-semibold"
                  : "text-[#9A9A9A] hover:text-[#F5F5F5]"
              )}
            >
              All ({entities.length})
            </button>
            <button
              onClick={() => setFilter("masked")}
              className={cn(
                "px-2 py-0.5 rounded transition-colors text-[11px]",
                filter === "masked"
                  ? "bg-[#141414] text-[#E5484D] font-semibold"
                  : "text-[#9A9A9A] hover:text-[#F5F5F5]"
              )}
            >
              Masked ({countMasked})
            </button>
            <button
              onClick={() => setFilter("preserved")}
              className={cn(
                "px-2 py-0.5 rounded transition-colors text-[11px]",
                filter === "preserved"
                  ? "bg-[#141414] text-[#F5A524] font-semibold"
                  : "text-[#9A9A9A] hover:text-[#F5F5F5]"
              )}
            >
              Preserved ({countPreserved})
            </button>
            <button
              onClick={() => setFilter("blocked")}
              className={cn(
                "px-2 py-0.5 rounded transition-colors text-[11px]",
                filter === "blocked"
                  ? "bg-[#141414] text-[#E5484D] font-semibold"
                  : "text-[#9A9A9A] hover:text-[#F5F5F5]"
              )}
            >
              Blocked ({countBlocked})
            </button>
          </div>
        </div>
      </div>

      {/* Entities List / Table */}
      {entities.length === 0 ? (
        <div className="py-12 text-center text-[#9A9A9A] text-xs">
          <HelpCircle className="w-8 h-8 text-[#9A9A9A]/40 mx-auto mb-2" />
          <p className="font-medium text-[#F5F5F5]">No entities detected</p>
          <p className="text-[11px] mt-0.5">Submit or scan a document to inspect detection confidence and decision logic.</p>
        </div>
      ) : filteredEntities.length === 0 ? (
        <div className="py-8 text-center text-[#9A9A9A] text-xs">
          <p>No entities matched your search filter "{searchQuery}".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredEntities.map((ent, idx) => {
            const Icon = getEntityIcon(ent.type);
            const style = getEntityStyle(ent.type);
            const confidencePercent = Math.round((ent.score || 0.98) * 100);

            const isMasked = ent.action === "masked";
            const isPreserved = ent.action === "preserved";
            const isBlocked = ent.action === "blocked";

            return (
              <div
                key={idx}
                className="p-3.5 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] flex flex-col justify-between space-y-3"
              >
                {/* Top Row: Type and Action Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{ backgroundColor: style.bg, color: style.border }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-mono text-xs font-semibold text-[#F5F5F5]">
                      {ent.type}
                    </span>
                  </div>

                  <span
                    className={cn(
                      "font-mono text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border",
                      isMasked
                        ? "bg-[#E5484D]/15 text-[#E5484D] border-[#E5484D]/30"
                        : isPreserved
                        ? "bg-[#F5A524]/15 text-[#F5A524] border-[#F5A524]/30"
                        : "bg-[#E5484D]/15 text-[#E5484D] border-[#E5484D]/30"
                    )}
                  >
                    {ent.action}
                  </span>
                </div>

                {/* Middle: Mapping comparison */}
                <div className="space-y-1.5 bg-[#141414] p-2.5 rounded-md border border-[#2A2A2A] text-xs">
                  {/* Original Value (Authorized Local Interface Only) */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#9A9A9A] flex items-center gap-1">
                      <Lock className="w-3 h-3 text-[#E5484D]" />
                      <span>Original:</span>
                    </span>
                    <span className="font-mono font-medium text-[#F5F5F5] max-w-[170px] truncate" title={ent.original}>
                      {ent.original}
                    </span>
                  </div>

                  {/* Wire Placeholder */}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#2A2A2A]/60">
                    <span className="text-[#9A9A9A]">Outbound Wire:</span>
                    <span className="font-mono font-semibold text-[#E5484D]">
                      {ent.placeholder}
                    </span>
                  </div>
                </div>

                {/* Bottom: Reason & Confidence */}
                <div className="space-y-1.5 text-[11px]">
                  <p className="text-[#9A9A9A] leading-relaxed line-clamp-2" title={ent.reason}>
                    {ent.reason || "Matched standard identity validation pattern"}
                  </p>

                  <div className="flex items-center justify-between pt-1 font-mono text-[10px] text-[#9A9A9A]">
                    <span>Confidence:</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 h-1.5 bg-[#141414] rounded-full overflow-hidden border border-[#2A2A2A]">
                        <div
                          className="h-full bg-[#E5484D] rounded-full"
                          style={{ width: `${confidencePercent}%` }}
                        />
                      </div>
                      <span className="font-semibold text-[#F5F5F5]">{confidencePercent}%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
