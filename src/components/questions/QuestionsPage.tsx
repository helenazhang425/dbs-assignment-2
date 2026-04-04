"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { QuestionCategory, Confidence } from "@/types";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

const categoryLabels: Record<QuestionCategory, string> = {
  behavioral: "Behavioral",
  "product-case": "Product / Case",
  "role-specific": "Role-Specific",
};

const confidenceConfig: Record<string, { label: string; cls: string }> = {
  low: { label: "Low", cls: "bg-red-100 text-red-700" },
  medium: { label: "Med", cls: "bg-amber-100 text-amber-700" },
  high: { label: "High", cls: "bg-green-100 text-green-700" },
};

export default function QuestionsPage() {
  const { state, dispatch } = useApp();
  const [filter, setFilter] = useState<QuestionCategory | "all">("all");
  const [confidenceFilter, setConfidenceFilter] = useState<Confidence | "all">("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "practice" | "select">("view");
  const [selectedForPractice, setSelectedForPractice] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState(false);

  // Form state
  const [formText, setFormText] = useState("");
  const [formCategory, setFormCategory] = useState<QuestionCategory>("behavioral");
  const [formNotes, setFormNotes] = useState("");
  const [formStoryIds, setFormStoryIds] = useState<string[]>([]);
  const [formConfidence, setFormConfidence] = useState<Confidence>(null);

  // Practice mode state
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [swipeDir, setSwipeDir] = useState<"left" | "right" | null>(null);
  const [cardKey, setCardKey] = useState(0);
  const [history, setHistory] = useState<{ index: number; action: "learning" | "know" }[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const filtered = useMemo(() => {
    let result = state.questions;
    if (filter !== "all") result = result.filter((q) => q.category === filter);
    if (confidenceFilter !== "all") {
      if (confidenceFilter === null) result = result.filter((q) => q.confidence === null);
      else result = result.filter((q) => q.confidence === confidenceFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((qu) =>
        qu.text.toLowerCase().includes(q) || qu.notes.toLowerCase().includes(q)
      );
    }
    return result;
  }, [state.questions, filter, confidenceFilter, search]);

  // Shuffled questions for practice — use selected if any, otherwise filtered
  const practicePool = useMemo(() => {
    const pool = selectedForPractice.size > 0
      ? filtered.filter((q) => selectedForPractice.has(q.id))
      : [...filtered];
    // Fisher-Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
  }, [filtered, mode, selectedForPractice]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentPracticeQ = practicePool[practiceIndex % practicePool.length];

  const totalPracticed = state.questions.filter((q) => q.practiceCount > 0).length;

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!formText.trim()) return;
    dispatch({
      type: "ADD_QUESTION",
      payload: { text: formText.trim(), category: formCategory, storyIds: formStoryIds, notes: formNotes.trim(), confidence: formConfidence },
    });
    setFormText(""); setFormNotes(""); setFormCategory("behavioral"); setFormStoryIds([]); setFormConfidence(null); setShowAdd(false);
  }

  // Stopwatch
  useEffect(() => {
    if (stopwatchRunning) {
      timerRef.current = setInterval(() => setStopwatchTime((t) => t + 100), 100);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [stopwatchRunning]);

  function formatTime(ms: number) {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const tenths = Math.floor((ms % 1000) / 100);
    return `${mins}:${secs.toString().padStart(2, "0")}.${tenths}`;
  }

  // Recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch { /* mic permission denied */ }
  }, []);

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  function startPractice() {
    setMode("practice");
    setPracticeIndex(0);
    setShowHint(false);
    setStopwatchRunning(false);
    setStopwatchTime(0);
    setAudioUrl(null);
  }

  function getLinkedStoryTitles(storyIds: string[]) {
    return storyIds.map((id) => state.stories.find((s) => s.id === id)?.title).filter(Boolean) as string[];
  }

  // Track "still learning" vs "know" counts
  const [stillLearning, setStillLearning] = useState(0);
  const [know, setKnow] = useState(0);

  function markStillLearning() {
    if (currentPracticeQ) {
      dispatch({ type: "INCREMENT_PRACTICE", payload: { id: currentPracticeQ.id } });
      dispatch({ type: "UPDATE_QUESTION", payload: { id: currentPracticeQ.id, updates: { confidence: "low" } } });
      setStillLearning((c) => c + 1);
      setHistory((h) => [...h, { index: practiceIndex, action: "learning" as const }]);
    }
    setSwipeDir("left");
    setTimeout(() => advanceCard(), 400);
  }

  function markKnow() {
    if (currentPracticeQ) {
      dispatch({ type: "INCREMENT_PRACTICE", payload: { id: currentPracticeQ.id } });
      dispatch({ type: "UPDATE_QUESTION", payload: { id: currentPracticeQ.id, updates: { confidence: "high" } } });
      setKnow((c) => c + 1);
      setHistory((h) => [...h, { index: practiceIndex, action: "know" as const }]);
    }
    setSwipeDir("right");
    setTimeout(() => advanceCard(), 400);
  }

  function goBack() {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    if (last.action === "learning") setStillLearning((c) => Math.max(0, c - 1));
    else setKnow((c) => Math.max(0, c - 1));
    setPracticeIndex(last.index);
    setCardKey((k) => k + 1);
    setSwipeDir(null);
  }

  // Arrow key shortcuts for practice mode
  useEffect(() => {
    if (mode !== "practice") return;
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (practiceIndex >= practicePool.length) return;
      if (swipeDir) return;
      if (e.key === "ArrowRight") markKnow();
      else if (e.key === "ArrowLeft") markStillLearning();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  function advanceCard() {
    setPracticeIndex((i) => i + 1);
    setSwipeDir(null);
    setCardKey((k) => k + 1);
    setShowHint(false);
    setStopwatchRunning(false);
    setStopwatchTime(0);
    setAudioUrl(null);
    if (recording) stopRecording();
  }

  // Practice Mode UI
  if (mode === "practice" && practicePool.length > 0) {
    const q = currentPracticeQ;
    const linkedStories = q ? getLinkedStoryTitles(q.storyIds) : [];
    const isDone = practiceIndex >= practicePool.length;
    return (
      <div>
        {/* Top bar: Still practicing / Know counters */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-amber-400 text-sm font-bold text-amber-500">{stillLearning}</span>
            <span className="text-sm font-medium text-amber-500">Still practicing</span>
          </div>
          <button onClick={() => { setMode("view"); setStillLearning(0); setKnow(0); }}
            className="text-sm text-gray-400 hover:text-gray-600">Exit</button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-green-600">Know</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-green-400 text-sm font-bold text-green-600">{know}</span>
          </div>
        </div>

        {isDone ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-12 text-center" style={{ animation: "fadeIn 0.3s ease" }}>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Session complete!</h2>
            <p className="text-gray-500 mb-6">You practiced {stillLearning + know} questions</p>
            <div className="flex justify-center gap-8 mb-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-amber-500">{stillLearning}</p>
                <p className="text-sm text-gray-400">Still practicing</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{know}</p>
                <p className="text-sm text-gray-400">Know</p>
              </div>
            </div>
            <div className="flex justify-center gap-3">
              <Button variant="secondary" onClick={() => { setMode("view"); setStillLearning(0); setKnow(0); setHistory([]); }}>Back to Questions</Button>
              {stillLearning > 0 && (
                <Button variant="secondary" onClick={() => {
                  const stillPracticingIds = new Set(history.filter((h) => h.action === "learning").map((h) => practicePool[h.index]?.id).filter(Boolean));
                  setSelectedForPractice(stillPracticingIds);
                  setPracticeIndex(0);
                  setStillLearning(0);
                  setKnow(0);
                  setHistory([]);
                  setCardKey((k) => k + 1);
                }}>Practice Still Practicing ({stillLearning})</Button>
              )}
              <Button onClick={() => { startPractice(); setStillLearning(0); setKnow(0); setHistory([]); }}>Practice All Again</Button>
            </div>
          </div>
        ) : q && (
          <div key={cardKey}>
            {/* Flashcard */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50 shadow-sm overflow-hidden"
              style={{ animation: swipeDir === "left" ? "swipeLeft 0.4s ease forwards" : swipeDir === "right" ? "swipeRight 0.4s ease forwards" : "cardEnter 0.25s ease" }}>

              {/* Question centered */}
              <div className="flex items-center justify-center min-h-[300px] px-12 py-16">
                <p className="text-2xl text-gray-900 text-center leading-relaxed">{q.text}</p>
              </div>

              {/* Bottom bar: stopwatch + audio */}
              <div className="flex items-center justify-center gap-4 px-6 py-3 bg-indigo-100/50 border-t border-gray-100">
                <span className={`font-mono text-sm tabular-nums ${stopwatchRunning ? "text-gray-700" : "text-gray-400"}`}>
                  {formatTime(stopwatchTime)}
                </span>
                <button onClick={() => setStopwatchRunning(!stopwatchRunning)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    stopwatchRunning ? "bg-red-100 text-red-700" : "bg-white text-gray-600 border border-gray-200"
                  }`}>
                  {stopwatchRunning ? "Stop" : "Start Timer"}
                </button>
                {audioUrl && (
                  <div className="flex items-center gap-1.5">
                    <audio src={audioUrl} controls className="h-7" />
                    <button onClick={() => setAudioUrl(null)} className="text-gray-400 hover:text-red-500">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons: back / X (still practicing) / ✓ (know) */}
            <div className="mt-6 flex items-center justify-center gap-6">
              {history.length > 0 && (
                <button onClick={goBack}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </button>
              )}
              <button onClick={markStillLearning}
                className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-red-300 text-red-400 hover:bg-red-50 hover:text-red-500">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button onClick={markKnow}
                className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-green-400 text-green-500 hover:bg-green-50 hover:text-green-600">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>

            {/* Progress + keyboard hint */}
            <p className="mt-4 text-center text-xs text-gray-400">
              {practiceIndex + 1} of {practicePool.length}
              {filter !== "all" && ` · ${categoryLabels[filter]}`}
            </p>
            <p className="mt-1 text-center text-xs text-gray-300">
              Press <kbd className="rounded border border-gray-200 px-1.5 py-0.5 text-gray-400">←</kbd> still practicing · <kbd className="rounded border border-gray-200 px-1.5 py-0.5 text-gray-400">→</kbd> know
            </p>
          </div>
        )}
      </div>
    );
  }

  // View All Mode
  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Practice Questions</h1>
          <p className="mt-1 text-sm text-gray-500">
            {totalPracticed} of {state.questions.length} practiced · {filtered.length} shown
          </p>
        </div>
        <div className="flex gap-2">
          {mode === "select" ? (
            <Button variant="secondary" onClick={() => { setMode("view"); setSelectedForPractice(new Set()); }}>Cancel</Button>
          ) : (
            <Button variant="secondary" onClick={() => { setMode("select"); setSelectedForPractice(new Set()); }}>Practice</Button>
          )}
          <Button onClick={() => setShowAdd(true)}>Add Question</Button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="mb-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search questions..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-1.5">
        {(["all", "behavioral", "product-case", "role-specific"] as const).map((cat) => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filter === cat ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {cat === "all" ? "All" : categoryLabels[cat]}
          </button>
        ))}
        <span className="text-gray-200 mx-0.5">·</span>
        {(["low", "medium", "high"] as const).map((c) => (
          <button key={c} onClick={() => setConfidenceFilter(confidenceFilter === c ? "all" : c)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              confidenceFilter === c ? confidenceConfig[c].cls : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {confidenceConfig[c].label}
          </button>
        ))}
        <button onClick={() => setConfidenceFilter(confidenceFilter === null ? "all" : null)}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            confidenceFilter === null ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}>
          New
        </button>
      </div>

      {/* Question cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {filtered.map((q) => {
          const storyTitles = getLinkedStoryTitles(q.storyIds);
          const isExpanded = expandedId === q.id;
          return (
            <div key={q.id} ref={isExpanded ? (el) => { if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50); } : undefined}
              className={`group rounded-xl border overflow-hidden ${
                mode === "select" && selectedForPractice.has(q.id) ? "border-amber-300 bg-amber-50" :
                mode === "select" ? "border-gray-200 bg-white hover:bg-amber-50/50" :
                isExpanded ? "border-indigo-200 bg-white" : "border-gray-200 bg-white hover:shadow-sm"
              }`}>
              <div className="flex items-start justify-between gap-2 p-4 cursor-pointer" onClick={() => {
                if (mode === "select") {
                  setSelectedForPractice((prev) => { const next = new Set(prev); if (next.has(q.id)) next.delete(q.id); else next.add(q.id); return next; });
                } else {
                  setExpandedId(isExpanded ? null : q.id);
                }
              }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 break-words">{q.text}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      q.category === "behavioral" ? "bg-blue-50 text-blue-700" :
                      q.category === "product-case" ? "bg-purple-50 text-purple-700" : "bg-amber-50 text-amber-700"
                    }`}>{categoryLabels[q.category]}</span>
                    {q.confidence && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${confidenceConfig[q.confidence].cls}`}>
                        {confidenceConfig[q.confidence].label}
                      </span>
                    )}
                    {q.practiceCount > 0 && (
                      <span className="text-xs text-gray-400">{q.practiceCount}x practiced</span>
                    )}
                  </div>
                  {!isExpanded && storyTitles.length > 0 && (
                    <p className="mt-1.5 text-xs text-indigo-500 truncate">Linked: {storyTitles.join(", ")}</p>
                  )}
                </div>
                {isExpanded ? (
                  <button onClick={(e) => { e.stopPropagation(); setDeleteId(q.id); }}
                    className="text-xs text-red-500 hover:text-red-700 flex-shrink-0 mt-0.5">Delete</button>
                ) : (
                  <button onClick={(e) => { e.stopPropagation(); setDeleteId(q.id); }}
                    className="invisible group-hover:visible text-gray-300 hover:text-red-500 flex-shrink-0 mt-0.5">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-4 space-y-3" onClick={(e) => e.stopPropagation()} style={{ animation: "slideUp 0.2s ease" }}>
                  {/* Category */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Category:</span>
                    {(Object.entries(categoryLabels) as [QuestionCategory, string][]).map(([val, label]) => (
                      <button key={val} onClick={() => dispatch({ type: "UPDATE_QUESTION", payload: { id: q.id, updates: { category: val } } })}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          q.category === val
                            ? val === "behavioral" ? "bg-blue-50 text-blue-700" : val === "product-case" ? "bg-purple-50 text-purple-700" : "bg-amber-50 text-amber-700"
                            : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                        }`}>{label}</button>
                    ))}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Notes</label>
                    <textarea defaultValue={q.notes} rows={3} placeholder="Your notes on this question..."
                      onBlur={(e) => dispatch({ type: "UPDATE_QUESTION", payload: { id: q.id, updates: { notes: e.target.value } } })}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:bg-white resize-y" />
                  </div>

                  {/* Confidence */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Confidence:</span>
                    {(["low", "medium", "high"] as Confidence[]).map((level) => (
                      <button key={level!} onClick={() => dispatch({ type: "UPDATE_QUESTION", payload: { id: q.id, updates: { confidence: q.confidence === level ? null : level } } })}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          q.confidence === level ? confidenceConfig[level!].cls : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                        }`}>
                        {confidenceConfig[level!].label}
                      </button>
                    ))}
                  </div>

                  {/* Linked Stories */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Linked Stories</label>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {state.stories.filter((s) => !s.archived).map((s) => {
                        const isLinked = q.storyIds.includes(s.id);
                        return (
                          <label key={s.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50 cursor-pointer">
                            <input type="checkbox" checked={isLinked}
                              onChange={() => dispatch({
                                type: "UPDATE_QUESTION",
                                payload: {
                                  id: q.id,
                                  updates: { storyIds: isLinked ? q.storyIds.filter((sid) => sid !== s.id) : [...q.storyIds, s.id] },
                                },
                              })}
                              className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                            <span className={isLinked ? "text-indigo-600 font-medium" : "text-gray-600"}>{s.title}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-100 flex justify-end">
                    <button onClick={() => setExpandedId(null)}
                      className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">Done</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-400">No questions found.</div>
      )}

      {/* Floating start bar */}
      {mode === "select" && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-2xl bg-white border border-gray-200 shadow-xl px-6 py-3" style={{ animation: "slideUp 0.2s ease" }}>
          <span className="text-sm text-gray-600">{selectedForPractice.size} selected</span>
          <button onClick={() => setSelectedForPractice(new Set(filtered.map((q) => q.id)))}
            className="text-xs text-indigo-500 hover:text-indigo-700">All</button>
          <button onClick={() => setSelectedForPractice(new Set())}
            className="text-xs text-gray-400 hover:text-gray-600">None</button>
          <Button onClick={() => startPractice()} disabled={selectedForPractice.size === 0}>
            Start Practicing
          </Button>
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Question">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Question</label>
            <textarea value={formText} onChange={(e) => setFormText(e.target.value)} required rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Enter the interview question..." />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
            <div className="flex gap-2">
              {(Object.entries(categoryLabels) as [QuestionCategory, string][]).map(([val, label]) => (
                <button key={val} type="button" onClick={() => setFormCategory(val)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    formCategory === val ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}>{label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes (optional)</label>
            <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Any initial notes..." />
          </div>
          {state.stories.filter((s) => !s.archived).length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Link to Stories</label>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {state.stories.filter((s) => !s.archived).map((s) => (
                  <label key={s.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={formStoryIds.includes(s.id)}
                      onChange={() => setFormStoryIds((prev) => prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id])}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className={formStoryIds.includes(s.id) ? "text-indigo-600 font-medium" : "text-gray-600"}>{s.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Confidence</label>
            <div className="flex gap-2">
              {(["low", "medium", "high"] as Confidence[]).map((level) => (
                <button key={level!} type="button" onClick={() => setFormConfidence(formConfidence === level ? null : level)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    formConfidence === level ? confidenceConfig[level!].cls : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}>{confidenceConfig[level!].label}</button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit">Add Question</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete question?">
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to delete this question?
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setDeleteId(null)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={() => { dispatch({ type: "DELETE_QUESTION", payload: { id: deleteId! } }); setDeleteId(null); if (expandedId === deleteId) setExpandedId(null); }}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">Delete</button>
        </div>
      </Modal>
    </div>
  );
}

