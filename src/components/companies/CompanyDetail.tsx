"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import Button from "@/components/ui/Button";

const STATUS_COLORS: Record<string, string> = {
  "in process": "bg-amber-100 text-amber-700",
  "no update": "bg-blue-50 text-blue-700",
  interviewing: "bg-indigo-100 text-indigo-700",
  saved: "bg-gray-100 text-gray-600",
};

export default function CompanyDetail({ companyId }: { companyId: string }) {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const company = state.companies.find((c) => c.id === companyId);

  const [newQuestionAsked, setNewQuestionAsked] = useState("");
  const [newQuestionToAsk, setNewQuestionToAsk] = useState("");
  const [editingQ, setEditingQ] = useState<{ eventId: string; type: "asked" | "toAsk"; index: number } | null>(null);
  const [editQValue, setEditQValue] = useState("");

  if (!company) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Company not found.</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push("/companies")}>
          Back to Companies
        </Button>
      </div>
    );
  }

  function update(updates: Record<string, unknown>) {
    dispatch({ type: "UPDATE_COMPANY", payload: { id: companyId, updates } });
  }

  // Get application status
  const appStatus = state.applications.find((a) => a.company.toLowerCase() === company.name.toLowerCase())?.verdict ?? null;

  // Get all events for this company (past and future)
  const companyEvents = state.events
    .filter((ev) => ev.companyName?.toLowerCase() === company.name.toLowerCase())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const today = new Date(new Date().toDateString());

  function addQuestionAsked(e: React.FormEvent) {
    e.preventDefault();
    if (!newQuestionAsked.trim()) return;
    update({ questionsAsked: [...company!.questionsAsked, newQuestionAsked.trim()] });
    setNewQuestionAsked("");
  }

  function removeQuestionAsked(index: number) {
    update({ questionsAsked: company!.questionsAsked.filter((_, i) => i !== index) });
  }

  function addQuestionToAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!newQuestionToAsk.trim()) return;
    update({ questionsToAsk: [...company!.questionsToAsk, newQuestionToAsk.trim()] });
    setNewQuestionToAsk("");
  }

  function removeQuestionToAsk(index: number) {
    update({ questionsToAsk: company!.questionsToAsk.filter((_, i) => i !== index) });
  }

  function handleDelete() {
    dispatch({ type: "DELETE_COMPANY", payload: { id: companyId } });
    router.push("/companies");
  }

  return (
    <div>
      <button onClick={() => router.push("/companies")}
        className="mb-6 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Companies
      </button>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div className="flex-1">
          <input value={company.name} onChange={(e) => update({ name: e.target.value })}
            className="text-2xl font-bold text-gray-900 bg-transparent border-none focus:outline-none p-0 w-full" />
          <input value={company.role} onChange={(e) => update({ role: e.target.value })}
            placeholder="Role title"
            className="mt-1 text-sm text-gray-500 bg-transparent border-none focus:outline-none p-0 w-full" />
          {appStatus && (
            <span className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[appStatus.toLowerCase()] ?? "bg-gray-100 text-gray-600"}`}>
              {appStatus}
            </span>
          )}
        </div>
        <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
      </div>

      {/* Links */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <input value={company.roleUrl ?? ""} onChange={(e) => update({ roleUrl: e.target.value })}
            placeholder="Role posting URL"
            className="text-sm text-indigo-500 placeholder-gray-300 bg-transparent border-none focus:outline-none focus:text-indigo-700" />
          {company.roleUrl && (
            <a href={company.roleUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-indigo-500">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          <input value={company.companyUrl ?? ""} onChange={(e) => update({ companyUrl: e.target.value })}
            placeholder="Company website"
            className="text-sm text-indigo-500 placeholder-gray-300 bg-transparent border-none focus:outline-none focus:text-indigo-700" />
          {company.companyUrl && (
            <a href={company.companyUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-indigo-500">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left column — Research */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Why this company?</label>
            <textarea value={company.whyCompany} onChange={(e) => update({ whyCompany: e.target.value })}
              rows={3} placeholder="What excites you about this company?"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Why this role?</label>
            <textarea value={company.whyRole} onChange={(e) => update({ whyRole: e.target.value })}
              rows={3} placeholder="Why is this role a fit for you?"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <textarea value={company.notes} onChange={(e) => update({ notes: e.target.value })}
              rows={3} placeholder="General notes, recruiter info, etc."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" />
          </div>

          {/* Interview Timeline */}
          <div>
            <h3 className="mb-4 text-sm font-medium text-gray-700">Interview Timeline</h3>
            {companyEvents.length === 0 ? (
              <p className="text-sm text-gray-400">No interviews scheduled. Add events on the Dashboard.</p>
            ) : (
              <div className="relative pl-6">
                {/* Vertical line */}
                <div className="absolute left-2.5 top-0 bottom-0 w-px bg-gray-200" />

                {companyEvents.map((ev, i) => {
                  const isPast = new Date(ev.date + "T12:00:00") < today;
                  const isToday = new Date(ev.date + "T12:00:00").toDateString() === today.toDateString();
                  const evTasks = state.checklist.filter((t) => t.eventId === ev.id);

                  return (
                    <div key={ev.id} className="relative pb-6 last:pb-0">
                      {/* Dot */}
                      <div className={`absolute -left-3.5 top-1 h-3 w-3 rounded-full border-2 ${
                        isToday ? "border-indigo-500 bg-indigo-500" :
                        isPast ? "border-gray-400 bg-gray-400" :
                        "border-indigo-300 bg-white"
                      }`} />

                      <div className={`rounded-lg border p-4 ${isPast ? "border-gray-100 bg-gray-50" : "border-gray-200 bg-white"}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className={`text-sm font-medium ${isPast ? "text-gray-500" : "text-gray-900"}`}>
                              {ev.title}
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                              <span>{new Date(ev.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                              {ev.startTime && <span>{ev.startTime}{ev.endTime ? ` — ${ev.endTime}` : ""}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {ev.interviewType && (
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                ev.interviewType === "recruiter-screen" ? "bg-teal-50 text-teal-700" :
                                ev.interviewType === "behavioral" ? "bg-blue-50 text-blue-600" :
                                ev.interviewType === "case" ? "bg-purple-50 text-purple-600" :
                                "bg-gray-100 text-gray-500"
                              }`}>{
                                ev.interviewType === "recruiter-screen" ? "Recruiter Screen" :
                                ev.interviewType === "behavioral" ? "Behavioral" :
                                ev.interviewType === "case" ? "Case" :
                                ev.interviewType === "presentation" ? "Presentation" :
                                ev.interviewType
                              }</span>
                            )}
                            {isToday && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">Today</span>}
                          </div>
                        </div>

                        {/* Prep tasks */}
                        {evTasks.length > 0 && (
                          <div className="mt-3 border-t border-gray-100 pt-2">
                            <p className="mb-1 text-xs text-gray-400">
                              {evTasks.filter((t) => t.completed).length}/{evTasks.length} prep tasks
                            </p>
                            <div className="space-y-1">
                              {evTasks.map((task) => (
                                <div key={task.id} className="flex items-center gap-2">
                                  <input type="checkbox" checked={task.completed}
                                    onChange={() => dispatch({ type: "TOGGLE_CHECKLIST_ITEM", payload: { id: task.id } })}
                                    className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                  <span className={`text-xs ${task.completed ? "text-gray-400 line-through" : "text-gray-600"}`}>
                                    {task.text}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Questions to Ask */}
                        <div className="mt-3 border-t border-gray-100 pt-2">
                          <p className="mb-1 text-xs font-medium text-gray-500">Questions to Ask</p>
                          {ev.questionsToAsk.map((q, qi) => (
                            <div key={qi} className="group flex items-center gap-2 py-0.5">
                              {editingQ?.eventId === ev.id && editingQ.type === "toAsk" && editingQ.index === qi ? (
                                <input value={editQValue} onChange={(e) => setEditQValue(e.target.value)} autoFocus
                                  onBlur={() => {
                                    const updated = [...ev.questionsToAsk]; updated[qi] = editQValue;
                                    dispatch({ type: "UPDATE_EVENT", payload: { id: ev.id, updates: { questionsToAsk: updated } } });
                                    setEditingQ(null);
                                  }}
                                  onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditingQ(null); }}
                                  className="flex-1 rounded border border-indigo-300 px-1 py-0.5 text-xs focus:outline-none" />
                              ) : (
                                <span onClick={() => { setEditingQ({ eventId: ev.id, type: "toAsk", index: qi }); setEditQValue(q); }}
                                  className="flex-1 text-xs text-gray-600 cursor-pointer">{q}</span>
                              )}
                              <button onClick={() => dispatch({ type: "REMOVE_EVENT_QUESTION_TO_ASK", payload: { eventId: ev.id, index: qi } })}
                                className="invisible group-hover:visible text-gray-300 hover:text-red-500">
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                          <input placeholder="+ Add question to ask" onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                              dispatch({ type: "ADD_EVENT_QUESTION_TO_ASK", payload: { eventId: ev.id, question: (e.target as HTMLInputElement).value.trim() } });
                              (e.target as HTMLInputElement).value = "";
                            }
                          }}
                            className="w-full text-xs text-gray-400 placeholder-gray-300 bg-transparent border-none focus:outline-none focus:text-gray-600 py-1" />
                        </div>

                        {/* Questions Asked */}
                        <div className="mt-2 border-t border-gray-100 pt-2">
                          <p className="mb-1 text-xs font-medium text-gray-500">Questions They Asked</p>
                          {ev.questionsAsked.map((q, qi) => (
                            <div key={qi} className="group flex items-center gap-2 py-0.5">
                              {editingQ?.eventId === ev.id && editingQ.type === "asked" && editingQ.index === qi ? (
                                <input value={editQValue} onChange={(e) => setEditQValue(e.target.value)} autoFocus
                                  onBlur={() => {
                                    const updated = [...ev.questionsAsked]; updated[qi] = editQValue;
                                    dispatch({ type: "UPDATE_EVENT", payload: { id: ev.id, updates: { questionsAsked: updated } } });
                                    setEditingQ(null);
                                  }}
                                  onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditingQ(null); }}
                                  className="flex-1 rounded border border-indigo-300 px-1 py-0.5 text-xs focus:outline-none" />
                              ) : (
                                <span onClick={() => { setEditingQ({ eventId: ev.id, type: "asked", index: qi }); setEditQValue(q); }}
                                  className="flex-1 text-xs text-gray-600 cursor-pointer">{q}</span>
                              )}
                              <button onClick={() => dispatch({ type: "REMOVE_EVENT_QUESTION_ASKED", payload: { eventId: ev.id, index: qi } })}
                                className="invisible group-hover:visible text-gray-300 hover:text-red-500">
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                          <input placeholder="+ Add question they asked" onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                              dispatch({ type: "ADD_EVENT_QUESTION_ASKED", payload: { eventId: ev.id, question: (e.target as HTMLInputElement).value.trim() } });
                              (e.target as HTMLInputElement).value = "";
                            }
                          }}
                            className="w-full text-xs text-gray-400 placeholder-gray-300 bg-transparent border-none focus:outline-none focus:text-gray-600 py-1" />
                        </div>

                        {ev.notes && <p className="mt-2 text-xs text-gray-400">{ev.notes}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column — Summary */}
        <div className="space-y-6">
          {/* Interview Date */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Next Interview</label>
            <input type="date" value={company.interviewDate} onChange={(e) => update({ interviewDate: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>

          {/* Quick stats */}
          <div className="rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total rounds</span>
              <span className="font-medium text-gray-900">{companyEvents.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Prep tasks</span>
              <span className="font-medium text-gray-900">
                {state.checklist.filter((t) => companyEvents.some((ev) => ev.id === t.eventId)).filter((t) => t.completed).length}
                /{state.checklist.filter((t) => companyEvents.some((ev) => ev.id === t.eventId)).length}
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-400">Questions are tracked per interview round on the timeline. Click into each round to add questions.</p>
        </div>
      </div>
    </div>
  );
}
