# MediAssist AI — Project overview

## Problem and solution

Healthcare terminology can be hard to interpret before or after a clinical visit. MediAssist AI offers a clearer educational starting point through a health chatbot, a symptom information assistant, and a medical PDF report explainer. It supports informed conversations with clinicians; it does not diagnose or treat.

## Architecture and technologies

React, TypeScript, Vite, Tailwind CSS, Lucide icons, and Markdown rendering power the responsive dashboard. FastAPI handles validation and API errors. The supported Google Gen AI Python SDK calls Gemini using a backend-only API key. PyMuPDF extracts selectable text from PDFs in memory.

`Browser → FastAPI → Gemini`  
`PDF → FastAPI validation → PyMuPDF extraction → Gemini`

No database, authentication, or uploaded-file storage is used. Chat history stays in the browser tab's `sessionStorage`. Extracted PDF text and report follow-up history stay in backend memory for up to two hours, until replacement, or until server restart. Submitted messages and extracted PDF text are transmitted to Gemini for response generation.

## Features

1. **AI Healthcare Chatbot:** General questions, browser-session history, New Chat reset, suggested questions, formatted replies, loading and error states.
2. **Symptom Information Assistant:** Broad educational context and warning signs. Clear emergency guidance for specific high-risk phrases.
3. **Medical Report Explainer:** Text-based PDFs up to 10 MB, report-grounded answers and follow-ups, three content-specific suggested questions, and a client-side Download Summary PDF. Uploaded files are not stored on disk.

## Boundaries

This is an educational assessment project, not a medical device. Model output can be wrong. Image-only PDFs need OCR before upload. Reference ranges and personal context may be missing. A live Gemini API key and network access are needed for AI responses. A public production deployment would need HTTPS, authentication, rate limiting, and a formal privacy review.
