"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import StoryDetail from "./StoryDetail";

const GUIDING_QUESTIONS = [
  "What was the measurable outcome or impact?",
  "How did you specifically contribute vs. the team?",
  "What would you do differently if you faced this again?",
  "What was the hardest part, and how did you push through?",
  "Can you quantify the scale? (users, revenue, time saved, etc.)",
  "What did you learn that you've applied since?",
];

const IMPROVEMENT_TIPS = [
  "Add quantifiable results (numbers, percentages, dollar amounts)",
  "Be more specific about your individual role vs. the team's",
  "Shorten the Situation — focus on what the interviewer needs to know",
  "Make the Action section more concrete with specific steps",
  "Connect the Result to business impact",
  "Add what you learned or how you grew",
  "Remove jargon — make it understandable to a non-technical interviewer",
];

export default function StoriesPage() {
  const { state, dispatch } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formSituation, setFormSituation] = useState("");
  const [formTask, setFormTask] = useState("");
  const [formAction, setFormAction] = useState("");
  const [formResult, setFormResult] = useState("");
  const [formTags, setFormTags] = useState("");

  const selectedStory = state.stories.find((s) => s.id === selectedId);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle.trim()) return;
    dispatch({
      type: "ADD_STORY",
      payload: {
        title: formTitle.trim(),
        situation: formSituation.trim(),
        task: formTask.trim(),
        action: formAction.trim(),
        result: formResult.trim(),
        tags: formTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      },
    });
    resetForm();
    setShowAdd(false);
  }

  function resetForm() {
    setFormTitle("");
    setFormSituation("");
    setFormTask("");
    setFormAction("");
    setFormResult("");
    setFormTags("");
  }

  if (selectedStory) {
    return (
      <StoryDetail
        story={selectedStory}
        onBack={() => setSelectedId(null)}
        guidingQuestions={GUIDING_QUESTIONS}
        improvementTips={IMPROVEMENT_TIPS}
      />
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">STAR Stories</h1>
          <p className="mt-1 text-sm text-gray-500">
            {state.stories.length} {state.stories.length === 1 ? "story" : "stories"}
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>Add Story</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {state.stories.map((story) => {
          const unresolvedFeedback = story.feedback.filter((f) => !f.resolved).length;
          return (
            <div
              key={story.id}
              onClick={() => setSelectedId(story.id)}
              className="cursor-pointer rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
            >
              <h3 className="font-semibold text-gray-900">{story.title}</h3>
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                {story.situation}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {story.tags.map((tag) => (
                  <Badge key={tag} color="gray">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                <span>{story.feedback.length} feedback items</span>
                {unresolvedFeedback > 0 && (
                  <span className="text-amber-500">
                    {unresolvedFeedback} unresolved
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {state.stories.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-400">
          No stories yet. Add your first STAR story to get started.
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add STAR Story">
        <form onSubmit={handleAdd} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. Led cross-team migration project"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Situation</label>
            <textarea
              value={formSituation}
              onChange={(e) => setFormSituation(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="What was the context?"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Task</label>
            <textarea
              value={formTask}
              onChange={(e) => setFormTask(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="What were you responsible for?"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Action</label>
            <textarea
              value={formAction}
              onChange={(e) => setFormAction(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="What did you do?"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Result</label>
            <textarea
              value={formResult}
              onChange={(e) => setFormResult(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="What was the outcome?"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formTags}
              onChange={(e) => setFormTags(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. leadership, teamwork, technical"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => { resetForm(); setShowAdd(false); }}>
              Cancel
            </Button>
            <Button type="submit">Add Story</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
