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
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"view" | "practice">("view");
  const [showAdd, setShowAdd] = useState(false);

  // Form state
  const [formText, setFormText] = useState("");
  const [formCategory, setFormCategory] = useState<QuestionCategory>("behavioral");
  const [formNotes, setFormNotes] = useState("");

  // Practice mode state
  const [practiceIndex, setPracticeIndex] = useState(0);
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
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((qu) =>
        qu.text.toLowerCase().includes(q) || qu.notes.toLowerCase().includes(q)
      );
    }
    return result;
  }, [state.questions, filter, search]);

  // Shuffled questions for practice
  const practicePool = useMemo(() => {
    const pool = [...filtered];
    // Fisher-Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
  }, [filtered, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentPracticeQ = practicePool[practiceIndex % practicePool.length];

  const totalPracticed = state.questions.filter((q) => q.practiceCount > 0).length;

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!formText.trim()) return;
    dispatch({
      type: "ADD_QUESTION",
      payload: { text: formText.trim(), category: formCategory, storyIds: [], notes: formNotes.trim() },
    });
    setFormText(""); setFormNotes(""); setFormCategory("behavioral"); setShowAdd(false);
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

  function nextQuestion() {
    if (currentPracticeQ) {
      dispatch({ type: "INCREMENT_PRACTICE", payload: { id: currentPracticeQ.id } });
    }
    setPracticeIndex((i) => i + 1);
    setShowHint(false);
    setStopwatchRunning(false);
    setStopwatchTime(0);
    setAudioUrl(null);
    if (recording) stopRecording();
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

  // Practice Mode UI
  if (mode === "practice" && practicePool.length > 0) {
    const q = currentPracticeQ;
    const linkedStories = q ? getLinkedStoryTitles(q.storyIds) : [];
    return (
      <div>
        <button onClick={() => setMode("view")}
          className="mb-6 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Questions
        </button>

        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Practice Mode</h1>
          <span className="text-sm text-gray-400">
            {practiceIndex + 1} of {practicePool.length}
            {filter !== "all" && ` · ${categoryLabels[filter]}`}
          </span>
        </div>

        {q && (
          <div className="space-y-6">
            {/* Question card */}
            <div className="rounded-xl border border-gray-200 bg-white p-8" style={{ animation: "fadeIn 0.3s ease" }}>
              <p className="text-lg text-gray-900 leading-relaxed">{q.text}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  q.category === "behavioral" ? "bg-blue-50 text-blue-700" :
                  q.category === "product-case" ? "bg-purple-50 text-purple-700" : "bg-amber-50 text-amber-700"
                }`}>{categoryLabels[q.category]}</span>
                {q.practiceCount > 0 && (
                  <span className="text-xs text-gray-400">Practiced {q.practiceCount}x</span>
                )}
              </div>
            </div>

            {/* Hints */}
            {linkedStories.length > 0 && (
              <div>
                <button onClick={() => setShowHint(!showHint)}
                  className="flex items-center gap-2 text-sm text-indigo-500 hover:text-indigo-700">
                  <svg className={`h-3.5 w-3.5 transition-transform ${showHint ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Show linked stories ({linkedStories.length})
                </button>
                {showHint && (
                  <div className="mt-2 rounded-lg border border-indigo-100 bg-indigo-50/30 p-3" style={{ animation: "slideDown 0.2s ease" }}>
                    <ul className="space-y-1">
                      {linkedStories.map((t) => (
                        <li key={t} className="text-sm text-indigo-600">· {t}</li>
                      ))}
                    </ul>
                    {q.notes && <p className="mt-2 text-xs text-gray-500 whitespace-pre-wrap">{q.notes}</p>}
                  </div>
                )}
              </div>
            )}

            {/* Stopwatch + Recording */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <span className={`font-mono text-2xl tabular-nums ${stopwatchRunning ? "text-gray-900" : "text-gray-400"}`}>
                  {formatTime(stopwatchTime)}
                </span>
                <button onClick={() => setStopwatchRunning(!stopwatchRunning)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    stopwatchRunning ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                  }`}>
                  {stopwatchRunning ? "Stop" : "Start"}
                </button>
              </div>
              <div className="flex items-center gap-2">
                {recording ? (
                  <button onClick={stopRecording}
                    className="flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    Stop Recording
                  </button>
                ) : (
                  <button onClick={startRecording}
                    className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Record
                  </button>
                )}
                {audioUrl && (
                  <audio src={audioUrl} controls className="h-8" />
                )}
              </div>
            </div>

            {/* Confidence rating + Next */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Confidence:</span>
                {(["low", "medium", "high"] as Confidence[]).map((level) => (
                  <button key={level!} onClick={() => dispatch({ type: "UPDATE_QUESTION", payload: { id: q.id, updates: { confidence: level } } })}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      q.confidence === level ? confidenceConfig[level!].cls : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                    }`}>
                    {confidenceConfig[level!].label}
                  </button>
                ))}
              </div>
              <Button onClick={nextQuestion}>Next Question</Button>
            </div>
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
          <Button variant="secondary" onClick={startPractice}>Practice</Button>
          <Button onClick={() => setShowAdd(true)}>Add Question</Button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="mb-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search questions..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div className="mb-6 flex gap-2">
        {(["all", "behavioral", "product-case", "role-specific"] as const).map((cat) => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === cat ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {cat === "all" ? "All" : categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* Question cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {filtered.map((q) => {
          const storyTitles = getLinkedStoryTitles(q.storyIds);
          return (
            <div key={q.id} className="group rounded-xl border border-gray-200 bg-white p-4 hover:shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{q.text}</p>
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
                  {storyTitles.length > 0 && (
                    <p className="mt-1.5 text-xs text-indigo-500 truncate">
                      Linked: {storyTitles.join(", ")}
                    </p>
                  )}
                  {q.notes && <p className="mt-1.5 text-xs text-gray-400 truncate">{q.notes}</p>}
                </div>
                <button onClick={() => dispatch({ type: "DELETE_QUESTION", payload: { id: q.id } })}
                  className="invisible group-hover:visible text-gray-300 hover:text-red-500 flex-shrink-0 mt-0.5">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-400">No questions found.</div>
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
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit">Add Question</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
