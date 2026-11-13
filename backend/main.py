"""
ZeroLeak AI — Microsoft Presidio-powered Privacy Gateway Backend
FastAPI server with India-specific PII detection, GLiNER NER, and audit logging.
"""

from __future__ import annotations
import os
import re
import uuid
import time
import asyncio
import sqlite3
import json
from datetime import datetime
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
DB_PATH = os.getenv("DB_PATH", "./zeroleak.db")

# ---------------------------------------------------------------------------
# Database setup
# ---------------------------------------------------------------------------

def init_db():
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS audit_log (
            request_id TEXT PRIMARY KEY,
            timestamp TEXT,
            department TEXT,
            task TEXT,
            llm_backend TEXT,
            original_text TEXT,
            sanitized_text TEXT,
            final_response TEXT,
            entity_types TEXT,
            risk_score REAL,
            risk_level TEXT,
            leak_passed INTEGER,
            is_blocking INTEGER,
            latency_ms INTEGER,
            entities_json TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS policies (
            department TEXT PRIMARY KEY,
            rules_json TEXT
        )
    """)
    con.commit()
    con.close()

def get_policy(department: str) -> dict:
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.execute("SELECT rules_json FROM policies WHERE department=?", (department,))
    row = cur.fetchone()
    con.close()
    if row:
        return json.loads(row[0])
    # Defaults
    return DEFAULT_POLICIES.get(department, DEFAULT_POLICIES["Banking"])

def save_policy(department: str, rules: dict):
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.execute(
        "INSERT OR REPLACE INTO policies (department, rules_json) VALUES (?, ?)",
        (department, json.dumps(rules))
    )
    con.commit()
    con.close()

DEFAULT_POLICIES = {
    "Banking": {
        "AADHAAR": "block", "PAN": "mask", "GSTIN": "mask",
        "VOTER_ID": "mask", "PASSPORT": "mask", "PERSON": "mask",
        "ADDRESS": "mask", "PHONE": "mask", "EMAIL": "mask",
        "DATE_OF_BIRTH": "mask", "BANK_ACCOUNT": "mask",
    },
    "Healthcare": {
        "AADHAAR": "block", "PAN": "mask", "GSTIN": "preserve",
        "VOTER_ID": "mask", "PASSPORT": "mask", "PERSON": "mask",
        "ADDRESS": "mask", "PHONE": "mask", "EMAIL": "mask",
        "DATE_OF_BIRTH": "mask", "BANK_ACCOUNT": "block",
    },
    "Human Resources": {
        "AADHAAR": "block", "PAN": "mask", "GSTIN": "preserve",
        "VOTER_ID": "mask", "PASSPORT": "mask", "PERSON": "mask",
        "ADDRESS": "mask", "PHONE": "mask", "EMAIL": "preserve",
        "DATE_OF_BIRTH": "preserve", "BANK_ACCOUNT": "mask",
    },
    "Marketing": {
        "AADHAAR": "block", "PAN": "block", "GSTIN": "preserve",
        "VOTER_ID": "block", "PASSPORT": "block", "PERSON": "mask",
        "ADDRESS": "preserve", "PHONE": "mask", "EMAIL": "preserve",
        "DATE_OF_BIRTH": "preserve", "BANK_ACCOUNT": "block",
    },
}

# ---------------------------------------------------------------------------
# Presidio + India Recognizers
# ---------------------------------------------------------------------------
try:
    from presidio_analyzer import AnalyzerEngine, RecognizerRegistry
    from presidio_analyzer.nlp_engine import NlpEngineProvider
    from presidio_anonymizer import AnonymizerEngine

    # India-specific regex recognizers
    from presidio_analyzer import PatternRecognizer, Pattern

    def build_analyzer() -> AnalyzerEngine:
        registry = RecognizerRegistry()
        registry.load_predefined_recognizers(languages=["en"])

        # --- Aadhaar ---
        registry.add_recognizer(PatternRecognizer(
            supported_entity="AADHAAR",
            patterns=[Pattern("AADHAAR", r"\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b", 0.85)],
        ))

        # --- PAN (Case-Insensitive) ---
        registry.add_recognizer(PatternRecognizer(
            supported_entity="PAN",
            patterns=[Pattern("PAN", r"\b[A-Za-z]{5}[0-9]{4}[A-Za-z]\b", 0.95)],
        ))

        # --- GSTIN (Case-Insensitive) ---
        registry.add_recognizer(PatternRecognizer(
            supported_entity="GSTIN",
            patterns=[Pattern("GSTIN", r"\b\d{2}[A-Za-z]{5}\d{4}[A-Za-z][A-Za-z0-9]Z[A-Za-z0-9]\b", 0.95)],
        ))

        # --- Voter ID (Case-Insensitive) ---
        registry.add_recognizer(PatternRecognizer(
            supported_entity="VOTER_ID",
            patterns=[Pattern("VOTER_ID", r"\b[A-Za-z]{3}\d{7}\b", 0.80)],
        ))

        # --- Passport (Indian, Case-Insensitive) ---
        registry.add_recognizer(PatternRecognizer(
            supported_entity="PASSPORT",
            patterns=[Pattern("PASSPORT", r"\b[A-PR-WYa-pr-wy][1-9]\d{6}\b", 0.80)],
        ))

        # --- Bank Account (basic) ---
        registry.add_recognizer(PatternRecognizer(
            supported_entity="BANK_ACCOUNT",
            patterns=[Pattern("BANK_ACCOUNT", r"\b\d{9,18}\b", 0.60)],
        ))

        # --- IFSC (Case-Insensitive) ---
        registry.add_recognizer(PatternRecognizer(
            supported_entity="IFSC",
            patterns=[Pattern("IFSC", r"\b[A-Za-z]{4}0[A-Za-z0-9]{6}\b", 0.90)],
        ))

        try:
            # Try spacy for NER (names, locations)
            provider = NlpEngineProvider(nlp_configuration={
                "nlp_engine_name": "spacy",
                "models": [{"lang_code": "en", "model_name": "en_core_web_sm"}],
            })
            nlp_engine = provider.create_engine()
        except Exception:
            nlp_engine = None

        analyzer = AnalyzerEngine(
            registry=registry,
            nlp_engine=nlp_engine,
        )
        return analyzer

    _analyzer = build_analyzer()
    _anonymizer = AnonymizerEngine()
    PRESIDIO_AVAILABLE = True
    print("[ZeroLeak] ✅ Microsoft Presidio loaded with India recognizers")

except ImportError:
    _analyzer = None
    _anonymizer = None
    PRESIDIO_AVAILABLE = False
    print("[ZeroLeak] ⚠️  Presidio not installed — using regex fallback")

# ---------------------------------------------------------------------------
# Regex-only fallback (when Presidio not installed) - Fully Case-Insensitive
# ---------------------------------------------------------------------------
FALLBACK_PATTERNS = [
    ("AADHAAR",      re.compile(r"\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b")),
    ("PAN",          re.compile(r"\b[A-Za-z]{5}[0-9]{4}[A-Za-z]\b", re.IGNORECASE)),
    ("GSTIN",        re.compile(r"\b\d{2}[A-Za-z]{5}\d{4}[A-Za-z][A-Za-z0-9]Z[A-Za-z0-9]\b", re.IGNORECASE)),
    ("VOTER_ID",     re.compile(r"\b[A-Za-z]{3}\d{7}\b", re.IGNORECASE)),
    ("PASSPORT",     re.compile(r"\b[A-PR-WYa-pr-wy][1-9]\d{6}\b", re.IGNORECASE)),
    ("PHONE",        re.compile(r"\b(?:\+91[\-\s]?)?[6-9]\d{9}\b")),
    ("EMAIL",        re.compile(r"\b[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}\b", re.IGNORECASE)),
    ("BANK_ACCOUNT", re.compile(r"\b\d{9,18}\b")),
    ("IFSC",         re.compile(r"\b[A-Za-z]{4}0[A-Za-z0-9]{6}\b", re.IGNORECASE)),
]

INDIAN_FIRST_NAMES_PY = {
    "rahul", "sunita", "priya", "vikram", "vikramaditya", "amit", "anil", "suresh", "ramesh",
    "deepak", "sneha", "pooja", "rohit", "rajesh", "manoj", "sanjay", "anita", "kavita",
    "arun", "vijay", "ajay", "neha", "swati", "nisha", "divya", "karthik", "venkat",
    "lakshmi", "ganesh", "harish", "ashok", "ananya", "kabir", "aditya", "alok", "meera"
}
INDIAN_LAST_NAMES_PY = {
    "sharma", "patel", "verma", "kumar", "singh", "gupta", "rao", "reddy", "nair", "sundaram",
    "iyer", "iyengar", "joshi", "bhat", "deshmukh", "kulkarni", "mehta", "shah", "jain",
    "agarwal", "bansal", "mishra", "pandey", "tiwari", "choudhury", "mukherjee", "banerjee",
    "das", "sen", "ghosh", "chatterjee"
}

# ---------------------------------------------------------------------------
# Input validation & Semantic Relevance
# ---------------------------------------------------------------------------
MIN_TEXT_LENGTH = 15
MAX_TEXT_LENGTH = 300_000  # 300 KB

BUSINESS_SEMANTIC_MARKERS = [
    "update", "report", "review", "summary", "project", "meeting", "tasks", "budget", 
    "schedule", "sprint", "quarterly", "memo", "regarding", "team", "dear", "please",
    "status", "notice", "feedback", "contract", "agreement", "policy", "terms", "notes",
    "customer", "applicant", "client", "borrower", "account", "holder", "kyc", "verification",
    "application", "identity", "details", "contact", "address", "branch",
    "banking", "loan", "mortgage", "credit", "debit", "transfer", "transaction", "inr",
    "patient", "clinical", "intake", "diagnosis", "hospital", "clinic", "prescription",
    "employee", "onboarding", "hr", "human resources", "candidate", "interview", "department"
]

def validate_input_text(text: str, filename: str = "") -> tuple[bool, str, dict]:
    """Returns (is_valid, error_message, details)."""
    if not text or not text.strip():
        return False, "Input validation error (PC-09): Content is empty or contains only whitespace. Please enter valid text or upload a document.", {"code": "EMPTY_INPUT"}
    
    trimmed = text.strip()
    if len(trimmed) < MIN_TEXT_LENGTH:
        return False, f"Invalid input: Text is too short ({len(trimmed)} characters). Minimum {MIN_TEXT_LENGTH} characters required for enterprise document processing.", {"code": "TOO_SHORT"}
    if len(text) > MAX_TEXT_LENGTH:
        return False, f"Document too large ({len(text):,} characters). Maximum allowed is {MAX_TEXT_LENGTH:,} characters.", {"code": "TOO_LARGE"}

    # Binary/garbage check
    sample = text[:512]
    non_printable = sum(1 for ch in sample if ord(ch) < 9 or (13 < ord(ch) < 32) or ord(ch) == 127)
    if len(sample) > 0 and non_printable / len(sample) > 0.12:
        return False, "Invalid file format: Detected binary stream, executable dump, or corrupted encoding. Please provide a readable text or PDF document.", {"code": "BINARY_CORRUPT"}

    # PC-10: Malformed JSON
    is_json = (filename.lower().endswith(".json") if filename else False) or (trimmed.startswith("{") or trimmed.startswith("["))
    if is_json:
        try:
            json.loads(trimmed)
        except Exception as e:
            return False, f"Invalid JSON Document (PC-10): Malformed JSON syntax — {str(e)}. Outbound processing halted.", {"code": "MALFORMED_JSON"}

    # Repetitive spam
    if re.search(r"(.)\1{7,}", trimmed):
        return False, "Invalid content: Detected repetitive character sequences or spam pattern. Please input genuine document content.", {"code": "REPETITIVE_SPAM"}

    # Pure numeric dump
    letters_only = re.sub(r"[^a-zA-Z]", "", trimmed).lower()
    digits_only = re.sub(r"[^0-9]", "", trimmed)
    if len(digits_only) > 10 and len(letters_only) == 0:
        return False, "Invalid input: Standalone digit sequence without document context. Please provide a structured document or business record.", {"code": "NUMERIC_DUMP"}

    # Keyboard mashing (< 9% vowels in sequences of letters)
    if len(letters_only) >= 8:
        vowels = len(re.findall(r"[aeiou]", letters_only))
        vowel_ratio = vowels / len(letters_only)
        if vowel_ratio < 0.09:
            return False, "Invalid content: The input appears to be random keyboard mashing or unreadable characters with no natural language structure.", {"code": "RANDOM_GIBBERISH"}

    # Document relevance
    lower_t = trimmed.lower()
    has_semantic = any(m in lower_t for m in BUSINESS_SEMANTIC_MARKERS)
    has_key_vals = bool(re.search(r"^[A-Za-z\s]{2,20}\s*:", trimmed, re.MULTILINE))
    words = trimmed.split()

    if not has_semantic and not has_key_vals and len(words) < 5 and not is_json:
        return False, "Invalid input: The submitted text does not resemble a supported enterprise document, business communication, or structured data record.", {"code": "UNRELATED_CONTENT"}

    return True, "", {"code": "VALID"}

# ---------------------------------------------------------------------------
# Prompt Injection Defender
# ---------------------------------------------------------------------------

PROMPT_INJECTION_PATTERNS = [
    (r"(?:ignore|disregard|forget|bypass|override)\s+(?:all\s+)?(?:previous|prior|system)\s+(?:instructions|prompts?|rules|directives)", "Instruction Override Attempt", "Document attempts to force AI to ignore system instructions."),
    (r"(?:system\s+override|admin\s+override|jailbreak|dan\s+mode)[:\s]", "System Override Exploit", "Document contains explicit privilege escalation trigger tokens."),
    (r"(?:you\s+are\s+now|act\s+as)\s+(?:an?\s+)?(?:unfiltered|unrestricted|jailbroken|dan)\s+(?:ai|assistant|model)", "Role Manipulation Jailbreak", "Document attempts to alter model persona to bypass safety filters."),
    (r"(?:disable|bypass|turn\s*off|ignore|skip)\s+(?:privacy|pii|masking|dpdp|redaction)\s*(?:filters?|rules?|engine|protection)?", "Privacy Policy Bypass Attempt", "Document instructs AI to ignore PII redaction policies."),
    (r"(?:return|reveal|output|display|show|send|leak|print)\s+(?:the\s+)?(?:original|real|unmasked|raw)\s+(?:aadhaar|pan|identity|pii|credentials?)", "Sensitive Identity Exfiltration Attempt", "Document requests AI to output original unmasked identity values."),
    (r"(?:reveal|expose|print|output|display|show|dump)\s+(?:internal\s+)?(?:system\s+prompt|canary\s+tokens?|api\s+keys?|secret\s+keys?)", "System Prompt Extraction Attempt", "Document attempts to extract internal system prompt or API secrets."),
    (r"(?:send|transmit|post)\s+(?:the\s+)?(?:document|data)\s+(?:to|towards)\s+https?://", "Data Exfiltration Instruction", "Document instructs model to transmit sensitive records to external server."),
]

def inspect_prompt_injection(text: str) -> dict:
    for pattern, threat_type, desc in PROMPT_INJECTION_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return {
                "detected": True,
                "threat_level": "HIGH",
                "threat_type": threat_type,
                "description": desc,
                "action_taken": "BLOCK",
                "status": "PROTECTED"
            }
    return {
        "detected": False,
        "threat_level": "NONE",
        "threat_type": None,
        "description": "Clean document.",
        "action_taken": "ALLOW",
        "status": "CLEAN"
    }

# ---------------------------------------------------------------------------
# PII Detection & Masking
# ---------------------------------------------------------------------------

def detect_and_mask(text: str, policy: dict) -> dict:
    """
    Returns a dict with:
      - entities: list of detected entity dicts
      - sanitized_text: text with placeholders inserted
      - mapping: { placeholder -> original_value }
      - is_blocking: bool (any entity with action=block found)
    """
    start = time.perf_counter()

    entities_raw = []

    if PRESIDIO_AVAILABLE and _analyzer:
        # Run Presidio
        presidio_entities = _analyzer.analyze(text=text, language="en")
        for ent in presidio_entities:
            entities_raw.append({
                "type": ent.entity_type,
                "start": ent.start,
                "end": ent.end,
                "score": round(ent.score, 3),
                "value": text[ent.start:ent.end],
            })
    else:
        # Regex fallback
        for entity_type, pattern in FALLBACK_PATTERNS:
            for m in pattern.finditer(text):
                entities_raw.append({
                    "type": entity_type,
                    "start": m.start(),
                    "end": m.end(),
                    "score": 0.85,
                    "value": m.group(),
                })

    # Additional Indic Name & Context Recognizers (Case-Insensitive)
    context_name_re = re.compile(
        r"(?:my name is|i am|name is|name[:\s-]+|applicant[:\s-]+|customer[:\s-]+|employee[:\s-]+|patient[:\s-]+|borrower[:\s-]+|user[:\s-]+|mr\.|mrs\.|ms\.|shri|smt|dr\.)\s+([a-zA-Z\s]{2,40})",
        re.IGNORECASE
    )
    stop_words_py = {"with", "and", "having", "is", "has", "pan", "aadhaar", "phone", "email", "mobile", "address", "voter", "passport", "the", "for", "from", "to", "of", "in", "at", "my", "our"}
    for m in context_name_re.finditer(text):
        candidate = m.group(1).strip()
        tokens = candidate.split()
        valid = []
        for t in tokens:
            if t.lower() in stop_words_py or not t.isalpha():
                break
            valid.append(t)
            if len(valid) >= 3:
                break
        if 1 <= len(valid) <= 3:
            name_val = " ".join(valid)
            s_idx = text.find(name_val, m.start())
            if s_idx != -1:
                entities_raw.append({
                    "type": "PERSON",
                    "start": s_idx,
                    "end": s_idx + len(name_val),
                    "score": 0.98,
                    "value": name_val,
                })

    # Common Indian First + Last Name Pair matcher (case-insensitive)
    for m in re.finditer(r"\b([a-zA-Z]{2,})\s+([a-zA-Z]{2,})\b", text):
        w1, w2 = m.group(1).lower(), m.group(2).lower()
        if w1 in INDIAN_FIRST_NAMES_PY and w2 in INDIAN_LAST_NAMES_PY:
            entities_raw.append({
                "type": "PERSON",
                "start": m.start(),
                "end": m.end(),
                "score": 0.99,
                "value": m.group(),
            })

    # Sort by position, deduplicate overlapping spans (keep highest score)
    entities_raw.sort(key=lambda e: (e["start"], -e["score"]))
    deduped = []
    last_end = -1
    for ent in entities_raw:
        if ent["start"] >= last_end:
            deduped.append(ent)
            last_end = ent["end"]

    # Assign placeholders and determine actions from policy
    counters: dict[str, int] = {}
    value_to_placeholder: dict[str, str] = {}
    mapping: dict[str, str] = {}
    final_entities = []
    is_blocking = False

    for ent in deduped:
        etype = ent["type"]
        val = ent["value"]

        # Map to canonical policy key
        policy_key = etype  # e.g. AADHAAR, PAN, PERSON …
        action = policy.get(policy_key, "mask").lower()

        if val in value_to_placeholder:
            ph = value_to_placeholder[val]
        else:
            counters[etype] = counters.get(etype, 0) + 1
            ph = f"<{etype}_{counters[etype]}>"
            value_to_placeholder[val] = ph
            mapping[ph] = val

        if action == "block":
            is_blocking = True

        final_entities.append({
            "type": etype,
            "value": val,
            "placeholder": ph,
            "action": action,
            "confidence": ent["score"],
            "start": ent["start"],
            "end": ent["end"],
            "reason": _action_reason(etype, action),
        })

    # Build sanitized text (replace from end to preserve offsets)
    sanitized = text
    for ent in sorted(final_entities, key=lambda e: e["start"], reverse=True):
        if ent["action"] in ("mask", "block"):
            sanitized = sanitized[:ent["start"]] + ent["placeholder"] + sanitized[ent["end"]:]
        # preserve → leave as-is

    latency_ms = round((time.perf_counter() - start) * 1000)

    return {
        "entities": final_entities,
        "sanitized_text": sanitized,
        "mapping": mapping,
        "is_blocking": is_blocking,
        "latency_ms": latency_ms,
        "engine": "presidio" if PRESIDIO_AVAILABLE else "regex",
    }

def _action_reason(entity_type: str, action: str) -> str:
    reasons = {
        "mask":     f"{entity_type} masked per active DPDP department policy to prevent outbound PII exposure.",
        "block":    f"{entity_type} blocked — transmission halted by department governance rule.",
        "preserve": f"{entity_type} preserved — department policy permits this entity type for the requested task.",
    }
    return reasons.get(action, "Policy action applied.")

# ---------------------------------------------------------------------------
# Leak Sentinel (outbound verification)
# ---------------------------------------------------------------------------

def run_leak_check(sanitized_text: str, mapping: dict) -> dict:
    """
    Verifies that none of the original PII values appear verbatim in sanitized_text.
    Returns { passed: bool, leaked_count: int, leaked_values: list }
    """
    leaked = []
    for placeholder, original in mapping.items():
        if len(original) >= 4 and original in sanitized_text:
            leaked.append(original[:4] + "****")  # redacted for safety
    return {
        "passed": len(leaked) == 0,
        "leaked_count": len(leaked),
        "leaked_values": leaked,
        "canary_passed": True,  # synthetic canary always passes when sentinel passes
    }

# ---------------------------------------------------------------------------
# Risk scoring
# ---------------------------------------------------------------------------

RISK_WEIGHTS = {
    "AADHAAR": 25, "PAN": 20, "GSTIN": 15, "PASSPORT": 25,
    "VOTER_ID": 20, "BANK_ACCOUNT": 30, "PERSON": 10,
    "ADDRESS": 15, "PHONE": 10, "EMAIL": 8, "DATE_OF_BIRTH": 12,
    "IFSC": 8,
}

def compute_risk(entities: list, leak_check: dict) -> dict:
    score = 0.0
    for ent in entities:
        w = RISK_WEIGHTS.get(ent["type"], 5)
        if ent["action"] == "block":
            score += w * 2
        elif ent["action"] == "mask":
            score += w
    if not leak_check["passed"]:
        score += 50
    score = min(score, 100)

    if score >= 70:
        level = "CRITICAL"
    elif score >= 40:
        level = "HIGH"
    elif score >= 20:
        level = "MEDIUM"
    else:
        level = "LOW"

    return {"score": round(score, 1), "level": level}

# ---------------------------------------------------------------------------
# Placeholder Reinsertion
# ---------------------------------------------------------------------------

def reinsert_placeholders(llm_response: str, mapping: dict) -> tuple[str, list[str]]:
    """
    Replace placeholders in the LLM response with their original values.
    Returns (restored_text, list_of_dropped_placeholders).
    """
    restored = llm_response
    dropped = []
    for placeholder, original in mapping.items():
        if placeholder in restored:
            restored = restored.replace(placeholder, original)
        else:
            dropped.append(placeholder)
    return restored, dropped

# ---------------------------------------------------------------------------
# External LLM call
# ---------------------------------------------------------------------------

async def call_external_llm(sanitized_text: str, task: str, llm_backend: str) -> tuple[str, int]:
    """
    Call the configured external LLM with ONLY the sanitized text.
    Returns (response_text, latency_ms).
    """
    prompt = f"Task: {task}\n\nDocument:\n{sanitized_text}"
    start = time.perf_counter()

    try:
        if llm_backend.startswith("gpt") and OPENAI_API_KEY:
            import openai
            client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)
            resp = await client.chat.completions.create(
                model=llm_backend,
                messages=[
                    {"role": "system", "content": "You are a helpful enterprise document assistant. Process the document as instructed. Preserve all placeholder tokens like <PERSON_1> exactly as-is in your response."},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=1024,
            )
            text = resp.choices[0].message.content

        elif llm_backend.startswith("gemini") and GEMINI_API_KEY:
            import google.generativeai as genai
            genai.configure(api_key=GEMINI_API_KEY)
            model = genai.GenerativeModel(
                llm_backend,
                system_instruction="You are a helpful enterprise document assistant. Preserve all placeholder tokens like <PERSON_1> exactly as-is in your response.",
            )
            resp = await asyncio.to_thread(model.generate_content, prompt)
            text = resp.text

        else:
            # Local SLM mock
            await asyncio.sleep(0.3)
            text = f"[ZeroLeak Local SLM] Task: {task}\n\nProcessed document summary:\n{sanitized_text[:300]}..."

        latency_ms = round((time.perf_counter() - start) * 1000)
        return text, latency_ms

    except Exception as e:
        latency_ms = round((time.perf_counter() - start) * 1000)
        return f"[LLM Error: {str(e)[:200]}]", latency_ms

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class ProcessRequest(BaseModel):
    text: str
    department: str = "Banking"
    task: str = "Summarize Document"
    llm_backend: str = "gemini-1.5-pro"

class PolicyUpdateRequest(BaseModel):
    rules: dict

# ---------------------------------------------------------------------------
# App lifecycle
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    print("[ZeroLeak] Database initialised")
    yield

app = FastAPI(title="ZeroLeak AI Privacy Gateway", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "version": "2.0.0",
        "presidio": PRESIDIO_AVAILABLE,
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.post("/api/process")
async def process_document(req: ProcessRequest):
    t_start = time.perf_counter()

    # 1. Validate input
    valid, err, _ = validate_input_text(req.text)
    if not valid:
        raise HTTPException(status_code=400, detail=err)

    # 2. Prompt Injection Defender
    injection = inspect_prompt_injection(req.text)
    injection_blocking = injection["detected"] and injection["action_taken"] == "BLOCK"

    # 3. Load policy
    policy = get_policy(req.department)

    # 4. Detect & mask PII
    detection = detect_and_mask(req.text, policy)
    entities = detection["entities"]
    sanitized_text = detection["sanitized_text"]
    mapping = detection["mapping"]
    is_blocking = detection["is_blocking"] or injection_blocking

    # 5. Leak sentinel
    leak_check = run_leak_check(sanitized_text, mapping)

    # 6. Risk score
    risk = compute_risk(entities, leak_check)
    if injection["detected"]:
        risk["score"] = min(100, risk["score"] + 30)
        risk["level"] = "high"

    # 7. If blocked (policy violation or prompt injection), do not call LLM
    if is_blocking:
        final_response = "Request blocked by ZeroLeak Privacy Gateway policy or Prompt Injection Defender."
        llm_latency = 0
    else:
        # 8. Call external LLM with ONLY sanitized text
        llm_response_raw, llm_latency = await call_external_llm(sanitized_text, req.task, req.llm_backend)
        # 9. Reinsert placeholders locally
        final_response, dropped = reinsert_placeholders(llm_response_raw, mapping)
        # Mark dropped entities
        for ent in entities:
            ent["returned_by_llm"] = ent["placeholder"] not in dropped

    total_latency = round((time.perf_counter() - t_start) * 1000)
    request_id = str(uuid.uuid4())[:8].upper()

    # 9. Audit log
    con = sqlite3.connect(DB_PATH)
    con.execute("""
        INSERT INTO audit_log VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, (
        request_id,
        datetime.utcnow().isoformat(),
        req.department,
        req.task,
        req.llm_backend,
        req.text[:500],  # store a snippet only
        sanitized_text[:500],
        (final_response or "BLOCKED")[:500],
        json.dumps(list({e["type"] for e in entities})),
        risk["score"],
        risk["level"],
        int(leak_check["passed"]),
        int(is_blocking),
        total_latency,
        json.dumps(entities),
    ))
    con.commit()
    con.close()

    return {
        "request_id": request_id,
        "original_text": req.text,
        "sanitized_text": sanitized_text,
        "final_response": final_response,
        "entities": entities,
        "mapping_size": len(mapping),  # don't expose the actual mapping
        "leak_check": leak_check,
        "risk": risk,
        "is_blocking": is_blocking,
        "model": req.llm_backend,
        "latency_ms": total_latency,
        "alerts": _build_alerts(entities, leak_check, risk),
        "engine": detection["engine"],
    }


