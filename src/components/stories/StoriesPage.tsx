"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
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
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formSituation, setFormSituation] = useState("");
  const [formTask, setFormTask] = useState("");
  const [formAction, setFormAction] = useState("");
  const [formResult, setFormResult] = useState("");
  const [formTags, setFormTags] = useState("");

  const selectedStory = state.stories.find((s) => s.id === selectedId);

  // All unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    state.stories.forEach((s) => s.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [state.stories]);

  // Filtered stories
  const filtered = useMemo(() => {
    let result = state.stories;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s) =>
        s.title.toLowerCase().includes(q) ||
        s.situation.toLowerCase().includes(q) ||
        s.task.toLowerCase().includes(q) ||
        s.action.toLowerCase().includes(q) ||
        s.result.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (activeTag) {
      result = result.filter((s) => s.tags.includes(activeTag));
    }
    return result;
  }, [state.stories, search, activeTag]);

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
        tags: formTags.split(",").map((t) => t.trim()).filter(Boolean),
      },
    });
    resetForm();
    setShowAdd(false);
  }

  function resetForm() {
    setFormTitle(""); setFormSituation(""); setFormTask("");
    setFormAction(""); setFormResult(""); setFormTags("");
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
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">STAR Stories</h1>
          <p className="mt-1 text-sm text-gray-500">
            {filtered.length} {filtered.length === 1 ? "story" : "stories"}
            {activeTag && <span> tagged &ldquo;{activeTag}&rdquo;</span>}
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>Add Story</Button>
      </div>

      {/* Search + Tag Filters */}
      <div className="mb-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search stories..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
      {allTags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {allTags.map((tag) => (
            <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                activeTag === tag ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              {tag}
            </button>
          ))}
          {activeTag && (
            <button onClick={() => setActiveTag(null)} className="text-xs text-gray-400 hover:text-gray-600 ml-1">Clear</button>
          )}
        </div>
      )}

      {/* Story Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((story) => {
          const unresolvedFeedback = story.feedback.filter((f) => !f.resolved).length;
          const linkedQCount = state.questions.filter((q) => q.storyId === story.id).length;
          return (
            <div key={story.id} onClick={() => setSelectedId(story.id)}
              className="cursor-pointer rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md hover:-translate-y-0.5">
              <h3 className="font-semibold text-gray-900">{story.title}</h3>
              {/* Brief summary bullets */}
              <ul className="mt-2 space-y-0.5 text-xs text-gray-500">
                {story.situation && <li className="truncate">· {story.situation.split("\n")[0]}</li>}
                {story.result && <li className="truncate">· {story.result.split("\n")[0]}</li>}
              </ul>
              {story.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {story.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{tag}</span>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                {linkedQCount > 0 && <span className="text-indigo-500">{linkedQCount} linked {linkedQCount === 1 ? "question" : "questions"}</span>}
                <span>{story.feedback.length} feedback</span>
                {unresolvedFeedback > 0 && <span className="text-amber-500">{unresolvedFeedback} unresolved</span>}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && state.stories.length > 0 && (
        <div className="py-12 text-center text-sm text-gray-400">No stories match your search.</div>
      )}
      {state.stories.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-400">No stories yet. Add your first STAR story to get started.</div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add STAR Story">
        <form onSubmit={handleAdd} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
            <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. Led cross-team migration project" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Situation</label>
            <textarea value={formSituation} onChange={(e) => setFormSituation(e.target.value)} rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="What was the context?" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Task</label>
            <textarea value={formTask} onChange={(e) => setFormTask(e.target.value)} rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="What were you responsible for?" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Action</label>
            <textarea value={formAction} onChange={(e) => setFormAction(e.target.value)} rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="What did you do?" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Result</label>
            <textarea value={formResult} onChange={(e) => setFormResult(e.target.value)} rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="What was the outcome?" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
            <input type="text" value={formTags} onChange={(e) => setFormTags(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. leadership, teamwork, technical" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => { resetForm(); setShowAdd(false); }}>Cancel</Button>
            <Button type="submit">Add Story</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
