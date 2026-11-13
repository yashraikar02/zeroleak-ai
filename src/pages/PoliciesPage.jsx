import React, { useState, useEffect } from "react";
import {
  Sliders,
  Save,
  CheckCircle2,
  ShieldAlert,
  RotateCcw,
  Sparkles,
  Info,
  Building2,
  Lock,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import { DEPARTMENTS, INITIAL_POLICIES } from "../mockData";
import { getPolicies, updateDepartmentPolicy } from "../api";
import { toast } from "sonner";
import { getEntityStyle, cn } from "../lib/utils";
import { getEntityIcon } from "../components/gateway/ExplainabilitySection";

const POLICY_CATEGORIES = [
  { id: "PERSON", label: "Individual Names (Person)", desc: "First, middle, and last proper names of citizens" },
  { id: "AADHAAR", label: "Aadhaar UIDAI (12-digit)", desc: "Biometric identity number with Verhoeff checksum validation" },
  { id: "PAN", label: "PAN Card (10-char alphanumeric)", desc: "Indian Income Tax Permanent Account Number" },
  { id: "GSTIN", label: "GST Identification Number", desc: "15-digit State Goods and Services Tax identifier" },
  { id: "PHONE", label: "Mobile / Telecom Numbers", desc: "Indian cellular +91 telecom subscriber series" },
  { id: "EMAIL", label: "Electronic Mail Addresses", desc: "RFC 5322 personal and enterprise email addresses" },
  { id: "ADDRESS", label: "Physical Street Addresses", desc: "Postal delivery addresses and 6-digit Indian PIN codes" },
  { id: "PASSPORT", label: "Indian Passport Number", desc: "Consular Passport document identification" },
  { id: "VOTER_ID", label: "Voter ID (EPIC Card)", desc: "Election Commission of India photo identity document" },
  { id: "DATE_OF_BIRTH", label: "Date of Birth (DOB)", desc: "Calendar birth date identifiers (DD-MM-YYYY)" },
  { id: "BANK_ACCOUNT", label: "Bank Account Numbers", desc: "Core banking savings / current account identifiers" },
];

export default function PoliciesPage() {
  const [activeDept, setActiveDept] = useState("Banking");
  const [policies, setPolicies] = useState(INITIAL_POLICIES);
  const [persistedPolicies, setPersistedPolicies] = useState(INITIAL_POLICIES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getPolicies();
        setPolicies(data);
        setPersistedPolicies(JSON.parse(JSON.stringify(data)));
      } catch (err) {
        console.error("Error loading policies:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleActionChange = (entityId, action) => {
    setPolicies((prev) => {
      const updatedDept = {
        ...(prev[activeDept] || {}),
        [entityId]: action,
      };
      const updated = {
        ...prev,
        [activeDept]: updatedDept,
      };
      // Check if dirty compared to persisted
      const isStillDifferent = JSON.stringify(updated[activeDept]) !== JSON.stringify(persistedPolicies[activeDept]);
      setDirty(isStillDifferent);
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedDeptPolicy = await updateDepartmentPolicy(activeDept, policies[activeDept]);
      setPersistedPolicies((prev) => ({
        ...prev,
        [activeDept]: updatedDeptPolicy,
      }));
      setDirty(false);
      toast.success(`Security policies for "${activeDept}" saved to backend successfully!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save policies to backend.");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setPolicies(JSON.parse(JSON.stringify(persistedPolicies)));
    setDirty(false);
    toast.info("Unsaved modifications reverted to backend configuration.");
  };

  const handleResetDefaults = () => {
    const defaultDeptRules = INITIAL_POLICIES[activeDept] || INITIAL_POLICIES["Banking"];
    setPolicies((prev) => ({
      ...prev,
      [activeDept]: { ...defaultDeptRules },
    }));
    setDirty(true);
    toast.info(`Reset "${activeDept}" to DPDP standard recommendations. Click Save to persist.`);
  };

  const currentDeptRules = policies[activeDept] || {};

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto font-sans">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2A2A2A] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-semibold text-[#F5F5F5] tracking-tight">Policy Control Centre</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#141414] text-[#9A9A9A] border border-[#2A2A2A]">
              DPDP Governance Rules
            </span>
          </div>
          <p className="text-xs text-[#9A9A9A] mt-1">
            Configure entity-level data governance policies per department. Actions: MASK, PRESERVE, or BLOCK.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {dirty && (
            <button
              onClick={handleDiscard}
              disabled={saving}
              className="btn-secondary text-xs py-1.5 px-3 text-[#9A9A9A] hover:text-[#E5484D]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Discard Changes</span>
            </button>
          )}

          <button
            onClick={handleResetDefaults}
            disabled={saving}
            className="btn-secondary text-xs py-1.5 px-3"
            title="Reset to default DPDP recommendations"
          >
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="btn-primary text-xs py-1.5 px-3.5"
          >
            <Save className={cn("w-3.5 h-3.5", saving && "animate-spin")} />
            <span>{saving ? "Saving to Backend..." : dirty ? "Save Policies" : "Saved"}</span>
          </button>
        </div>
      </div>

      {/* Dirty Changes Banner */}
      {dirty && (
        <div className="p-3 rounded-lg bg-[#F5A524]/10 border border-[#F5A524]/30 text-[#F5A524] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>You have unsaved policy changes for department: <strong>{activeDept}</strong>.</span>
          </div>
          <span className="font-mono text-[11px] underline cursor-pointer" onClick={handleSave}>
            Save changes now
          </span>
        </div>
      )}

      {/* Department Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[#2A2A2A] pb-3">
        {DEPARTMENTS.map((dept) => {
          const isActive = activeDept === dept;
          return (
            <button
              key={dept}
              onClick={() => {
                if (dirty) {
                  if (confirm("You have unsaved changes. Switch department anyway?")) {
                    setActiveDept(dept);
                    setDirty(false);
                  }
                } else {
                  setActiveDept(dept);
                }
              }}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                isActive
                  ? "bg-[#141414] text-[#F5F5F5] border border-[#2A2A2A] shadow-sm font-semibold"
                  : "text-[#9A9A9A] hover:text-[#F5F5F5] hover:bg-[#141414]/60"
              )}
            >
              <Building2 className={cn("w-3.5 h-3.5", isActive ? "text-[#E5484D]" : "text-[#9A9A9A]")} />
              <span>{dept}</span>
            </button>
          );
        })}
      </div>

      {/* Policies Data Table */}
      <div className="rounded-lg bg-[#141414] border border-[#2A2A2A] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#2A2A2A] bg-[#0F0F0F] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#E5484D]" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#F5F5F5]">
              Configured PII Action Mappings — {activeDept}
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#9A9A9A]">
            {POLICY_CATEGORIES.length} Categories
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#2A2A2A] text-[#9A9A9A] text-[11px] font-mono uppercase bg-[#141414]">
                <th className="py-3 px-4 font-medium">PII Category</th>
                <th className="py-3 px-4 font-medium hidden md:table-cell">Description</th>
                <th className="py-3 px-4 font-medium text-center">Policy Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]/60">
              {POLICY_CATEGORIES.map((cat) => {
                const currentAction = (currentDeptRules[cat.id] || "mask").toLowerCase();
                const Icon = getEntityIcon(cat.id);
                const style = getEntityStyle(cat.id);

                return (
                  <tr key={cat.id} className="table-row-hover">
                    {/* Entity Identity */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: style.bg, color: style.border }}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-mono text-xs font-semibold text-[#F5F5F5]">
                            {cat.id}
                          </div>
                          <div className="text-[11px] text-[#9A9A9A] md:hidden mt-0.5">
                            {cat.label}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 text-[#9A9A9A] hidden md:table-cell">
                      <div className="text-[#F5F5F5] font-medium">{cat.label}</div>
                      <div className="text-[11px] text-[#9A9A9A] mt-0.5">{cat.desc}</div>
                    </td>

                    {/* Action Segmented Toggle */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center bg-[#1A1A1A] p-1 rounded-md border border-[#2A2A2A] font-mono text-[11px]">
                        {/* MASK */}
                        <button
                          onClick={() => handleActionChange(cat.id, "mask")}
                          className={cn(
                            "px-3 py-1 rounded transition-colors font-medium",
                            currentAction === "mask"
                              ? "bg-[#141414] text-[#E5484D] shadow-sm font-bold border border-[#E5484D]/30"
                              : "text-[#9A9A9A] hover:text-[#F5F5F5]"
                          )}
                          title="Replace PII with typed cryptographic placeholder"
                        >
                          MASK
                        </button>

                        {/* PRESERVE */}
                        <button
                          onClick={() => handleActionChange(cat.id, "preserve")}
                          className={cn(
                            "px-3 py-1 rounded transition-colors font-medium",
                            currentAction === "preserve" || currentAction === "allow"
                              ? "bg-[#141414] text-[#F5A524] shadow-sm font-bold border border-[#F5A524]/30"
                              : "text-[#9A9A9A] hover:text-[#F5F5F5]"
                          )}
                          title="Preserve unmasked raw text for this entity"
                        >
                          PRESERVE
                        </button>

                        {/* BLOCK */}
                        <button
                          onClick={() => handleActionChange(cat.id, "block")}
                          className={cn(
                            "px-3 py-1 rounded transition-colors font-medium",
                            currentAction === "block"
                              ? "bg-[#141414] text-[#E5484D] shadow-sm font-bold border border-[#E5484D]/30"
                              : "text-[#9A9A9A] hover:text-[#F5F5F5]"
                          )}
                          title="Halt outbound dispatch if this entity is detected"
                        >
                          BLOCK
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