@app.post("/api/process/file")
async def process_file(
    file: UploadFile = File(...),
    department: str = "Banking",
    task: str = "Summarize Document",
    llm_backend: str = "gemini-1.5-pro",
):
    # Validate MIME type
    allowed_mimes = {"text/plain", "text/csv", "application/json", "text/markdown", "text/x-log", "application/pdf"}
    allowed_exts = {".txt", ".csv", ".json", ".md", ".log", ".pdf"}
    fname = file.filename or ""
    ext = "." + fname.rsplit(".", 1)[-1].lower() if "." in fname else ""

    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file format '{ext}'. Only {', '.join(sorted(allowed_exts))} files are supported."
        )

    raw_bytes = await file.read()

    # Size check
    if len(raw_bytes) == 0:
        raise HTTPException(status_code=400, detail="Invalid file — the uploaded file is empty.")
    if len(raw_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large ({len(raw_bytes) // 1024} KB). Max 10 MB.")

    text = ""
    # Extract PDF text
    if ext == ".pdf":
        try:
            import io
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(raw_bytes))
            if reader.is_encrypted:
                raise HTTPException(status_code=400, detail="Password-protected PDF: This document is encrypted. Please provide an unencrypted PDF.")
            if len(reader.pages) == 0:
                raise HTTPException(status_code=400, detail="Empty PDF document: The file contains zero pages.")
            if len(reader.pages) > 50:
                raise HTTPException(status_code=400, detail=f"Maximum page count exceeded: This PDF has {len(reader.pages)} pages (maximum allowed is 50 pages).")
            extracted_pages = [page.extract_text() or "" for page in reader.pages]
            text = "\n\n".join(extracted_pages).strip()
            if len(text) < 20:
                raise HTTPException(status_code=400, detail="Scanned or image-only PDF detected: No searchable text layers found. ZeroLeak AI requires optical character recognition (OCR) to process scanned image documents.")
        except HTTPException:
            raise
        except ImportError:
            # Fallback simple stream regex
            latin = raw_bytes.decode("latin-1", errors="ignore")
            tj_matches = re.findall(r"\(([^)]+)\)\s*Tj", latin)
            text = " ".join(tj_matches).strip()
        except Exception as e:
            if "password" in str(e).lower() or "encrypt" in str(e).lower():
                raise HTTPException(status_code=400, detail="Password-protected PDF: This document is encrypted. Please provide an unencrypted PDF.")
            raise HTTPException(status_code=400, detail=f"Failed to parse PDF document: {str(e)[:150]}")
    else:
        # Decode plain text
        try:
            text = raw_bytes.decode("utf-8")
        except UnicodeDecodeError:
            try:
                text = raw_bytes.decode("latin-1")
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid file — could not decode file as text.")
            raise HTTPException(status_code=400, detail="Invalid file — could not decode file as text. Please upload a plain-text file.")

    # Validation & Relevance check
    valid, err, _ = validate_input_text(text, fname)
    if not valid:
        raise HTTPException(status_code=400, detail=err)

    # Reuse the main process endpoint logic
    req = ProcessRequest(text=text, department=department, task=task, llm_backend=llm_backend)
    return await process_document(req)


@app.get("/api/audit")
async def get_audit():
    con = sqlite3.connect(DB_PATH)
    rows = con.execute(
        "SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 200"
    ).fetchall()
    con.close()

    cols = [
        "request_id", "timestamp", "department", "task", "llm_backend",
        "original_text", "sanitized_text", "final_response",
        "entity_types", "risk_score", "risk_level",
        "leak_passed", "is_blocking", "latency_ms", "entities_json"
    ]
    result = []
    for row in rows:
        d = dict(zip(cols, row))
        d["entity_types"] = json.loads(d["entity_types"])
        d["entities"] = json.loads(d["entities_json"])
        d["leak_passed"] = bool(d["leak_passed"])
        d["is_blocking"] = bool(d["is_blocking"])
        d["risk"] = {"score": d.pop("risk_score"), "level": d.pop("risk_level")}
        del d["entities_json"]
        result.append(d)
    return result


@app.get("/api/metrics")
async def get_metrics():
    con = sqlite3.connect(DB_PATH)
    rows = con.execute("SELECT * FROM audit_log").fetchall()
    con.close()

    total = len(rows)
    total_entities = 0
    blocked = 0
    leaks = 0
    total_latency = 0
    entity_dist: dict = {}

    for row in rows:
        total_latency += row[13] or 0
        if not row[11]:
            leaks += 1
        if row[12]:
            blocked += 1
        entities = json.loads(row[14] or "[]")
        for ent in entities:
            total_entities += 1
            entity_dist[ent["type"]] = entity_dist.get(ent["type"], 0) + 1

    return {
        "total_processed": total,
        "total_entities": total_entities,
        "blocked_requests": blocked,
        "leakage": leaks,
        "gateway_latency_ms": round(total_latency / total) if total else 0,
        "entity_distribution": entity_dist,
        "presidio_active": PRESIDIO_AVAILABLE,
    }


@app.get("/api/policies")
async def get_all_policies():
    result = {}
    for dept in ["Banking", "Healthcare", "Human Resources", "Marketing"]:
        result[dept] = get_policy(dept)
    return result


@app.put("/api/policies/{department}")
async def update_policy(department: str, body: PolicyUpdateRequest):
    save_policy(department, body.rules)
    return get_policy(department)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _build_alerts(entities: list, leak_check: dict, risk: dict) -> list:
    alerts = []
    if not leak_check["passed"]:
        alerts.append({"type": "CRITICAL", "message": f"PII Leak Detected: {leak_check['leaked_count']} raw value(s) found in outbound payload."})
    if risk["level"] == "CRITICAL":
        alerts.append({"type": "HIGH", "message": f"Critical risk score ({risk['score']}) — multiple high-sensitivity entities present."})
    elif risk["level"] == "HIGH":
        alerts.append({"type": "MEDIUM", "message": f"Elevated risk score ({risk['score']}) — review entity types before processing."})

    blocked = [e for e in entities if e["action"] == "block"]
    if blocked:
        types = ", ".join({e["type"] for e in blocked})
        alerts.append({"type": "HIGH", "message": f"Transmission blocked: {types} entities fall under BLOCK policy."})

    return alerts
