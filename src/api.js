import axios from "axios";
import { toast } from "sonner";
import {
  INITIAL_POLICIES,
  INITIAL_METRICS,
  INITIAL_AUDIT_LOGS,
  generateMockProcessResult
} from "./mockData";
import { validateDocumentContent } from "./lib/documentValidator";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Check localStorage for runtime override, fallback to env variable
function getInitialMockMode() {
  const override = localStorage.getItem("zeroleak_use_mock") ?? localStorage.getItem("privaguard_use_mock");
  if (override !== null) {
    return override === "true";
  }
  return import.meta.env.VITE_USE_MOCK !== "false"; // default: true
}

export let USE_MOCK = getInitialMockMode();

export function setMockMode(enabled) {
  USE_MOCK = enabled;
  localStorage.setItem("zeroleak_use_mock", enabled ? "true" : "false");
  localStorage.setItem("privaguard_use_mock", enabled ? "true" : "false");
}

export function getApiBaseUrl() {
  return localStorage.getItem("zeroleak_api_url") || localStorage.getItem("privaguard_api_url") || API_BASE_URL;
}

export function setApiBaseUrl(url) {
  localStorage.setItem("zeroleak_api_url", url);
  localStorage.setItem("privaguard_api_url", url);
}

// Axios instance
const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Update baseURL dynamically when needed
apiClient.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  return config;
});

// Centralized error handler
function handleAxiosError(error, retryCallback) {
  let message = "Network error: Unable to reach ZeroLeak backend.";
  let status = null;

  if (error.response) {
    status = error.response.status;
    const detail = error.response.data?.detail || error.response.data?.message;
    if (status === 400) {
      message = `Invalid Request (400): ${detail || "Malformed payload or unparseable document."}`;
    } else if (status === 401 || status === 403) {
      message = `Authorization / Policy Error (${status}): ${detail || "Access restricted by DPDP security policy."}`;
    } else if (status === 500) {
      message = `Backend Server Error (500): ${detail || "Internal gateway processing fault."}`;
    } else {
      message = `HTTP ${status}: ${detail || error.response.statusText}`;
    }
  } else if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
    message = "Gateway request timed out after 15 seconds.";
  } else if (error.request) {
    message = `Backend Disconnected: No response from ${getApiBaseUrl()}. Please verify your server is running.`;
  }

  toast.error(message, {
    duration: 7000,
    action: retryCallback
      ? {
          label: "Retry",
          onClick: () => retryCallback(),
        }
      : undefined,
  });

  return { error, message, status };
}

// ----------------------------------------------------
// Local state helpers for Mock mode persistence
// ----------------------------------------------------
export function getStoredPolicies() {
  const version = localStorage.getItem("zeroleak_policy_version");
  const CURRENT_POLICY_VERSION = "2.1";
  if (version !== CURRENT_POLICY_VERSION) {
    localStorage.setItem("zeroleak_policy_version", CURRENT_POLICY_VERSION);
    saveStoredPolicies(INITIAL_POLICIES);
    return INITIAL_POLICIES;
  }
  const stored = localStorage.getItem("zeroleak_policies") || localStorage.getItem("privaguard_policies");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      // ignore
    }
  }
  return INITIAL_POLICIES;
}

export function saveStoredPolicies(policies) {
  localStorage.setItem("zeroleak_policies", JSON.stringify(policies));
  localStorage.setItem("privaguard_policies", JSON.stringify(policies));
}

export function getStoredAudit() {
  const stored = localStorage.getItem("zeroleak_audit") || localStorage.getItem("privaguard_audit");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      // ignore
    }
  }
  return INITIAL_AUDIT_LOGS;
}

export function appendStoredAudit(entry) {
  const list = getStoredAudit();
  const updated = [entry, ...list];
  localStorage.setItem("zeroleak_audit", JSON.stringify(updated));
  localStorage.setItem("privaguard_audit", JSON.stringify(updated));
  return updated;
}

export function clearStoredAudit() {
  localStorage.setItem("zeroleak_audit", JSON.stringify([]));
  localStorage.setItem("privaguard_audit", JSON.stringify([]));
  return [];
}

// ----------------------------------------------------
// Public API Methods
// ----------------------------------------------------

/**
 * Check backend connection health
 */
export async function checkBackendHealth() {
  if (USE_MOCK) {
    return {
      connected: true,
      mode: "mock",
      latency_ms: 12,
      version: "2.4.0-mock",
      url: getApiBaseUrl(),
    };
  }

  const start = performance.now();
  try {
    const res = await apiClient.get("/api/health", { timeout: 4000 });
    const latency_ms = Math.round(performance.now() - start);
    return {
      connected: true,
      mode: "live",
      latency_ms,
      data: res.data,
      url: getApiBaseUrl(),
    };
  } catch (err) {
    // If /api/health returned 404, try /api/policies as a fallback health ping
    if (err.response && err.response.status === 404) {
      try {
        await apiClient.get("/api/policies", { timeout: 4000 });
        const latency_ms = Math.round(performance.now() - start);
        return {
          connected: true,
          mode: "live",
          latency_ms,
          url: getApiBaseUrl(),
        };
      } catch (innerErr) {
        // fail below
      }
    }

    const latency_ms = Math.round(performance.now() - start);
    return {
      connected: false,
      mode: "live",
      latency_ms,
      error: err.message || "Failed to reach backend",
      url: getApiBaseUrl(),
    };
  }
}

