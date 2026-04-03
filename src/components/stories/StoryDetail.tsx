"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Story } from "@/types";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

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
  const { dispatch } = useApp();
  const [editing, setEditing] = useState(false);
  const [newFeedback, setNewFeedback] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Edit state
  const [editTitle, setEditTitle] = useState(story.title);
  const [editSituation, setEditSituation] = useState(story.situation);
  const [editTask, setEditTask] = useState(story.task);
  const [editAction, setEditAction] = useState(story.action);
  const [editResult, setEditResult] = useState(story.result);
  const [editTags, setEditTags] = useState(story.tags.join(", "));

  function handleSaveEdit() {
    dispatch({
      type: "UPDATE_STORY",
      payload: {
        id: story.id,
        updates: {
          title: editTitle.trim(),
          situation: editSituation.trim(),
          task: editTask.trim(),
          action: editAction.trim(),
          result: editResult.trim(),
          tags: editTags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        },
      },
    });
    setEditing(false);
  }

  function handleAddFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!newFeedback.trim()) return;
    dispatch({
      type: "ADD_FEEDBACK",
      payload: { storyId: story.id, text: newFeedback.trim() },
    });
    setNewFeedback("");
  }

  function addTipAsFeedback(tip: string) {
    dispatch({
      type: "ADD_FEEDBACK",
      payload: { storyId: story.id, text: tip },
    });
  }

  function handleDelete() {
    dispatch({ type: "DELETE_STORY", payload: { id: story.id } });
    onBack();
  }

  const starSections = [
    { label: "Situation", value: story.situation, editValue: editSituation, setter: setEditSituation },
    { label: "Task", value: story.task, editValue: editTask, setter: setEditTask },
    { label: "Action", value: story.action, editValue: editAction, setter: setEditAction },
    { label: "Result", value: story.result, editValue: editResult, setter: setEditResult },
  ];

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Stories
      </button>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex-1">
          {editing ? (
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full text-2xl font-bold text-gray-900 bg-transparent border-b border-indigo-300 focus:outline-none pb-1"
            />
          ) : (
            <h1 className="text-2xl font-bold text-gray-900">{story.title}</h1>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {editing ? (
              <input
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="Tags (comma-separated)"
                className="text-sm text-gray-500 bg-transparent border-b border-gray-200 focus:outline-none focus:border-indigo-300"
              />
            ) : (
              story.tags.map((tag) => (
                <Badge key={tag} color="gray">{tag}</Badge>
              ))
            )}
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          {editing ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveEdit}>
                Save
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                Edit
              </Button>
              <Button variant="danger" size="sm" onClick={handleDelete}>
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* STAR Sections */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {starSections.map(({ label, value, editValue, setter }) => (
          <div
            key={label}
            className="rounded-xl border border-gray-200 bg-white p-5"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                {label[0]}
              </span>
              <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
            </div>
            {editing ? (
              <textarea
                value={editValue}
                onChange={(e) => setter(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            ) : (
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {value || <span className="italic text-gray-300">Not yet written</span>}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Suggestions Panel */}
      <div className="mt-8">
        <button
          onClick={() => setShowSuggestions(!showSuggestions)}
          className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          <svg
            className={`h-4 w-4 transition-transform ${showSuggestions ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Suggestions to improve this story
        </button>

        {showSuggestions && (
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Guiding Questions */}
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
              <h4 className="mb-3 text-sm font-semibold text-blue-800">
                Ask yourself...
              </h4>
              <ul className="space-y-2">
                {guidingQuestions.map((q, i) => (
                  <li key={i} className="text-sm text-blue-700">
                    {q}
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvement Tips */}
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
              <h4 className="mb-3 text-sm font-semibold text-amber-800">
                Quick improvements
              </h4>
              <div className="space-y-2">
                {improvementTips.map((tip, i) => (
                  <button
                    key={i}
                    onClick={() => addTipAsFeedback(tip)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-amber-700 hover:bg-amber-100 transition-colors"
                  >
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
          <input
            type="text"
            value={newFeedback}
            onChange={(e) => setNewFeedback(e.target.value)}
            placeholder="Add feedback or a note..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <Button type="submit" disabled={!newFeedback.trim()}>
            Add
          </Button>
        </form>

        <div className="space-y-2">
          {story.feedback.length === 0 && (
            <p className="py-4 text-center text-sm text-gray-400">
              No feedback yet. Add some above or use the suggestions.
            </p>
          )}
          {[...story.feedback].reverse().map((fb) => (
            <div
              key={fb.id}
              className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${
                fb.resolved
                  ? "border-gray-100 bg-gray-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <input
                type="checkbox"
                checked={fb.resolved}
                onChange={() =>
                  dispatch({
                    type: "TOGGLE_FEEDBACK",
                    payload: { storyId: story.id, feedbackId: fb.id },
                  })
                }
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="flex-1">
                <p
                  className={`text-sm ${
                    fb.resolved ? "text-gray-400 line-through" : "text-gray-700"
                  }`}
                >
                  {fb.text}
                </p>
                <p className="mt-1 text-xs text-gray-300">
                  {new Date(fb.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() =>
                  dispatch({
                    type: "DELETE_FEEDBACK",
                    payload: { storyId: story.id, feedbackId: fb.id },
                  })
                }
                className="text-gray-300 hover:text-red-500"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
