import React, { useEffect, useState, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Activity, ArrowRight, Bot, Check, ChevronDown, CircleHelp, Download, FileHeart, FileText, Heart, HeartPulse, LockKeyhole, Menu, MessageCircle, Moon, Plus, Send, ShieldCheck, Sparkles, Stethoscope, Sun, UploadCloud, X } from 'lucide-react'
import { downloadReportSummary } from './reportPdf'
import './styles.css'

type View = 'overview' | 'chat' | 'symptoms' | 'report'
type Message = { role: 'user' | 'assistant'; content: string }
const API = import.meta.env.VITE_API_BASE_URL || '/api'
const disclaimer = 'MediAssist AI provides educational information only. It cannot diagnose, treat, or replace a licensed clinician. If you may be experiencing a medical emergency, contact your local emergency services immediately.'

async function request(path: string, body: object | FormData): Promise<string> {
  const isForm = body instanceof FormData
  let response: Response
  try { response = await fetch(`${API}${path}`, { method: 'POST', headers: isForm ? undefined : { 'Content-Type': 'application/json' }, body: isForm ? body : JSON.stringify(body) }) }
  catch { throw new Error('Unable to connect to the server. Make sure the backend is running.') }
  let result: { answer?: string; detail?: string }
  try { result = await response.json() } catch { throw new Error('The server returned an unreadable response.') }
  if (!response.ok) throw new Error(typeof result.detail === 'string' ? result.detail : 'Something went wrong. Please try again.')
  return result.answer || 'No response was returned. Please try again.'
}

