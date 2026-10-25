# MediAssist AI

A responsive healthcare information dashboard built with React, TypeScript, Vite, Tailwind CSS, FastAPI, the supported Google Gen AI Python SDK, and PyMuPDF.

## Features

- **AI Health Chat:** Conversational educational health information with recent context, browser-session chat history, and a New Chat reset.
- **Symptom Assistant:** General information, warning signs, and questions to discuss with a clinician.
- **Medical Report Explainer:** Plain-language explanations of text-based PDF reports (up to 10 MB), three report-specific suggested questions, grounded follow-ups, and a client-side downloadable PDF summary.

The app does not provide diagnoses or treatment plans. Emergency guidance and educational disclaimers appear throughout. No account, database, or persistent report storage is used.

## Quick start

Requirements: Node.js 20+, Python 3.10+, and a [Google Gemini API key](https://aistudio.google.com/app/apikey). Use a fictional or de-identified text-based medical report for the assessment demo.

### Backend

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend/.env` and set `GEMINI_API_KEY`. Then:

```powershell
uvicorn main:app --reload
```

The API runs at `http://127.0.0.1:8000`; interactive documentation is at `/docs`.

### Frontend

In another terminal from the project root:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to the local backend. For a separately deployed backend, set `VITE_API_BASE_URL` to its API prefix (for example, `https://your-host.example/api`) and update `ALLOWED_ORIGINS` in the backend environment.

## API

| Route | Input | Output |
| --- | --- | --- |
| `GET /api/health` | None | Service status and key configuration state |
| `POST /api/chat` | JSON `{ "message": "...", "history": [] }` | `{ "answer": "...", "disclaimer": "..." }` |
| `POST /api/symptoms` | JSON `{ "symptoms": "..." }` | Same response |
| `POST /api/report/explain` | Multipart PDF field `file`; optional `previous_report_id` | `{ "answer": "...", "disclaimer": "...", "report_id": "...", "suggestions": ["...", "...", "..."] }` |
| `POST /api/report/ask` | JSON `{ "report_id": "...", "question": "..." }` | `{ "answer": "...", "disclaimer": "..." }` |

PDF uploads must be valid, unencrypted, text-based PDFs no larger than 10 MB. The first 20 pages and up to 30,000 extracted characters are sent to Gemini. Scanned image-only PDFs require OCR before upload.
Extracted text and report follow-up history are held in backend memory only. Report sessions expire after two hours or a server restart; uploading a replacement report clears the previous context. Chat messages use browser `sessionStorage` and are cleared by New Chat or when the tab session ends. Downloadable summaries are created in the browser.

## Privacy and safety

- The backend does not write uploaded PDF files to disk. It holds extracted report text and follow-up history in memory for up to two hours or until restart/replacement. Chat history stays in the current browser tab's `sessionStorage` and New Chat clears it.
- Submitted health text and extracted report content are sent to the configured Gemini API for generation. Do not submit information you are uncomfortable sharing with that provider.
- API keys live only in `backend/.env`, which is gitignored. Never place them in frontend environment variables.
- CORS is restricted through `ALLOWED_ORIGINS`. For a public deployment, add authentication, HTTPS, rate limiting, and a data retention policy appropriate to the deployment.
- The assistant is educational and cannot replace a qualified healthcare professional. For emergencies, contact local emergency services.

## Submission notes

See [project overview](docs/PROJECT_OVERVIEW.md), [prompt log](docs/PROMPT_LOG.md), [video script](docs/VIDEO_SCRIPT.md), [submission email](docs/SUBMISSION_EMAIL.md), and [submission checklist](docs/SUBMISSION_CHECKLIST.md). The Gemini integration requires a real key and network access; no AI answer is fabricated when the key is missing.
