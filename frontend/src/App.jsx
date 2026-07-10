import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchInteractions,
  submitInteraction,
  sendChatMessage,
  addUserMessage,
  clearSuccess,
  clearError,
} from "./store";

/* ── SVG Icons (inline for zero-dependency) ──────────────────────────────── */

const IconSend = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="M3.105 3.29a.75.75 0 0 1 .814-.12l13.5 6.75a.75.75 0 0 1 0 1.342l-13.5 6.75a.75.75 0 0 1-1.064-.814L4.58 11.25H10a.75.75 0 0 0 0-1.5H4.58L2.855 3.964a.75.75 0 0 1 .25-.674Z" />
  </svg>
);

const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
  </svg>
);

const IconSparkle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="M10 1a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 1ZM5.05 3.05a.75.75 0 0 1 1.06 0l1.062 1.06a.75.75 0 1 1-1.06 1.062L5.05 4.11a.75.75 0 0 1 0-1.06ZM14.95 3.05a.75.75 0 0 1 0 1.06l-1.06 1.062a.75.75 0 0 1-1.062-1.06l1.06-1.062a.75.75 0 0 1 1.062 0ZM3 8a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 3 8ZM14 8a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 14 8ZM7.172 13.828a.75.75 0 0 1-1.06 0l-1.062-1.06a.75.75 0 1 1 1.06-1.062l1.062 1.06a.75.75 0 0 1 0 1.062ZM12.828 13.828a.75.75 0 0 1 0-1.06l1.06-1.062a.75.75 0 0 1 1.062 1.06l-1.06 1.062a.75.75 0 0 1-1.062 0ZM10 14a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 14Z" />
  </svg>
);

const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
  </svg>
);

const IconClock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" />
  </svg>
);

const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
    <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
  </svg>
);

/* ── Interaction type options ─────────────────────────────────────────────── */

const INTERACTION_TYPES = ["Meeting", "Call", "Email", "Conference", "Lunch"];
const SENTIMENT_OPTIONS = ["Positive", "Neutral", "Negative"];

/* ── Default form state ───────────────────────────────────────────────────── */

const EMPTY_FORM = {
  hcp_name: "",
  interaction_type: "Meeting",
  date: "",
  time: "",
  topics: "",
  materials: "",
  sentiment: "Neutral",
  outcomes: "",
  attendees: "",
  samples_distributed: "",
  follow_up_actions: "",
};

