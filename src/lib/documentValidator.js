/**
 * ZeroLeak AI - Enterprise Document & Input Validator
 * 
 * Implements Multi-layer Input & Relevance Validation:
 * Layer 1: Text validation (empty, whitespace, length)
 * Layer 2: Symbol spam, keyboard mash, non-printable binary detection
 * Layer 3: File format & size enforcement (.pdf, .txt, .json, .csv, .log, .md)
 * Layer 4: PC-10 Malformed JSON parser validation
 * Layer 5: Semantic Document Relevance (legitimate business/customer/financial/health/HR doc vs unrelated noise)
 * 
 * Rules:
 * - Documents WITHOUT PII must still be accepted if they are valid documents (e.g. PC-12).
 * - Code-mixed and bilingual text (Hindi-English) is explicitly supported.
 */

export const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".json", ".csv", ".log", ".md"];
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// Keywords and structural markers representing valid enterprise document categories
const BUSINESS_SEMANTIC_MARKERS = [
  // General Business & Communication
  "update", "report", "review", "summary", "project", "meeting", "tasks", "budget", 
  "schedule", "sprint", "quarterly", "memo", "regarding", "team", "dear", "please",
  "status", "notice", "feedback", "contract", "agreement", "policy", "terms", "notes",
  "agenda", "action", "completion", "deliverable", "workflow", "internal", "approved",

  // Customer & Identity Records
  "customer", "applicant", "client", "borrower", "account", "holder", "kyc", "verification",
  "application", "identity", "details", "contact", "address", "branch", "branch:",
  "name:", "phone:", "email:", "pan:", "aadhaar:", "gstin:", "dob:", "id:",

  // Financial & Banking
  "banking", "loan", "mortgage", "credit", "debit", "account", "transfer", "transaction",
  "inr", "usd", "eur", "amount", "balance", "debited", "credited", "refund", "reversal",
  "tax", "income", "invoice", "vendor", "payment", "bank", "ifsc", "gst",

  // Healthcare & Clinical
  "patient", "clinical", "intake", "diagnosis", "hospital", "clinic", "doctor", "dr.",
  "routine", "follow-up", "prescription", "medical", "discharge", "treatment", "health",

  // Human Resources & Recruitment
  "employee", "onboarding", "hr", "human resources", "candidate", "interview", "designation",
  "department", "engineering", "salary", "payroll", "resume", "performance", "appraisal",

  // Structured Log / JSON / CSV indicators
  "timestamp", "level", "message", "info", "warn", "error", "debug", "payload", "request_id"
];

// Common Indian / Code-mixed markers to avoid false rejection of Hinglish
const INDIC_LANGUAGE_MARKERS = [
  "mera", "naam", "hai", "main", "mein", "rehta", "hoon", "shri", "smt", "kripya", "namaste"
];

/**
 * Validates document content and relevance.
 * 
 * @param {string} text - Raw or extracted document text
 * @param {string} filename - Name of uploaded file (optional)
 * @returns {Object} { valid: boolean, code: string|null, error: string|null, ui_banner?: object, doc_type?: string }
 */
