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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
        s.learning.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (activeTag) {
      result = result.filter((s) => s.tags.includes(activeTag));
    }
    // Sort: most linked questions first, then most recently updated
    return [...result].sort((a, b) => {
      const aLinks = state.questions.filter((q) => q.storyIds.includes(a.id)).length;
      const bLinks = state.questions.filter((q) => q.storyIds.includes(b.id)).length;
      if (aLinks !== bLinks) return bLinks - aLinks;
      return b.updatedAt - a.updatedAt;
    });
  }, [state.stories, search, activeTag]);

  function handleAdd() {
    dispatch({
      type: "ADD_STORY",
      payload: {
        title: "Untitled Story",
        situation: "",
        task: "",
        action: "",
        result: "",
        learning: "",
        tags: [],
      },
    });
    // Select will happen via useEffect watching stories length
    setWaitingForNew(true);
  }

  const [waitingForNew, setWaitingForNew] = useState(false);
  // When a new story is added, navigate to it
  if (waitingForNew && state.stories.length > 0) {
    const newest = state.stories[state.stories.length - 1];
    setWaitingForNew(false);
    setSelectedId(newest.id);
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
        <Button onClick={handleAdd}>Add Story</Button>
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
          const linkedQCount = state.questions.filter((q) => q.storyIds.includes(story.id)).length;
          const missingSections = [
            !story.situation && "S",
            !story.task && "T",
            !story.action && "A",
            !story.result && "R",
          ].filter(Boolean);
          const isIncomplete = missingSections.length > 0 || unresolvedFeedback > 0;
          return (
            <div key={story.id} className={`relative group cursor-pointer rounded-xl border bg-white p-5 transition-all hover:shadow-md hover:-translate-y-0.5 ${
                isIncomplete ? "border-amber-200" : "border-gray-200"
              }`} onClick={() => setSelectedId(story.id)}>
              <button onClick={(e) => { e.stopPropagation(); setDeleteId(story.id); }}
                className="absolute top-3 right-3 invisible group-hover:visible rounded-full p-1 text-gray-300 hover:text-red-500 hover:bg-red-50">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-gray-900">{story.title}</h3>
                {isIncomplete && (
                  <span className="flex-shrink-0 ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                    {missingSections.length > 0 ? `Missing ${missingSections.join("")}` : "Feedback"}
                  </span>
                )}
              </div>
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
                {unresolvedFeedback > 0 ? <span className="text-amber-500">{unresolvedFeedback} unresolved feedback</span> : <span>{story.feedback.length} feedback</span>}
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

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete story?">
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to delete <span className="font-medium text-gray-900">{state.stories.find((s) => s.id === deleteId)?.title}</span>?
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setDeleteId(null)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={() => { dispatch({ type: "DELETE_STORY", payload: { id: deleteId! } }); setDeleteId(null); }}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
