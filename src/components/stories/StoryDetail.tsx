"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Story } from "@/types";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";

interface StoryDetailProps {
  story: Story;
  onBack: () => void;
  guidingQuestions: string[];
  improvementTips: string[];
}

export default function StoryDetail({
  story,
  onBack,
  guidingQuestions,
  improvementTips,
}: StoryDetailProps) {
  const { state, dispatch } = useApp();
  const [newFeedback, setNewFeedback] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingTags, setEditingTags] = useState(false);
  const [tagValue, setTagValue] = useState(story.tags.join(", "));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [linkingQuestion, setLinkingQuestion] = useState(false);

  // Questions linked to this story
  const linkedQuestions = useMemo(() =>
    state.questions.filter((q) => q.storyId === story.id),
  [state.questions, story.id]);

  // Unlinked questions available to link
  const availableQuestions = useMemo(() =>
    state.questions.filter((q) => !q.storyId),
  [state.questions]);

  function updateField(field: string, value: string) {
    dispatch({
      type: "UPDATE_STORY",
      payload: { id: story.id, updates: { [field]: value.trim() } },
    });
    setEditingField(null);
  }

  function saveTags() {
    dispatch({
      type: "UPDATE_STORY",
      payload: {
        id: story.id,
        updates: { tags: tagValue.split(",").map((t) => t.trim()).filter(Boolean) },
      },
    });
    setEditingTags(false);
  }

  function handleAddFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!newFeedback.trim()) return;
    dispatch({ type: "ADD_FEEDBACK", payload: { storyId: story.id, text: newFeedback.trim() } });
    setNewFeedback("");
  }

  function addTipAsFeedback(tip: string) {
    dispatch({ type: "ADD_FEEDBACK", payload: { storyId: story.id, text: tip } });
  }

  function handleDelete() {
    dispatch({ type: "DELETE_STORY", payload: { id: story.id } });
    onBack();
  }

  const starSections = [
    { key: "situation", label: "Situation", value: story.situation },
    { key: "action", label: "Action", value: story.action },
    { key: "task", label: "Task", value: story.task },
    { key: "result", label: "Result", value: story.result },
  ];

  return (
    <div>
      <button onClick={onBack}
        className="mb-6 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Stories
      </button>

      {/* Title — inline edit */}
      <div className="mb-2">
        <input defaultValue={story.title} key={story.id + "-title"}
          onBlur={(e) => { if (e.target.value.trim() !== story.title) updateField("title", e.target.value); }}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
          className="text-2xl font-bold text-gray-900 bg-transparent border-none focus:outline-none p-0 w-full rounded-md hover:bg-gray-50 focus:bg-white px-1 -mx-1 cursor-text" />
      </div>

      {/* Tags — inline edit */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {editingTags ? (
          <input value={tagValue} onChange={(e) => setTagValue(e.target.value)} autoFocus
            onBlur={saveTags}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            placeholder="Tags (comma-separated)"
            className="text-sm text-gray-500 bg-transparent border-b border-indigo-300 focus:outline-none px-1" />
        ) : (
          <>
            {story.tags.length > 0 ? story.tags.map((tag) => (
              <Badge key={tag} color="gray">{tag}</Badge>
            )) : (
              <span className="text-xs text-gray-300 italic">No tags</span>
            )}
            <button onClick={() => { setTagValue(story.tags.join(", ")); setEditingTags(true); }}
              className="text-xs text-gray-400 hover:text-indigo-500">edit</button>
          </>
        )}
      </div>

      {/* STAR Sections — inline edit */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {starSections.map(({ key, label, value }) => (
          <div key={key} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                {label[0]}
              </span>
              <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
            </div>
            {editingField === key ? (
              <textarea defaultValue={value} autoFocus rows={4}
                onBlur={(e) => updateField(key, e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); (e.target as HTMLTextAreaElement).blur(); } }}
                className="w-full rounded-lg border border-indigo-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" />
            ) : (
              <div onClick={() => setEditingField(key)}
                className="cursor-text rounded-lg px-3 py-2 -mx-3 -my-1 hover:bg-gray-50 min-h-[4rem]">
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {value || <span className="italic text-gray-300">Click to write...</span>}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Learning — full width */}
      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">L</span>
          <h3 className="text-sm font-semibold text-gray-700">Learning</h3>
        </div>
        {editingField === "learning" ? (
          <textarea defaultValue={story.learning} autoFocus rows={3}
            onBlur={(e) => updateField("learning", e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); (e.target as HTMLTextAreaElement).blur(); } }}
            className="w-full rounded-lg border border-indigo-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" />
        ) : (
          <div onClick={() => setEditingField("learning")}
            className="cursor-text rounded-lg px-3 py-2 -mx-3 -my-1 hover:bg-gray-50 min-h-[3rem]">
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {story.learning || <span className="italic text-gray-300">Click to write...</span>}
            </p>
          </div>
        )}
      </div>

      {/* Linked Questions */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Linked Questions</h3>
          <button onClick={() => setLinkingQuestion(!linkingQuestion)}
            className="text-xs text-indigo-500 hover:text-indigo-700">+ Link question</button>
        </div>
        {linkingQuestion && availableQuestions.length > 0 && (
          <div className="mb-3 rounded-lg border border-gray-200 bg-white p-2 max-h-40 overflow-y-auto" style={{ animation: "slideDown 0.2s ease" }}>
            {availableQuestions.map((q) => (
              <button key={q.id} onClick={() => {
                dispatch({ type: "UPDATE_QUESTION", payload: { id: q.id, updates: { storyId: story.id } } });
              }}
                className="block w-full px-3 py-1.5 text-left text-xs text-gray-600 rounded hover:bg-indigo-50">
                {q.text}
              </button>
            ))}
          </div>
        )}
        {linkingQuestion && availableQuestions.length === 0 && (
          <p className="mb-3 text-xs text-gray-400">No unlinked questions available. Add questions on the Questions page first.</p>
        )}
        {linkedQuestions.length > 0 ? (
          <div className="space-y-1.5">
            {linkedQuestions.map((q) => (
              <div key={q.id} className="grid grid-cols-2 gap-3 rounded-lg border border-gray-100 px-3 py-2 group">
                <span className="text-sm text-gray-600">{q.text}</span>
                <div className="flex items-center gap-2">
                  <input defaultValue={q.notes} placeholder="Notes..."
                    onBlur={(e) => dispatch({ type: "UPDATE_QUESTION", payload: { id: q.id, updates: { notes: e.target.value } } })}
                    onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                    className="flex-1 text-sm text-gray-500 placeholder-gray-300 bg-transparent border-none focus:outline-none hover:bg-gray-50 rounded px-1" />
                  <button onClick={() => dispatch({ type: "UPDATE_QUESTION", payload: { id: q.id, updates: { storyId: null } } })}
                    className="invisible group-hover:visible text-gray-300 hover:text-red-500 flex-shrink-0">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : !linkingQuestion && (
          <p className="text-xs text-gray-400">No linked questions yet.</p>
        )}
      </div>

      {/* Suggestions Panel */}
      <div className="mt-8">
        <button onClick={() => setShowSuggestions(!showSuggestions)}
          className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700">
          <svg className={`h-4 w-4 transition-transform ${showSuggestions ? "rotate-90" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Suggestions to improve this story
        </button>

        {showSuggestions && (
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2" style={{ animation: "slideUp 0.2s ease" }}>
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
              <h4 className="mb-3 text-sm font-semibold text-blue-800">Ask yourself...</h4>
              <ul className="space-y-2">
                {guidingQuestions.map((q, i) => (
                  <li key={i} className="text-sm text-blue-700">{q}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
              <h4 className="mb-3 text-sm font-semibold text-amber-800">Quick improvements</h4>
              <div className="space-y-2">
                {improvementTips.map((tip, i) => (
                  <button key={i} onClick={() => addTipAsFeedback(tip)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-amber-700 hover:bg-amber-100">
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {tip}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Section */}
      <div className="mt-8">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Feedback</h3>
        <form onSubmit={handleAddFeedback} className="mb-4 flex gap-3">
          <input type="text" value={newFeedback} onChange={(e) => setNewFeedback(e.target.value)}
            placeholder="Add feedback or a note..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          <button type="submit" disabled={!newFeedback.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">Add</button>
        </form>
        <div className="space-y-2">
          {story.feedback.length === 0 && (
            <p className="py-4 text-center text-sm text-gray-400">No feedback yet. Add some above or use the suggestions.</p>
          )}
          {[...story.feedback].reverse().map((fb) => (
            <div key={fb.id} className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${
              fb.resolved ? "border-gray-100 bg-gray-50" : "border-gray-200 bg-white"
            }`}>
              <input type="checkbox" checked={fb.resolved}
                onChange={() => dispatch({ type: "TOGGLE_FEEDBACK", payload: { storyId: story.id, feedbackId: fb.id } })}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <div className="flex-1">
                <p className={`text-sm ${fb.resolved ? "text-gray-400 line-through" : "text-gray-700"}`}>{fb.text}</p>
                <p className="mt-1 text-xs text-gray-300">{new Date(fb.createdAt).toLocaleDateString()}</p>
              </div>
              <button onClick={() => dispatch({ type: "DELETE_FEEDBACK", payload: { storyId: story.id, feedbackId: fb.id } })}
                className="text-gray-300 hover:text-red-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Delete */}
      <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
        <button onClick={() => setShowDeleteConfirm(true)} className="text-xs text-red-500 hover:text-red-700">Delete story</button>
      </div>

      <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete story?">
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to delete <span className="font-medium text-gray-900">{story.title}</span>?
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setShowDeleteConfirm(false)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleDelete}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
