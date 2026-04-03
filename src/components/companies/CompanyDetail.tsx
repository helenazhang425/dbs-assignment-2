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
          <div className="flex items-center gap-3">
            <input value={company.name} onChange={(e) => update({ name: e.target.value })}
              className="text-2xl font-bold text-gray-900 bg-transparent border-none focus:outline-none p-0" />
            {appStatus && (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[appStatus.toLowerCase()] ?? "bg-gray-100 text-gray-600"}`}>
                {appStatus}
              </span>
            )}
          </div>
          <input value={company.role} onChange={(e) => update({ role: e.target.value })}
            placeholder="Role title"
            className="mt-1 text-sm text-gray-500 bg-transparent border-none focus:outline-none p-0 w-full" />
        </div>
        <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
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

                        {/* Prep tasks for this event */}
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

                        {ev.notes && <p className="mt-2 text-xs text-gray-400">{ev.notes}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column — Questions */}
        <div className="space-y-6">
          {/* Interview Date */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Interview Date</label>
            <input type="date" value={company.interviewDate} onChange={(e) => update({ interviewDate: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>

          {/* Questions to Ask */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Questions to Ask Them</label>
            <div className="space-y-2">
              {company.questionsToAsk.map((q, i) => (
                <div key={i} className="group flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  <span className="flex-1 text-sm text-gray-700">{q}</span>
                  <button onClick={() => removeQuestionToAsk(i)} className="invisible group-hover:visible text-gray-300 hover:text-red-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={addQuestionToAsk} className="mt-2">
              <input type="text" value={newQuestionToAsk} onChange={(e) => setNewQuestionToAsk(e.target.value)}
                placeholder="+ Add a question to ask"
                onKeyDown={(e) => { if (e.key === "Enter") addQuestionToAsk(e); }}
                className="w-full text-sm text-gray-500 placeholder-gray-300 bg-transparent border-none focus:outline-none focus:text-gray-700 px-3 py-2" />
            </form>
          </div>

          {/* Questions Asked */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Questions They Asked</label>
            <div className="space-y-2">
              {company.questionsAsked.map((q, i) => (
                <div key={i} className="group flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  <span className="flex-1 text-sm text-gray-700">{q}</span>
                  <button onClick={() => removeQuestionAsked(i)} className="invisible group-hover:visible text-gray-300 hover:text-red-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={addQuestionAsked} className="mt-2">
              <input type="text" value={newQuestionAsked} onChange={(e) => setNewQuestionAsked(e.target.value)}
                placeholder="+ Add a question they asked"
                onKeyDown={(e) => { if (e.key === "Enter") addQuestionAsked(e); }}
                className="w-full text-sm text-gray-500 placeholder-gray-300 bg-transparent border-none focus:outline-none focus:text-gray-700 px-3 py-2" />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
