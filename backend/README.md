# ZeroLeak AI — Python Backend (Microsoft Presidio)

## Quick Start

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
python -m spacy download en_core_web_sm
cp .env.example .env           # then fill in your API keys
uvicorn main:app --reload --port 8000
```

The frontend at http://localhost:5173 auto-connects to http://localhost:8000.

## What's inside

| Component | Technology |
|-----------|-----------|
| PII detection | **Microsoft Presidio** + India recognizers (Aadhaar, PAN, GSTIN, Voter ID, Passport, Bank Account, IFSC) |
| NER fallback | spaCy `en_core_web_sm` via Presidio NLP engine |
| Regex fallback | Built-in patterns when Presidio not installed |
| External LLM | OpenAI GPT-4o or Google Gemini (configured via .env) |
| Database | SQLite (audit log + policies) |
| Input validation | Min/max length, binary/garbage detection, encoding check |

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Server health + Presidio status |
| POST | `/api/process` | Main gateway: detect → mask → LLM → reinsert |
| POST | `/api/process/file` | Same but accepts file upload |
| GET | `/api/audit` | Full audit log |
| GET | `/api/metrics` | Aggregated metrics |
| GET | `/api/policies` | All department policies |
| PUT | `/api/policies/{dept}` | Update a department policy |