/**
 * POST /api/process
 * in: { text, department, task, llm_backend, filename }
 */
export async function processText(payload, retryCallback) {
  // Layer 1 Validation: Validate content before processing
  const validation = validateDocumentContent(payload.text, payload.filename || "");
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 150));
    const result = generateMockProcessResult(payload);

    // Redacted entities for zero-leak audit logging
    const safeAuditEntities = (result.entities || []).map((e) => ({
      type: e.type,
      placeholder: e.placeholder,
      action: e.action,
      score: e.score,
      reason: e.reason,
    }));

    // Save to audit history (Strict Privacy: No raw sensitive identifiers in audit)
    const auditEntry = {
      request_id: result.request_id,
      timestamp: new Date().toISOString(),
      department: payload.department,
      task: payload.task || "Process Document",
      file_type: payload.filename ? payload.filename.split(".").pop().toUpperCase() : "TEXT",
      input_validation: "PASSED",
      document_category: validation.doc_type || "General Business Document",
      prompt_injection: result.prompt_injection || { detected: false, threat_level: "NONE" },
      entity_types: Array.from(new Set(result.entities.map((e) => e.type))),
      risk_level: result.risk.level,
      risk_score: result.risk.score,
      model: result.model,
      leak_passed: result.leak_check.passed,
      is_blocking: result.is_blocking,
      sanitized_text: result.sanitized_text,
      final_response: result.final_response,
      entities: safeAuditEntities,
      alerts: result.alerts,
      latency_ms: result.latency_ms,
    };
    appendStoredAudit(auditEntry);

    return result;
  }

  try {
    const response = await apiClient.post("/api/process", payload);
    return response.data;
  } catch (error) {
    handleAxiosError(error, retryCallback);
    throw error;
  }
}

/**
 * GET /api/audit
 */
export async function getAuditHistory(retryCallback) {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return getStoredAudit();
  }

  try {
    const response = await apiClient.get("/api/audit");
    return response.data;
  } catch (error) {
    handleAxiosError(error, retryCallback);
    throw error;
  }
}

/**
 * GET /api/policies
 */
export async function getPolicies(retryCallback) {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 120));
    return getStoredPolicies();
  }

  try {
    const response = await apiClient.get("/api/policies");
    return response.data;
  } catch (error) {
    handleAxiosError(error, retryCallback);
    throw error;
  }
}

/**
 * PUT /api/policies/{dept}
 */
export async function updateDepartmentPolicy(dept, policyMap, retryCallback) {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const all = getStoredPolicies();
    all[dept] = { ...(all[dept] || {}), ...policyMap };
    saveStoredPolicies(all);
    return all[dept];
  }

  try {
    const response = await apiClient.put(`/api/policies/${encodeURIComponent(dept)}`, policyMap);
    return response.data;
  } catch (error) {
    handleAxiosError(error, retryCallback);
    throw error;
  }
}

/**
 * GET /api/metrics
 */
export async function getMetrics(retryCallback) {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    // Calculate live aggregates from stored audit logs to keep mock metrics honest and reactive!
    const logs = getStoredAudit();
    const totalDocs = logs.length;
    let totalEntities = 0;
    let totalLatency = 0;
    let leaks = 0;
    let blockedCount = 0;

    const entityTypeCounts = {};

    logs.forEach((log) => {
      if (log.latency_ms) totalLatency += log.latency_ms;
      if (log.leak_passed === false) leaks += 1;
      if (log.is_blocking) blockedCount += 1;
      if (Array.isArray(log.entities)) {
        totalEntities += log.entities.length;
        log.entities.forEach((ent) => {
          entityTypeCounts[ent.type] = (entityTypeCounts[ent.type] || 0) + 1;
        });
      }
    });

    const avgLatency = totalDocs > 0 ? Math.round(totalLatency / totalDocs) : 0;

    return {
      ...INITIAL_METRICS,
      total_processed: totalDocs,
      total_entities: totalEntities,
      blocked_requests: blockedCount,
      leakage: leaks,
      gateway_latency_ms: avgLatency || INITIAL_METRICS.gateway_latency_ms,
      entity_distribution: entityTypeCounts,
    };
  }

  try {
    const response = await apiClient.get("/api/metrics");
    return response.data;
  } catch (error) {
    handleAxiosError(error, retryCallback);
    throw error;
  }
}
