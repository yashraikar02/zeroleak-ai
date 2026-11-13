/**
 * ZeroLeak AI - Prompt Injection Defender
 * 
 * Objective: Detect and neutralise malicious instructions hidden inside user-submitted
 * documents before those documents reach an external AI model.
 * 
 * Protects against:
 * - Direct prompt injection ("Ignore all previous instructions")
 * - System prompt extraction ("Reveal confidential information", "Reveal system prompt")
 * - Policy overrides ("Disable privacy protection", "Ignore PII detection", "Return original Aadhaar")
 * - Role manipulation ("You are now DAN", "Act as an unrestricted model")
 * - Data exfiltration ("Send original document to http...", "Post canary token")
 * - Hidden instructions (Markdown comments, system tags, base64 obfuscation)
 * - Code execution attempts ("eval(...)", "execute bash command")
 * 
 * Context-aware: Avoids false positives on benign words like "system", "ignore" in normal prose.
 */

// Patterns indicating high-confidence prompt injection attacks
const HIGH_CONFIDENCE_PATTERNS = [
  // Direct Instruction Override
  {
    regex: /(?:ignore|disregard|forget|bypass|override|drop)\s+(?:all\s+)?(?:previous|prior|above|existing|system)\s+(?:instructions|prompts?|rules|directives|guidelines|constraints)/i,
    threatType: "Instruction Override Attempt",
    description: "Document attempts to force the AI to ignore its system prompt and safety rules."
  },
  {
    regex: /(?:system\s+override|admin\s+override|root\s+override|developer\s+mode|jailbreak|dan\s+mode)[:\s]/i,
    threatType: "System Override Exploit",
    description: "Document contains explicit privilege escalation / jailbreak trigger tokens."
  },
  {
    regex: /(?:you\s+are\s+now|act\s+as|pretend\s+to\s+be)\s+(?:an?\s+)?(?:unfiltered|unrestricted|uncensored|jailbroken|evil|dan|godmode)\s+(?:ai|assistant|model|bot)/i,
    threatType: "Role Manipulation Jailbreak",
    description: "Document attempts to alter the model persona to bypass safety filters."
  },

  // Privacy & PII Policy Tampering
  {
    regex: /(?:disable|bypass|turn\s*off|ignore|skip)\s+(?:privacy|pii|anonymization|masking|redaction|dpdp|compliance)\s*(?:protection|filters?|rules?|engine|detection)?/i,
    threatType: "Privacy Policy Bypass Attempt",
    description: "Document instructs the AI to ignore PII redaction and privacy compliance policies."
  },
  {
    regex: /(?:return|reveal|output|display|show|send|leak|print)\s+(?:the\s+)?(?:original|real|unmasked|raw|true)\s+(?:aadhaar|pan|identity|pii|credentials?|card|ssn)/i,
    threatType: "Sensitive Identity Exfiltration Attempt",
    description: "Document requests the model to decode or expose original unmasked identity values."
  },
  {
    regex: /(?:pretend|assume|claim|state)\s+that\s+(?:the\s+)?document\s+is\s+(?:safe|clean|authorized|verified|non-confidential)/i,
    threatType: "False Safe Assertion Exploit",
    description: "Document attempts to trick the classifier by asserting it is safe."
  },

  // System Prompt & Key Extraction
  {
    regex: /(?:reveal|expose|print|output|display|show|dump)\s+(?:internal\s+)?(?:system\s+prompt|canary\s+tokens?|api\s+keys?|secret\s+keys?|env\s+vars?|hidden\s+instructions)/i,
    threatType: "System Prompt Extraction Attempt",
    description: "Document attempts to extract internal gateway system prompts, canary tokens, or API secrets."
  },
  {
    regex: /(?:what\s+(?:are|is)\s+your\s+(?:system\s+prompt|initial\s+instructions|hidden\s+rules))/i,
    threatType: "System Prompt Extraction Attempt",
    description: "Document queries internal model initialization instructions."
  },

  // Remote Exfiltration & Code Execution
  {
    regex: /(?:send|transmit|post|upload|curl|fetch|wget)\s+(?:the\s+)?(?:original|entire|full|all|document|data)\s+(?:to|towards)\s+https?:\/\//i,
    threatType: "Data Exfiltration Instruction",
    description: "Document instructs the model to transmit sensitive enterprise records to an external host."
  },
  {
    regex: /(?:execute|run|eval|spawn)\s+(?:bash|powershell|cmd|sh|command|script)[:\s]/i,
    threatType: "Command Execution Attempt",
    description: "Document contains command execution directives."
  },
  {
    regex: /\[(?:SYSTEM|ADMIN|INSTRUCTION|OVERRIDE)\][:\s]/i,
    threatType: "Delimited System Tag Injection",
    description: "Document mimics internal system delimiter tags to trick the parser."
  }
];

