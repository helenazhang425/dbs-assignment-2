"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { QuestionCategory } from "@/types";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

const categoryLabels: Record<QuestionCategory, string> = {
  behavioral: "Behavioral",
  "product-case": "Product / Case",
  "role-specific": "Role-Specific",
};

export default function QuestionsPage() {
  const { state, dispatch } = useApp();
  const [filter, setFilter] = useState<QuestionCategory | "all">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [formText, setFormText] = useState("");
  const [formCategory, setFormCategory] = useState<QuestionCategory>("behavioral");
  const [formNotes, setFormNotes] = useState("");

  const filtered =
    filter === "all"
      ? state.questions
      : state.questions.filter((q) => q.category === filter);

  const practicedCount = state.questions.filter((q) => q.practiced).length;

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!formText.trim()) return;
    dispatch({
      type: "ADD_QUESTION",
      payload: {
        text: formText.trim(),
        category: formCategory,
        storyId: null,
        notes: formNotes.trim(),
      },
    });
    setFormText("");
    setFormNotes("");
    setFormCategory("behavioral");
    setShowAdd(false);
  }

  function getLinkedStoryTitle(storyId: string | null) {
    if (!storyId) return null;
    return state.stories.find((s) => s.id === storyId)?.title ?? null;
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Practice Questions</h1>
          <p className="mt-1 text-sm text-gray-500">
            {practicedCount} of {state.questions.length} practiced
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>Add Question</Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {(["all", "behavioral", "product-case", "role-specific"] as const).map(
          (cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === cat
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat === "all" ? "All" : categoryLabels[cat]}
            </button>
          )
        )}
      </div>

      {/* Question list */}
      <div className="space-y-3">
        {filtered.map((q) => {
          const expanded = expandedId === q.id;
          const storyTitle = getLinkedStoryTitle(q.storyId);
          return (
            <div
              key={q.id}
              className="rounded-xl border border-gray-200 bg-white"
            >
              <div className="flex items-start gap-3 p-4">
                <input
                  type="checkbox"
                  checked={q.practiced}
                  onChange={() =>
                    dispatch({ type: "TOGGLE_PRACTICED", payload: { id: q.id } })
                  }
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => setExpandedId(expanded ? null : q.id)}
                >
                  <p
                    className={`text-sm ${
                      q.practiced ? "text-gray-400 line-through" : "text-gray-900"
                    }`}
                  >
                    {q.text}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge category={q.category}>{categoryLabels[q.category]}</Badge>
                    {storyTitle && (
                      <span className="text-xs text-indigo-500">
                        Linked: {storyTitle}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() =>
                    dispatch({ type: "DELETE_QUESTION", payload: { id: q.id } })
                  }
                  className="text-gray-300 hover:text-red-500"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Expanded detail */}
              {expanded && (
                <div className="border-t border-gray-100 px-4 py-4 pl-11">
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Notes
                  </label>
                  <textarea
                    value={q.notes}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_QUESTION",
                        payload: { id: q.id, updates: { notes: e.target.value } },
                      })
                    }
                    placeholder="Your notes on this question..."
                    rows={3}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <label className="mb-1 mt-3 block text-xs font-medium text-gray-500">
                    Link to Story
                  </label>
                  <select
                    value={q.storyId ?? ""}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_QUESTION",
                        payload: {
                          id: q.id,
                          updates: { storyId: e.target.value || null },
                        },
                      })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">None</option>
                    {state.stories.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">
            No questions found. Try a different filter or add a new one.
          </div>
        )}
      </div>

      {/* Add modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Question">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Question
            </label>
            <textarea
              value={formText}
              onChange={(e) => setFormText(e.target.value)}
              required
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Enter the interview question..."
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value as QuestionCategory)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {Object.entries(categoryLabels).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Notes (optional)
            </label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Any initial notes..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Question</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
