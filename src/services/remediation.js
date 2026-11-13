// src/services/remediation.js
// Simple auto‑remediation logic for ZeroLeak AI.
// Given the simulation result we suggest the minimal policy change
// that would prevent the most risky placeholders from being dropped.

/**
 * Map placeholder tags to PII categories used in the app.
 */
const placeholderToCategory = {
  PERSON: "PERSON",
  AADHAAR: "AADHAAR",
  PAN: "PAN",
  GSTIN: "GSTIN",
  PHONE: "PHONE",
  EMAIL: "EMAIL",
  ADDRESS: "ADDRESS",
  PASSPORT: "PASSPORT",
  VOTER_ID: "VOTER_ID",
  DATE_OF_BIRTH: "DATE_OF_BIRTH",
  BANK_ACCOUNT: "BANK_ACCOUNT",
};

/**
 * Generate a policy suggestion based on dropped placeholders.
 * The suggestion is an object like { CATEGORY: "MASK" } for each.
 * @param {string[]} droppedPlaceholders – e.g. ["<PERSON_1>", "<PAN_1>"]
 * @returns {{[category:string]:string}} mapping of category → "MASK"
 */
export function suggestPolicyFromDrops(droppedPlaceholders) {
  const suggestion = {};
  droppedPlaceholders.forEach((ph) => {
    // Extract the token name before the first underscore, e.g. PERSON_1 -> PERSON
    const token = ph.replace(/[<>]/g, "").split("_")[0];
    const category = placeholderToCategory[token];
    if (category) {
      // Most conservative action: MASK
      suggestion[category] = "MASK";
    }
  });
  return suggestion;
}

/**
 * Simple badge manager – store badge ids in localStorage.
 */
export function addBadge(badgeId) {
  const key = "zeroleak_badges";
  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  if (!existing.includes(badgeId)) {
    existing.push(badgeId);
    localStorage.setItem(key, JSON.stringify(existing));
  }
}

export function getBadges() {
  return JSON.parse(localStorage.getItem("zeroleak_badges") || "[]");
}