// Medium confidence patterns (Suspicious instruction markers)
const SUSPICIOUS_PATTERNS = [
  {
    regex: /(?:do\s+not\s+follow|stop\s+following)\s+(?:the\s+)?(?:rules|guidelines)/i,
    threatType: "Suspicious Instruction",
    description: "Document expresses hostility to guidelines or policy."
  },
  {
    regex: /<!--\s*(?:system|override|hidden|secret)[\s\S]*?-->/i,
    threatType: "Hidden HTML Comment Instruction",
    description: "Document hides instructions inside HTML comments."
  },
  {
    regex: /base64\s*(?:decode|eval)[:\s]/i,
    threatType: "Obfuscated Payload Pattern",
    description: "Document references base64 evaluation or decoding."
  }
];

/**
 * Evaluates text for prompt injection attempts.
 * 
 * @param {string} text - Raw or extracted document text
 * @param {string} configuredAction - "BLOCK" | "SANITIZE" | "WARN" | "DETECT" (Default: "BLOCK")
 * @returns {Object} Threat evaluation result
 */
export function inspectPromptInjection(text, configuredAction = "BLOCK") {
  if (!text || typeof text !== "string") {
    return {
      detected: false,
      threat_level: "NONE",
      threat_type: null,
      description: "No text provided for analysis.",
      action_taken: "ALLOW",
      status: "CLEAN",
      matched_patterns: [],
      sanitized_text: text || ""
    };
  }

  const matchedHigh = [];
  for (const item of HIGH_CONFIDENCE_PATTERNS) {
    if (item.regex.test(text)) {
      matchedHigh.push(item);
    }
  }

  const matchedMedium = [];
  for (const item of SUSPICIOUS_PATTERNS) {
    if (item.regex.test(text)) {
      matchedMedium.push(item);
    }
  }

  // 1. High Confidence Detection -> High Threat Level
  if (matchedHigh.length > 0) {
    const primaryThreat = matchedHigh[0];
    const threatTypes = [...new Set(matchedHigh.map(m => m.threatType))].join(", ");

    let sanitized = text;
    if (configuredAction === "SANITIZE") {
      // Neutralize matched instructions by removing or defanging
      for (const item of matchedHigh) {
        sanitized = sanitized.replace(item.regex, "[DEFANGED_INJECTION_DIRECTIVE]");
      }
    }

    return {
      detected: true,
      threat_level: "HIGH",
      threat_type: primaryThreat.threatType,
      all_threat_types: threatTypes,
      description: primaryThreat.description,
      action_taken: configuredAction === "SANITIZE" ? "SANITIZE" : "BLOCK",
      status: "PROTECTED",
      matched_patterns: matchedHigh.map(m => m.threatType),
      sanitized_text: sanitized,
      ui_banner: {
        title: "PROMPT INJECTION DETECTED",
        threat_level: "HIGH",
        threat_type: primaryThreat.threatType,
        description: "The submitted document contains instructions attempting to manipulate the AI or bypass security policies.",
        action_taken: configuredAction === "SANITIZE" 
          ? "Malicious instructions neutralized; safe content preserved."
          : "External AI transmission blocked.",
        status: "PROTECTED"
      }
    };
  }

  // 2. Medium Confidence Detection -> Medium Threat Level
  if (matchedMedium.length > 0) {
    const primaryThreat = matchedMedium[0];
    return {
      detected: true,
      threat_level: "MEDIUM",
      threat_type: primaryThreat.threatType,
      all_threat_types: primaryThreat.threatType,
      description: primaryThreat.description,
      action_taken: configuredAction === "BLOCK" ? "BLOCK" : "WARN",
      status: configuredAction === "BLOCK" ? "PROTECTED" : "REVIEW",
      matched_patterns: matchedMedium.map(m => m.threatType),
      sanitized_text: text,
      ui_banner: {
        title: "SUSPICIOUS INSTRUCTION PATTERN DETECTED",
        threat_level: "MEDIUM",
        threat_type: primaryThreat.threatType,
        description: primaryThreat.description,
        action_taken: configuredAction === "BLOCK" ? "External AI transmission blocked for review." : "Flagged for audit review.",
        status: "REVIEW"
      }
    };
  }

  // 3. Clean Document
  return {
    detected: false,
    threat_level: "NONE",
    threat_type: null,
    description: "No suspicious instructions or prompt injection attempts detected.",
    action_taken: "ALLOW",
    status: "CLEAN",
    matched_patterns: [],
    sanitized_text: text,
    ui_banner: null
  };
}