export function validateDocumentContent(text, filename = "") {
  // 1. Empty / Whitespace Check (PC-09)
  if (!text || !text.trim()) {
    return {
      valid: false,
      code: "EMPTY_INPUT",
      error: "Input validation error (PC-09): Content is empty or contains only whitespace. Please enter valid text or upload a document.",
      ui_banner: {
        title: "INVALID INPUT DETECTED",
        description: "The submitted input is empty or contains only whitespace.",
        action: "Please provide a relevant business document, customer record, financial document, healthcare record or HR document."
      }
    };
  }

  const trimmed = text.trim();

  // 2. Minimum Length & Incomplete Input Check
  // "hello", "hi", "123", "test" are rejected
  if (trimmed.length < 15) {
    return {
      valid: false,
      code: "TOO_SHORT",
      error: `Invalid input: Text is too short (${trimmed.length} characters). Minimum 15 characters required for enterprise document processing.`,
      ui_banner: {
        title: "INVALID INPUT DETECTED",
        description: "The submitted content is too short or incomplete to constitute a valid enterprise document.",
        action: "Please provide a relevant business document, customer record, financial document, healthcare record or HR document."
      }
    };
  }

  // 3. Maximum Size Check (200 KB for text, 10 MB for binary handled at upload stage)
  if (text.length > 300000) {
    return {
      valid: false,
      code: "TOO_LARGE",
      error: `Document too large (${(text.length / 1024).toFixed(1)} KB). Maximum allowed length is 300,000 characters.`,
      ui_banner: {
        title: "DOCUMENT OVERSIZED",
        description: "Document exceeds the maximum processing buffer of 300 KB.",
        action: "Please upload a document within the allowed size threshold."
      }
    };
  }

  // 4. File Extension Check if filename is provided (PC-11)
  if (filename) {
    const lowerName = filename.toLowerCase();
    const hasExt = ALLOWED_EXTENSIONS.some(ext => lowerName.endsWith(ext));
    if (!hasExt) {
      return {
        valid: false,
        code: "UNSUPPORTED_FORMAT",
        error: `Unsupported file format (PC-11): "${filename}". Allowed formats are: ${ALLOWED_EXTENSIONS.join(", ")}.`,
        ui_banner: {
          title: "UNSUPPORTED FILE TYPE",
          description: `The file format of "${filename}" is not supported by the ZeroLeak Privacy Gateway.`,
          action: `Please provide a supported file (${ALLOWED_EXTENSIONS.join(", ")}).`
        }
      };
    }
  }

  // 5. Binary / Corrupt / Non-Printable Character Check
  const sample = text.slice(0, 512);
  const nonPrintable = [...sample].filter(
    (ch) => ch.charCodeAt(0) < 9 || (ch.charCodeAt(0) > 13 && ch.charCodeAt(0) < 32) || ch.charCodeAt(0) === 127
  );
  if (sample.length > 0 && nonPrintable.length / sample.length > 0.12) {
    return {
      valid: false,
      code: "BINARY_CORRUPT",
      error: "Invalid file format: Detected binary stream, executable dump, or corrupted encoding. Please provide a readable text or PDF document.",
      ui_banner: {
        title: "BINARY OR CORRUPT FILE DETECTED",
        description: "The submitted file contains non-printable binary bytes rather than readable document text.",
        action: "Please upload an uncorrupted, text-based document or searchable PDF."
      }
    };
  }

  // 6. PC-10: Malformed JSON Validation
  // If the document begins with '{' or '[' or has a .json extension, it MUST be valid JSON
  const isJsonCandidate = filename.toLowerCase().endsWith(".json") || /^\s*[\{\[]/.test(trimmed);
  if (isJsonCandidate) {
    try {
      JSON.parse(trimmed);
    } catch (jsonErr) {
      return {
        valid: false,
        code: "MALFORMED_JSON",
        error: `Invalid JSON Document (PC-10): Malformed JSON syntax — ${jsonErr.message}. Outbound processing halted.`,
        ui_banner: {
          title: "MALFORMED JSON DETECTED",
          description: `JSON syntax error: ${jsonErr.message}.`,
          action: "Please correct the JSON syntax before submitting to the gateway."
        }
      };
    }
  }

  // 7. Meaningless Symbols & Repetitive Spam
  // Check for repeated single character sequences e.g. "@@@@@@@", "aaaaaaaaa", "--------"
  if (/(.)\1{7,}/.test(trimmed)) {
    return {
      valid: false,
      code: "REPETITIVE_SPAM",
      error: "Invalid content: Detected repetitive character sequences or spam pattern. Please input genuine document content.",
      ui_banner: {
        title: "INVALID INPUT DETECTED",
        description: "The submitted content contains repetitive character patterns or spam strings.",
        action: "Please provide a relevant business document, customer record, financial document, healthcare record or HR document."
      }
    };
  }

  // Check if text is predominantly symbols (e.g. "@@@@@@@#####$$$$$%%%%%")
  const alphaNumericCount = (trimmed.match(/[a-zA-Z0-9]/g) || []).length;
  if (trimmed.length >= 15 && alphaNumericCount / trimmed.length < 0.35) {
    return {
      valid: false,
      code: "SYMBOL_SPAM",
      error: "Invalid content: The input consists predominantly of symbols or punctuation without alphanumeric sentences.",
      ui_banner: {
        title: "INVALID INPUT DETECTED",
        description: "The submitted content lacks readable words and consists mostly of symbols.",
        action: "Please provide a relevant business document, customer record, financial document, healthcare record or HR document."
      }
    };
  }

  // 8. Pure Arbitrary Number Strings without Context (e.g. "123456789012345")
  const lettersOnly = trimmed.replace(/[^a-zA-Z]/g, "").toLowerCase();
  const digitsOnly = trimmed.replace(/[^0-9]/g, "");
  if (digitsOnly.length > 10 && lettersOnly.length === 0) {
    return {
      valid: false,
      code: "NUMERIC_DUMP",
      error: "Invalid input: Arbitrary numeric string without document context. Please provide a structured document or business record.",
      ui_banner: {
        title: "INVALID INPUT DETECTED",
        description: "Standalone digit sequences without contextual structure cannot be processed.",
        action: "Please provide a relevant business document, customer record, financial document, healthcare record or HR document."
      }
    };
  }

  // 9. Keyboard Mashing (e.g. "asdfghjkl", "qwrtypsdfghjkl")
  if (lettersOnly.length >= 8) {
    const vowelCount = (lettersOnly.match(/[aeiou]/g) || []).length;
    const vowelRatio = vowelCount / lettersOnly.length;

    // Standard English and Hindi have ~28%-45% vowels. Under 9% across a sequence of letters is pure mash
    if (vowelRatio < 0.09) {
      return {
        valid: false,
        code: "RANDOM_GIBBERISH",
        error: "Invalid content: The input appears to be random keyboard mashing or unreadable characters with no natural language structure.",
        ui_banner: {
          title: "INVALID INPUT DETECTED",
          description: "The submitted content does not appear to be a valid document or supported text input.",
          action: "Please provide a relevant business document, customer record, financial document, healthcare record or HR document."
        }
      };
    }
  }

  // 10. Semantic Document Relevance Validation
  // Validates that the input is a genuine document, communication, or structured record
  const lowerText = trimmed.toLowerCase();
  
  // Check for common structured formats: JSON, CSV, Log lines
  const hasStructuredFormatting = 
    /^[\[\{]/.test(trimmed) || // JSON
    trimmed.includes("\n") && trimmed.split("\n").filter(l => l.includes(",")).length >= 2 || // CSV
    /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(trimmed); // Standard log timestamp

  // Count semantic markers
  const semanticScore = BUSINESS_SEMANTIC_MARKERS.filter(m => lowerText.includes(m)).length;
  const indicScore = INDIC_LANGUAGE_MARKERS.filter(m => lowerText.includes(m)).length;

  // Check for natural sentence structure: has spaces, capitalization, punctuation
  const words = trimmed.split(/\s+/).filter(Boolean);
  const avgWordLength = lettersOnly.length / Math.max(1, words.length);
  const hasNaturalWordLength = avgWordLength >= 2.5 && avgWordLength <= 14;

  // If text is natural language with words and either:
  // - Matches semantic document vocabulary (e.g. "update", "tasks", "review", "budget", "patient", "name")
  // - Has structured formatting (CSV/JSON/Log/key-values)
  // - Is code-mixed Hindi (e.g. "Mera naam Rahul Sharma hai...")
  // - Has multiple coherent sentences with standard punctuation
  const hasKeyValues = (trimmed.match(/^[A-Za-z\s]{2,20}\s*:/m) !== null);
  const sentenceCount = (trimmed.match(/[.!?](\s|$)/g) || []).length;

  const isRelevantDocument = 
    hasStructuredFormatting ||
    semanticScore >= 1 ||
    indicScore >= 1 ||
    hasKeyValues ||
    (sentenceCount >= 2 && words.length >= 8 && hasNaturalWordLength);

  if (!isRelevantDocument && words.length < 5) {
    return {
      valid: false,
      code: "UNRELATED_CONTENT",
      error: "Invalid input: The submitted text does not resemble a supported enterprise document, business communication, or structured data record.",
      ui_banner: {
        title: "INVALID INPUT DETECTED",
        description: "The submitted content does not appear to be a valid document or supported text input.",
        action: "Please provide a relevant business document, customer record, financial document, healthcare record or HR document."
      }
    };
  }

  // Determine classified document category for UI telemetry
  let detectedCategory = "General Business Document";
  if (/patient|clinical|hospital|clinic|doctor|prescription/i.test(trimmed)) detectedCategory = "Healthcare Record";
  else if (/banking|loan|mortgage|kyc|ifsc|pan|aadhaar|debit|credit/i.test(trimmed)) detectedCategory = "Banking & KYC Record";
  else if (/employee|hr|onboarding|candidate|payroll|salary/i.test(trimmed)) detectedCategory = "Human Resources Record";
  else if (/quarterly|update|sprint|tasks|budget|schedule/i.test(trimmed)) detectedCategory = "Corporate Communication";
  else if (/timestamp|error|warn|info|debug/i.test(trimmed)) detectedCategory = "System Log Document";
  else if (/^[\[\{]/.test(trimmed)) detectedCategory = "Structured JSON Record";

  return {
    valid: true,
    code: null,
    error: null,
    doc_type: detectedCategory,
    stats: {
      char_count: trimmed.length,
      word_count: words.length,
      category: detectedCategory
    }
  };
}
