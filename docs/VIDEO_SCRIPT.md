# MediAssist AI — 2–3 minute English video script

**0:00–0:20 | Introduction**  
“Hi, I’m presenting MediAssist AI, a healthcare information assistant I built for this assessment. It helps people understand general health questions, symptom descriptions, and medical report terminology. It is educational and does not replace a clinician.” Show the overview dashboard.

**0:20–0:55 | Chatbot**  
“The frontend uses React, TypeScript, and Tailwind CSS. FastAPI connects it to Google Gemini through the supported Python SDK.” Open AI Health Chat and select “What does blood pressure mean?” Show the real answer. “The chat keeps context in this browser session. New Chat starts over without saving conversations to a database.” Click New Chat.

**0:55–1:25 | Symptom assistant**  
Open Symptom Assistant and enter a fictional mild headache and tiredness description. “This prompt asks for broad educational context, warning signs, and questions for a clinician. It must not diagnose or prescribe.” Show the live answer. “For clear emergency phrases, the app immediately advises emergency care.” If time allows, show the fictional “severe chest pain” case.

**1:25–2:05 | Report explainer**  
Upload a fictional or de-identified text-based PDF. “PyMuPDF extracts the text in memory. Gemini explains only findings supported by the report and generates three specific follow-up questions in the same call.” Show the explanation, click a suggested question, and show the grounded answer. Click Download Summary and show the downloaded PDF. “The PDF is created in the browser; the uploaded file is not saved on the server. Extracted text is sent to Gemini to produce the explanation.”

**2:05–2:35 | Prompt engineering and challenge**  
“I used separate system prompts for chat, symptom education, and report explanation. They require plain language, uncertainty when information is missing, and no invented values or diagnoses. A practical challenge was model availability: an older Gemini model returned an availability error for this key, so I switched to an available Flash Lite model and verified live responses. I also added report follow-ups while keeping their context only in memory.”

**2:35–2:50 | Results and close**  
“All three AI features returned live responses with the configured key. I verified report follow-ups with fictional data, and checked New Chat and the summary download in the browser. MediAssist AI is a tool for understanding information—not for personal medical decisions. Thank you.”

Record the actual screen while speaking. If a live request fails during recording, describe only what the screen shows; do not present a failed call as successful.