async function uploadReport(form: FormData): Promise<{ answer: string; report_id: string; suggestions: string[] }> {
  let response: Response
  try { response = await fetch(`${API}/report/explain`, { method: 'POST', body: form }) }
  catch { throw new Error('Unable to connect to the server. Make sure the backend is running.') }
  let result: { answer?: string; report_id?: string; suggestions?: string[]; detail?: string }
  try { result = await response.json() } catch { throw new Error('The server returned an unreadable response.') }
  if (!response.ok) throw new Error(typeof result.detail === 'string' ? result.detail : 'Could not explain the report. Please try again.')
  if (!result.answer || !result.report_id) throw new Error('The report explanation was incomplete. Please try again.')
  return { answer: result.answer, report_id: result.report_id, suggestions: Array.isArray(result.suggestions) ? result.suggestions : [] }
}

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    try { const saved = localStorage.getItem('mediassist-theme'); return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches }
    catch { return false }
  })
  const [view, setView] = useState<View>('overview')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('mediassist-chat') || '[]')
      return Array.isArray(saved) ? saved.filter(item => (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string') : []
    } catch { return [] }
  })
  const [chatInput, setChatInput] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [symptomAnswer, setSymptomAnswer] = useState('')
  const [reportAnswer, setReportAnswer] = useState('')
  const [reportSuggestions, setReportSuggestions] = useState<string[]>([])
  const [reportId, setReportId] = useState('')
  const [reportMessages, setReportMessages] = useState<Message[]>([])
  const [reportInput, setReportInput] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => { document.documentElement.classList.toggle('dark', darkMode); try { localStorage.setItem('mediassist-theme', darkMode ? 'dark' : 'light') } catch { /* Theme still works for this page. */ } }, [darkMode])
  useEffect(() => { try { sessionStorage.setItem('mediassist-chat', JSON.stringify(messages)) } catch { /* Browsers may disable storage. In-memory chat still works. */ } }, [messages])
  const newChat = () => { setMessages([]); setChatInput(''); setError(''); try { sessionStorage.removeItem('mediassist-chat') } catch { /* In-memory reset still works. */ } }

  const navigate = (next: View) => { setView(next); setError(''); setMobileMenu(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const chat = async (text = chatInput) => {
    const value = text.trim(); if (!value || loading) return
    const prior = messages.slice(-10); setMessages([...messages, { role: 'user', content: value }]); setChatInput(''); setError(''); setLoading(true)
    try { const answer = await request('/chat', { message: value, history: prior }); setMessages(current => [...current, { role: 'assistant', content: answer }]) }
    catch (e) { setError((e as Error).message) } finally { setLoading(false) }
  }
  const analyzeSymptoms = async () => {
    if (symptoms.trim().length < 3 || loading) return
    setLoading(true); setError(''); setSymptomAnswer('')
    try { setSymptomAnswer(await request('/symptoms', { symptoms: symptoms.trim() })) }
    catch (e) { setError((e as Error).message) } finally { setLoading(false) }
  }
  const analyzeReport = async () => {
    if (!file || loading || reportLoading) return
    setLoading(true); setError(''); setReportAnswer(''); setReportSuggestions([]); setReportMessages([])
    const form = new FormData(); form.append('file', file)
    if (reportId) form.append('previous_report_id', reportId)
    try { const result = await uploadReport(form); setReportAnswer(result.answer); setReportId(result.report_id); setReportSuggestions(result.suggestions) }
    catch (e) { setError((e as Error).message) } finally { setLoading(false) }
  }
  const askReport = async (suggested?: string) => {
    const question = (suggested ?? reportInput).trim(); if (!question || !reportId || reportLoading || loading) return
    setReportMessages(current => [...current, { role: 'user', content: question }]); setReportInput(''); setError(''); setReportLoading(true)
    try { const answer = await request('/report/ask', { report_id: reportId, question }); setReportMessages(current => [...current, { role: 'assistant', content: answer }]) }
    catch (e) { setReportMessages(current => current.slice(0, -1)); setReportInput(question); setError((e as Error).message) }
    finally { setReportLoading(false) }
  }
  const downloadSummary = async () => {
    if (!file || !reportAnswer || downloadLoading) return
    setDownloadLoading(true); setError('')
    try { await downloadReportSummary(file.name, reportAnswer) }
    catch { setError('Could not create the summary PDF. Please try again.') }
    finally { setDownloadLoading(false) }
  }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
      <div className="brand" onClick={() => navigate('overview')} role="button" tabIndex={0}><div className="brand-mark"><HeartPulse size={25} strokeWidth={2.4}/></div><div><strong>MediAssist<span> AI</span></strong><small>YOUR HEALTH COMPANION</small></div></div>
      <div className="sidebar-label">WORKSPACE</div>
      <nav aria-label="Main navigation">
        <button className={`nav-item ${view === 'overview' ? 'active' : ''}`} onClick={() => navigate('overview')}><Activity size={19}/> Overview</button>
        <button className={`nav-item ${view === 'chat' ? 'active' : ''}`} onClick={() => navigate('chat')}><MessageCircle size={19}/> AI Health Chat</button>
        <button className={`nav-item ${view === 'symptoms' ? 'active' : ''}`} onClick={() => navigate('symptoms')}><Stethoscope size={19}/> Symptom Assistant</button>
        <button className={`nav-item ${view === 'report' ? 'active' : ''}`} onClick={() => navigate('report')}><FileText size={19}/> Report Explainer</button>
      </nav>
      <div className="sidebar-bottom"><div className="privacy-card"><div className="privacy-icon"><LockKeyhole size={18}/></div><strong>Your privacy matters</strong><p>Chat history stays in this browser session. Reports stay in memory, and submitted content is sent to Gemini.</p></div><div className="sidebar-footer"><ShieldCheck size={16}/> Private by design</div></div>
    </aside>
    {mobileMenu && <div className="mobile-scrim" onClick={() => setMobileMenu(false)}/>}
    <main className="main">
      <header className="topbar"><button className="menu-button" aria-label="Open menu" onClick={() => setMobileMenu(true)}><Menu size={22}/></button><div className="breadcrumb">Workspace <span>/</span> <strong>{view === 'overview' ? 'Overview' : view === 'chat' ? 'AI Health Chat' : view === 'symptoms' ? 'Symptom Assistant' : 'Report Explainer'}</strong></div><div className="topbar-right"><button className="theme-toggle" type="button" aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} aria-pressed={darkMode} title={darkMode ? 'Light mode' : 'Dark mode'} onClick={() => setDarkMode(current => !current)}>{darkMode ? <Sun size={17}/> : <Moon size={17}/>}</button><span className="status-dot"/> AI-powered health guidance <ChevronDown size={15}/></div></header>
      <div className="content">
        {view === 'overview' && <>
          <div className="welcome-kicker"><span className="kicker-line"/> YOUR HEALTH, BETTER UNDERSTOOD</div>
          <section className="hero"><div className="hero-content"><div className="eyebrow"><Sparkles size={14}/> INTELLIGENT HEALTH SUPPORT</div><h1>Health answers,<br/><em>made clearer.</em></h1><p>Get thoughtful, easy-to-understand health information when you need it. Explore symptoms, ask questions, and make sense of medical reports—all in one place.</p><button className="primary-button hero-cta" onClick={() => navigate('chat')}>Start a conversation <ArrowRight size={18}/></button><div className="hero-note"><ShieldCheck size={15}/> Informative, private, and always here to help</div></div><div className="hero-art"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-glow"/><div className="art-heart"><Heart size={80} strokeWidth={1.45} fill="rgba(255,255,255,.18)"/></div><div className="floating-chip chip-top"><span><Activity size={16}/></span> Your health, simplified</div><div className="floating-chip chip-bottom"><span><Check size={16}/></span> Better understanding</div></div></section>
          <div className="section-head"><div><div className="section-kicker">EXPLORE YOUR TOOLS</div><h2>How can we help today?</h2><p>Choose a tool to get started with clear, supportive health information.</p></div><span className="tools-count">03 TOOLS AVAILABLE</span></div>
          <div className="tool-grid"><ToolCard icon={<MessageCircle size={25}/>} number="01" title="AI Health Chat" text="Have a health question? Get clear, conversational answers grounded in helpful context." action="Start chatting" tint="mint" onClick={() => navigate('chat')}/><ToolCard icon={<Stethoscope size={25}/>} number="02" title="Symptom Assistant" text="Describe what you're feeling and explore general information and when to seek care." action="Explore symptoms" tint="blue" onClick={() => navigate('symptoms')}/><ToolCard icon={<FileHeart size={25}/>} number="03" title="Report Explainer" text="Upload a medical PDF and get a plain-language explanation of its terminology and findings." action="Explain a report" tint="peach" onClick={() => navigate('report')}/></div>
          <div className="bottom-grid"><div className="info-panel"><div className="panel-icon"><HeartPulse size={20}/></div><div><h3>Information that empowers you</h3><p>We help you understand health topics so you can have more informed conversations with your care team.</p></div></div><div className="info-panel"><div className="panel-icon"><ShieldCheck size={20}/></div><div><h3>Built with your privacy in mind</h3><p>No accounts or report storage. Your inputs are sent to Gemini for answers; share only what you're comfortable sharing.</p></div></div></div>
        </>}
        {view === 'chat' && <><PageHeader icon={<MessageCircle size={22}/>} kicker="YOUR HEALTH QUESTIONS" title="AI Health Chat" description="Ask a question and get a clear, supportive explanation in everyday language."/><div className="workspace-card chat-card"><div className="chat-top"><div className="assistant-avatar"><Bot size={23}/></div><div><strong>MediAssist AI</strong><small><span className="online-dot"/> Here to help you understand</small></div><button className="clear-button" onClick={newChat} disabled={loading}><Plus size={14}/> New Chat</button></div><div className="chat-messages" aria-live="polite">{messages.length === 0 ? <div className="chat-empty"><div className="empty-orb"><Sparkles size={28}/></div><h3>What’s on your mind?</h3><p>Ask about general health topics, medical terms, or ways to prepare for a doctor’s visit.</p><div className="suggestions">{['What does blood pressure mean?', 'How can I prepare for a checkup?', 'Explain common lab test terms'].map(s => <button key={s} onClick={() => chat(s)}>{s}<ArrowRight size={14}/></button>)}</div></div> : messages.map((m, i) => <div className={`message ${m.role}`} key={i}><div className="message-avatar">{m.role === 'assistant' ? <Bot size={17}/> : 'You'}</div><div className="message-text markdown">{m.role === 'assistant' ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown> : m.content}</div></div>)}{loading && <div className="message assistant"><div className="message-avatar"><Bot size={17}/></div><div className="message-text typing">Thinking<span>...</span></div></div>}</div><div className="chat-compose"><form onSubmit={e => { e.preventDefault(); chat() }}><input aria-label="Your health question" placeholder="Ask a health question..." value={chatInput} onChange={e => setChatInput(e.target.value)} maxLength={4000}/><button aria-label="Send message" disabled={!chatInput.trim() || loading}><Send size={18}/></button></form><small>AI can make mistakes. Verify important information with a healthcare professional.</small></div></div></>}
        {view === 'symptoms' && <><PageHeader icon={<Stethoscope size={22}/>} kicker="UNDERSTAND WHAT YOU'RE FEELING" title="Symptom Assistant" description="Describe your symptoms to explore helpful general information and signs that may need care."/><div className="workspace-card form-card"><div className="form-heading"><div className="form-icon blue"><Stethoscope size={24}/></div><div><h3>Tell us what’s going on</h3><p>Include when it started and anything that makes it better or worse, if you know.</p></div></div><label htmlFor="symptoms">Your symptoms</label><textarea id="symptoms" placeholder="For example: I've had a mild headache since yesterday afternoon and feel a little tired..." value={symptoms} onChange={e => setSymptoms(e.target.value)} maxLength={4000}/><div className="form-actions"><span><LockKeyhole size={15}/> Please avoid names or identifying details.</span><button className="primary-button" onClick={analyzeSymptoms} disabled={symptoms.trim().length < 3 || loading}>{loading ? 'Exploring...' : 'Explore symptoms'} <ArrowRight size={17}/></button></div></div><div className="guidance-card"><CircleHelp size={20}/><p><strong>When to seek urgent help</strong><br/>For severe symptoms such as chest pain, trouble breathing, stroke signs, or severe bleeding, contact local emergency services right away.</p></div>{symptomAnswer && <Answer title="Your symptom information" text={symptomAnswer}/>}</>}
        {view === 'report' && <><PageHeader icon={<FileText size={22}/>} kicker="MAKE SENSE OF YOUR RESULTS" title="Medical Report Explainer" description="Turn complex report language into a clearer starting point for a conversation with your clinician."/><div className="workspace-card form-card"><div className="form-heading"><div className="form-icon peach"><FileHeart size={24}/></div><div><h3>Upload your medical report</h3><p>Choose a text-based PDF to receive a plain-language explanation.</p></div></div><input ref={fileInput} type="file" accept="application/pdf,.pdf" hidden onChange={e => { setFile(e.target.files?.[0] || null); setReportAnswer(''); setReportSuggestions([]); setReportMessages([]); setReportInput(''); setError('') }}/><button className={`upload-zone ${file ? 'has-file' : ''}`} disabled={loading || reportLoading} onClick={() => fileInput.current?.click()}><span className="upload-icon">{file ? <FileText size={29}/> : <UploadCloud size={29}/>}</span><strong>{file ? file.name : 'Click to choose a PDF report'}</strong><span>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · Click to change file` : 'PDF only · Maximum 10 MB · Text-based files'}</span></button><div className="form-actions"><span><LockKeyhole size={15}/> Processed in memory; extracted text is sent to Gemini. Use fictional or de-identified reports for demos.</span><button className="primary-button" onClick={analyzeReport} disabled={!file || loading || reportLoading}>{loading ? 'Explaining...' : 'Explain my report'} <ArrowRight size={17}/></button></div></div><div className="guidance-card"><CircleHelp size={20}/><p><strong>A note about reports</strong><br/>Lab ranges vary, and results need your medical history for context. Review important findings with your treating clinician.</p></div>{reportAnswer && <><Answer title="Your report, explained" text={reportAnswer}/><div className="report-download"><button className="primary-button" onClick={downloadSummary} disabled={downloadLoading}>{downloadLoading ? 'Preparing PDF...' : 'Download Summary'} <Download size={16}/></button></div><ReportFollowup messages={reportMessages} suggestions={reportSuggestions} input={reportInput} onInput={setReportInput} onSend={askReport} loading={reportLoading}/></>}</>}
        {error && <div className="error-banner" role="alert"><span>{error}</span><button aria-label="Dismiss error" onClick={() => setError('')}><X size={17}/></button></div>}
        <footer className="footer"><div><HeartPulse size={18}/> MediAssist AI</div><p>{disclaimer}</p></footer>
      </div>
    </main>
  </div>
}

function ToolCard({ icon, number, title, text, action, tint, onClick }: { icon: React.ReactNode; number: string; title: string; text: string; action: string; tint: string; onClick: () => void }) { return <button className="tool-card" onClick={onClick}><div className="tool-top"><span className={`tool-icon ${tint}`}>{icon}</span><span className="tool-number">{number}</span></div><h3>{title}</h3><p>{text}</p><span className="tool-action">{action}<ArrowRight size={17}/></span></button> }
function PageHeader({ icon, kicker, title, description }: { icon: React.ReactNode; kicker: string; title: string; description: string }) { return <div className="page-heading"><div className="page-heading-icon">{icon}</div><div><div className="section-kicker">{kicker}</div><h1>{title}</h1><p>{description}</p></div></div> }
function Answer({ title, text }: { title: string; text: string }) { return <div className="answer-card"><div className="answer-head"><Sparkles size={20}/><h3>{title}</h3></div><div className="answer-text markdown"><ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown></div><div className="answer-note"><ShieldCheck size={16}/> Educational information only. Discuss personal decisions with a healthcare professional.</div></div> }
function ReportFollowup({ messages, suggestions, input, onInput, onSend, loading }: { messages: Message[]; suggestions: string[]; input: string; onInput: (value: string) => void; onSend: (question?: string) => void; loading: boolean }) { return <section className="answer-card report-followup"><div className="answer-head"><MessageCircle size={20}/><h3>Ask about this report</h3></div><p className="report-followup-intro">Ask follow-up questions using the uploaded report. If a detail is missing, MediAssist will say so.</p>{suggestions.length > 0 && <div className="report-suggestions"><span>Suggested questions</span>{suggestions.map(question => <button type="button" key={question} onClick={() => onSend(question)} disabled={loading}>{question}<ArrowRight size={14}/></button>)}</div>}<div className="report-conversation" aria-live="polite">{messages.map((message, index) => <div className={`message ${message.role}`} key={index}><div className="message-avatar">{message.role === 'assistant' ? <Bot size={17}/> : 'You'}</div><div className="message-text markdown">{message.role === 'assistant' ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown> : message.content}</div></div>)}{loading && <div className="message assistant"><div className="message-avatar"><Bot size={17}/></div><div className="message-text typing">Reading your report<span>...</span></div></div>}</div><form className="report-followup-form" onSubmit={event => { event.preventDefault(); onSend() }}><input aria-label="Question about your medical report" placeholder="Ask anything about your medical report..." value={input} onChange={event => onInput(event.target.value)} maxLength={2000}/><button className="primary-button" type="submit" disabled={!input.trim() || loading}>Send <Send size={16}/></button></form><small>Report text and questions stay in memory for this session and are sent to Gemini to answer.</small></section> }

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>)