/* ── Toast component ──────────────────────────────────────────────────────── */

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = type === "success"
    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
    : "bg-rose-50 border-rose-200 text-rose-700";

  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border ${styles} animate-slide-up shadow-card-lg`}>
      {type === "success" ? <IconCheck /> : <span>⚠️</span>}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

/* ── Main App ─────────────────────────────────────────────────────────────── */

export default function App() {
  const dispatch = useDispatch();
  const { interactions, chatHistory, loading, chatLoading, error, successMessage } =
    useSelector((s) => s.crm);

  const [form, setForm] = useState(EMPTY_FORM);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);

  // Fetch interactions on mount
  useEffect(() => {
    dispatch(fetchInteractions());
  }, [dispatch]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatLoading]);

  /* ── Form handlers ────────────────────────────────────────────────────── */

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.hcp_name.trim()) return;
    await dispatch(submitInteraction(form));
    setForm(EMPTY_FORM);
  };

  /* ── Chat handlers ────────────────────────────────────────────────────── */

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    const msg = chatInput.trim();
    if (!msg) return;
    dispatch(addUserMessage(msg));
    setChatInput("");
    await dispatch(sendChatMessage(msg));
    // Refresh interactions in case the agent logged something
    dispatch(fetchInteractions());
  };

  /* ── Sentiment badge color ────────────────────────────────────────────── */

  const sentimentColor = (s) => {
    switch (s?.toLowerCase()) {
      case "positive": return "bg-emerald-50 text-emerald-600 border-emerald-200";
      case "negative": return "bg-rose-50 text-rose-600 border-rose-200";
      default:         return "bg-slate-100 text-slate-500 border-slate-200";
    }
  };

  /* ── Render ────────────────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="decor-blob w-[500px] h-[500px] bg-indigo-200/50 -top-48 -right-48" />
      <div className="decor-blob w-[400px] h-[400px] bg-violet-200/40 bottom-0 -left-32" />
      <div className="decor-blob w-[300px] h-[300px] bg-sky-100/50 top-1/2 right-1/4" />

      {/* Toasts */}
      {successMessage && <Toast message={successMessage} type="success" onClose={() => dispatch(clearSuccess())} />}
      {error && <Toast message={error} type="error" onClose={() => dispatch(clearError())} />}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center shadow-brand text-white">
              <IconSparkle />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 tracking-tight">HCP Interaction Logger</h1>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">AI-Powered CRM Module</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-soft"></span>
            System Online
          </div>
        </div>
      </header>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <main className="relative z-10 max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

          {/* ═══════════════════════════════════════════════════════════════
              LEFT PANEL – Interaction Form + Recent Activity
              ═══════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-3 space-y-6">

            {/* ── Form Card ─────────────────────────────────────────────── */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center text-brand-500">
                  <IconPlus />
                </div>
                <h2 className="text-base font-semibold text-slate-700">Log HCP Interaction</h2>
              </div>

              <form onSubmit={handleFormSubmit} id="log-form" className="space-y-5">
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Interaction Details</h3>
                </div>

                {/* Row 1: HCP Name + Interaction Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="hcp_name" className="label-text">HCP Name</label>
                    <input
                      id="hcp_name"
                      name="hcp_name"
                      type="text"
                      className="input-field"
                      placeholder="e.g. Dr. Sarah Chen"
                      value={form.hcp_name}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="interaction_type" className="label-text">Interaction Type</label>
                    <select
                      id="interaction_type"
                      name="interaction_type"
                      className="input-field"
                      value={form.interaction_type}
                      onChange={handleFormChange}
                    >
                      {INTERACTION_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: Date + Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="date" className="label-text">Date</label>
                    <input
                      id="date"
                      name="date"
                      type="date"
                      className="input-field"
                      value={form.date}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="time" className="label-text">Time</label>
                    <input
                      id="time"
                      name="time"
                      type="time"
                      className="input-field"
                      value={form.time}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>

                {/* Row 3 (Full Width): Attendees */}
                <div>
                  <label htmlFor="attendees" className="label-text">Attendees</label>
                  <input
                    id="attendees"
                    name="attendees"
                    type="text"
                    className="input-field"
                    placeholder="Enter names or search..."
                    value={form.attendees}
                    onChange={handleFormChange}
                  />
                </div>

                {/* Row 4 (Full Width): Topics Discussed */}
                <div>
                  <label htmlFor="topics" className="label-text">Topics Discussed</label>
                  <textarea
                    id="topics"
                    name="topics"
                    rows={2}
                    className="input-field resize-none"
                    placeholder="e.g. Oncology, Drug Efficacy"
                    value={form.topics}
                    onChange={handleFormChange}
                  />
                </div>

                {/* Row 5: Materials Shared / Samples Distributed Heading */}
                <div className="pt-2">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Materials Shared / Samples Distributed</h3>
                </div>

                {/* Row 6: Materials Shared & Samples Distributed */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="materials" className="label-text">Materials Shared</label>
                    <input
                      id="materials"
                      name="materials"
                      type="text"
                      className="input-field"
                      placeholder="e.g. Phase III Trial PDF"
                      value={form.materials}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="samples_distributed" className="label-text">Samples Distributed</label>
                    <input
                      id="samples_distributed"
                      name="samples_distributed"
                      type="text"
                      className="input-field"
                      placeholder="e.g. 5x Dosing Packages"
                      value={form.samples_distributed}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>

                {/* Row 4: Sentiment Radios */}
                <div>
                  <label className="label-text">Sentiment</label>
                  <div className="flex items-center gap-3 mt-1">
                    {SENTIMENT_OPTIONS.map((s) => (
                      <label
                        key={s}
                        className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200 ${
                          form.sentiment === s
                            ? s === "Positive"
                              ? "bg-emerald-50 border-emerald-300 text-emerald-600 shadow-soft"
                              : s === "Negative"
                              ? "bg-rose-50 border-rose-300 text-rose-600 shadow-soft"
                              : "bg-brand-50 border-brand-300 text-brand-600 shadow-soft"
                            : "bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-500"
                        }`}
                      >
                        <input
                          type="radio"
                          name="sentiment"
                          value={s}
                          checked={form.sentiment === s}
                          onChange={handleFormChange}
                          className="sr-only"
                        />
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          form.sentiment === s
                            ? s === "Positive" ? "bg-emerald-400" : s === "Negative" ? "bg-rose-400" : "bg-brand-400"
                            : "bg-slate-300"
                        }`}></span>
                        {s}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Row 5: Outcomes */}
                <div>
                  <label htmlFor="outcomes" className="label-text">Key Outcomes</label>
                  <textarea
                    id="outcomes"
                    name="outcomes"
                    rows={3}
                    className="input-field resize-none"
                    placeholder="Summarize key outcomes, action items, or next steps…"
                    value={form.outcomes}
                    onChange={handleFormChange}
                  />
                </div>

                {/* Follow-up Actions */}
                <div>
                  <label htmlFor="follow_up_actions" className="label-text">Follow-up Actions</label>
                  <textarea
                    id="follow_up_actions"
                    name="follow_up_actions"
                    rows={3}
                    className="input-field resize-none"
                    placeholder="Enter follow-up actions or next steps…"
                    value={form.follow_up_actions}
                    onChange={handleFormChange}
                  />
                </div>

                {/* Submit */}
                <button type="submit" id="submit-btn" className="btn-primary w-full" disabled={loading || !form.hcp_name.trim()}>
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Saving…
                    </>
                  ) : (
                    <>
                      <IconPlus />
                      Log Interaction
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* ── Recent Interactions ────────────────────────────────────── */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
                  <IconClock />
                </div>
                <h2 className="text-base font-semibold text-slate-700">Recent Interactions</h2>
                <span className="ml-auto text-xs text-slate-400 font-medium bg-slate-100 px-2.5 py-1 rounded-full">{interactions.length} records</span>
              </div>

              {interactions.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <p className="text-sm">No interactions logged yet.</p>
                  <p className="text-xs mt-1 text-slate-300">Use the form above or chat with the AI assistant.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {interactions.map((item) => (
                    <div
                      key={item.id}
                      className="glass-card-alt p-4 hover:border-slate-300/70 hover:shadow-soft transition-all duration-200 animate-fade-in"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-400 flex-shrink-0">
                            <IconUser />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-700">{item.hcp_name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {item.interaction_type}{item.date ? ` · ${item.date}` : ""}{item.time ? ` · ${item.time}` : ""}
                            </p>
                          </div>
                        </div>
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${sentimentColor(item.sentiment)}`}>
                          {item.sentiment || "Neutral"}
                        </span>
                      </div>
                      {item.topics && (
                        <p className="text-xs text-slate-500 mt-2.5 pl-[42px]">
                          <span className="text-slate-400 font-medium">Topics:</span> {item.topics}
                        </p>
                      )}
                      {item.attendees && (
                        <p className="text-xs text-slate-500 mt-1 pl-[42px]">
                          <span className="text-slate-400 font-medium">Attendees:</span> {item.attendees}
                        </p>
                      )}
                      {item.samples_distributed && (
                        <p className="text-xs text-slate-500 mt-1 pl-[42px]">
                          <span className="text-slate-400 font-medium">Samples Distributed:</span> {item.samples_distributed}
                        </p>
                      )}
                      {item.outcomes && (
                        <p className="text-xs text-slate-500 mt-1 pl-[42px]">
                          <span className="text-slate-400 font-medium">Outcomes:</span> {item.outcomes}
                        </p>
                      )}
                      {item.follow_up_actions && (
                        <p className="text-xs text-slate-500 mt-1 pl-[42px]">
                          <span className="text-slate-400 font-medium">Follow-up Actions:</span> {item.follow_up_actions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              RIGHT PANEL – AI Assistant Chat
              ═══════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-2 lg:sticky lg:top-[85px]">
            <div className="glass-card flex flex-col h-[calc(100vh-130px)]">
              {/* Chat Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200/50">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-brand-500 flex items-center justify-center shadow-brand text-white">
                  <IconSparkle />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-700">AI Assistant</h2>
                  <p className="text-[11px] text-slate-400">Powered by Gemma 2 · LangGraph</p>
                </div>
                <span className="ml-auto flex items-center gap-1.5 text-[11px] text-emerald-500 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-soft"></span>
                  Active
                </span>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" id="chat-messages">
                {chatHistory.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-brand-100 border border-violet-200/50 flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-brand-400">
                        <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 0 1-3.476.383.39.39 0 0 0-.297.17l-2.755 4.133a.75.75 0 0 1-1.248 0l-2.755-4.133a.39.39 0 0 0-.297-.17 48.9 48.9 0 0 1-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97ZM6.5 8.5a.75.75 0 0 1 .75-.75h9.5a.75.75 0 0 1 0 1.5h-9.5a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5h-5.5Z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-600 mb-2">How can I help you today?</p>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-[280px]">
                      Describe an HCP interaction in plain text and I'll log it, search materials, pull history, or suggest follow-ups.
                    </p>

                    {/* Quick prompts */}
                    <div className="mt-5 space-y-2 w-full max-w-[300px]">
                      {[
                        "Log a meeting with Dr. Patel about diabetes today",
                        "Show history for Dr. Smith",
                        "Search materials on OncoBoost",
                      ].map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setChatInput(prompt);
                            chatInputRef.current?.focus();
                          }}
                          className="w-full text-left text-xs text-slate-500 hover:text-slate-700 bg-white hover:bg-brand-50/50 border border-slate-200 hover:border-brand-200 rounded-xl px-3 py-2.5 transition-all duration-200"
                        >
                          <span className="text-brand-400 mr-1.5">→</span>
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex animate-slide-up ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-brand-500 to-violet-500 text-white rounded-br-md shadow-brand"
                          : "bg-surface-100 text-slate-700 border border-slate-200/60 rounded-bl-md shadow-soft"
                      }`}
                    >
                      <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {chatLoading && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="bg-surface-100 border border-slate-200/60 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5 shadow-soft">
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <form
                onSubmit={handleChatSubmit}
                className="flex items-center gap-2 px-4 py-3 border-t border-slate-200/50 bg-white/50"
                id="chat-form"
              >
                <input
                  ref={chatInputRef}
                  type="text"
                  className="flex-1 bg-surface-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400 transition-all duration-200"
                  placeholder="Describe an interaction or ask a question…"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={chatLoading}
                  id="chat-input"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 hover:from-brand-400 hover:to-violet-400 text-white shadow-brand transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                  id="chat-send-btn"
                >
                  <IconSend />
                </button>
              </form>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
