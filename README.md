# ZeroLeak AI — Enterprise DPDP Privacy Gateway & Prompt Injection Defender

ZeroLeak AI is a production-grade, zero-trust privacy gateway designed for enterprise compliance under the **Digital Personal Data Protection (DPDP) Act 2023** and **ISO 27001**. It isolates sensitive identity tokens before they reach cloud Large Language Models (LLMs), neutralizes adversarial prompt injection attempts, and locally restores values using an air-gapped cryptographic vault.

---

## 🛡️ Core Capabilities

- **Intelligent Input & Relevance Validation**:
  - Rejects empty, whitespace-only, and extremely short inputs.
  - Detects and rejects random keyboard mashing, repeated symbol spam, and non-printable binary streams.
  - PC-10 malformed JSON detection and syntax validation.
  - Validates business document relevance without rejecting genuine documents that contain no PII (PC-12).
- **Multi-Format & PDF Ingestion**:
  - Native support for `.pdf`, `.txt`, `.json`, `.csv`, `.log`, and `.md`.
  - Client-side and backend multi-page PDF text extraction.
  - Scanned PDF detection with explicit OCR notification.
  - Encrypted / password-protected PDF rejection and corrupted file safeguards.
- **Prompt Injection Defender**:
  - Intercepts instruction overrides (`"Ignore all previous instructions"`, `"System override"`).
  - Neutralizes role manipulation and jailbreaks (`"DAN mode"`, `"unrestricted AI"`).
  - Blocks sensitive identity exfiltration (`"Return original Aadhaar"`, `"Reveal system prompt"`).
  - Outbound egress blocked on high-confidence attacks (`Status: PROTECTED`).
- **13-Stage Security Verification Pipeline**:
  - Ingestion → Signature → Text Extraction → Relevance Validation → Prompt Injection Defender → Presidio & Indic NER → Policy Engine → Sanitization → Outbound Wire Check → External AI Transmit → Schema Check → Local Reinsertion → Audit Sentinel.
- **Department-Based DPDP Policy Engine**:
  - Distinct compliance policies across **Banking**, **Healthcare**, **Human Resources**, and **Marketing**.
  - Configurable actions: **MASK** (typed tokens), **PRESERVE** (authorized retention), **BLOCK** (halt egress).
- **Zero-Leak Wire Assurance**:
  - Air-gapped local mapping ensures no raw blocked or masked information ever leaves the perimeter.

---

## 🚀 Quickstart

### 1. Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd privaguard-ai

# Install dependencies
npm install
```

### 2. Start the Frontend Application
```bash
npm run dev
```
Open **`http://localhost:5173/`** in your browser.

### 3. Run the 20-Scenario Verification Suite
```bash
node test_20_scenarios.mjs
```

---

## 📁 Project Architecture

```
privaguard-ai/
├── src/
│   ├── components/
│   │   ├── gateway/
│   │   │   ├── PipelineTracker.jsx       # 13-stage security validation visualizer
│   │   │   ├── PanelOriginalInput.jsx    # Panel 1: Document input & alerts
│   │   │   ├── PanelOutboundSanitized.jsx# Panel 2: Zero-leak wire payload
│   │   │   ├── PanelFinalResponse.jsx    # Panel 3: Secure local restoration
│   │   │   ├── TopBar.jsx                # Upload, department selector, controls
│   │   │   └── ExplainabilitySection.jsx # Entity explainability & confidence
│   ├── lib/
│   │   ├── documentValidator.js          # Multi-layer input & relevance validator
│   │   ├── pdfExtractor.js               # Multi-page PDF parser & validator
│   │   ├── promptInjectionDefender.js    # Zero-trust injection detector
│   │   └── highlightText.jsx             # Synchronized token highlighting
│   ├── mockData.js                       # In-browser DPDP & Presidio mock engine
│   └── api.js                            # Unified client API & persistence
├── backend/
│   ├── main.py                           # FastAPI service with Presidio & PDF support
│   └── requirements.txt                  # Python dependencies
└── test_20_scenarios.mjs                 # 20-scenario automated verification suite
```

---

## 📜 Compliance Standards

- **DPDP Act 2023 §6 & §8**: Purpose limitation, data minimization, and necessity verification.
- **Verhoeff Checksum Verification**: Validates Indian UIDAI Aadhaar 12-digit format.
- **Income Tax Department Specification**: Validates 10-character Permanent Account Numbers (PAN).
- **GSTN State Code Verification**: Validates 15-character Goods and Services Tax Identification Numbers.
