"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { InterviewType, CompanyRole } from "@/types";
import Button from "@/components/ui/Button";

export default function CompanyDetail({ companyId }: { companyId: string }) {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const company = state.companies.find((c) => c.id === companyId);

  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [editingQ, setEditingQ] = useState<{ eventId: string; type: "asked" | "toAsk"; index: number } | null>(null);
  const [editQValue, setEditQValue] = useState("");
  const [addingInterviewForRole, setAddingInterviewForRole] = useState<string | null>(null);
  const [newEvDate, setNewEvDate] = useState("");
  const [newEvStart, setNewEvStart] = useState("");
  const [newEvEnd, setNewEvEnd] = useState("");
  const [newEvType, setNewEvType] = useState("");
  const detailPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedEventId && detailPanelRef.current) {
      detailPanelRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedEventId]);

  // Auto-expand first active role
  useEffect(() => {
    if (company && !expandedRoleId) {
      const activeRoles = company.roles.filter((r) => r.status === "interviewing");
      if (activeRoles.length > 0) setExpandedRoleId(activeRoles[0].id);
    }
  }, [company, expandedRoleId]);

  if (!company) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Company not found.</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push("/companies")}>Back to Companies</Button>
      </div>
    );
  }

  function update(updates: Record<string, unknown>) {
    dispatch({ type: "UPDATE_COMPANY", payload: { id: companyId, updates } });
  }

  function updateRole(roleId: string, updates: Partial<CompanyRole>) {
    const newRoles = company!.roles.map((r) => r.id === roleId ? { ...r, ...updates } : r);
    update({ roles: newRoles });
  }

  function deleteRole(roleId: string) {
    update({ roles: company!.roles.filter((r) => r.id !== roleId) });
    if (expandedRoleId === roleId) setExpandedRoleId(null);
  }

  function addRole() {
    const newRole: CompanyRole = { id: crypto.randomUUID(), title: "", whyRole: "", roleUrl: "", status: "interviewing" };
    update({ roles: [...company!.roles, newRole] });
    setExpandedRoleId(newRole.id);
  }

  const today = new Date(new Date().toDateString());

  function getRoleEvents(roleTitle: string) {
    return state.events
      .filter((ev) => ev.companyName?.toLowerCase() === company!.name.toLowerCase() &&
        ev.role?.toLowerCase() === roleTitle.toLowerCase())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  function handleDelete() {
    dispatch({ type: "DELETE_COMPANY", payload: { id: companyId } });
    router.push("/companies");
  }

  // Only show active roles (interviewing status) + any with events
  const activeRoles = company.roles.filter((r) => r.status === "interviewing" || getRoleEvents(r.title).length > 0);
  const archivedRoles = company.roles.filter((r) => r.status !== "interviewing" && getRoleEvents(r.title).length === 0);

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
      <div className="mb-4 flex items-start justify-between">
        <input value={company.name} onChange={(e) => update({ name: e.target.value })}
          className="text-2xl font-bold text-gray-900 bg-transparent border-none focus:outline-none p-0 w-full" />
        <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
      </div>

      {/* Company URL */}
      <div className="mb-6 flex items-center gap-2">
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

      {/* Why this company — shared, above roles */}
      <div className="mb-6">
        <label className="mb-1 block text-sm font-medium text-gray-700">Why this company?</label>
        <textarea value={company.whyCompany} onChange={(e) => update({ whyCompany: e.target.value })}
          rows={3} placeholder="What excites you about this company?"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" />
      </div>

      {/* Notes — shared */}
      <div className="mb-8">
        <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
        <textarea value={company.notes} onChange={(e) => update({ notes: e.target.value })}
          rows={2} placeholder="General notes, recruiter info, etc."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" />
      </div>

      {/* Role Cards */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Roles</h2>
        <button onClick={addRole} className="text-sm text-indigo-500 hover:text-indigo-700">+ Add role</button>
      </div>

      <div className="space-y-4">
        {activeRoles.map((role) => {
          const isExpanded = expandedRoleId === role.id;
          const events = getRoleEvents(role.title);
          const nextEv = events.find((ev) => new Date(ev.date + "T12:00:00") >= today);

          return (
            <div key={role.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              {/* Card header — always visible */}
              <div className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => { setExpandedRoleId(isExpanded ? null : role.id); setSelectedEventId(null); }}>
                <svg className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{role.title || "Untitled Role"}</p>
                  {nextEv && (
                    <p className="text-xs text-gray-400">
                      Next: {new Date(nextEv.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {nextEv.startTime ? ` at ${nextEv.startTime}` : ""}
                      {nextEv.interviewType ? ` · ${nextEv.interviewType === "recruiter-screen" ? "Recruiter Screen" : nextEv.interviewType}` : ""}
                    </p>
                  )}
                </div>
                <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">In Process</span>
                <button onClick={(e) => { e.stopPropagation(); deleteRole(role.id); }}
                  className="text-gray-300 hover:text-red-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-5 py-4 space-y-4" style={{ animation: "slideIn 0.2s ease-out" }}>
                  {/* Role title + URL */}
                  <div className="flex items-center gap-2">
                    <input value={role.title} onChange={(e) => updateRole(role.id, { title: e.target.value })}
                      placeholder="Role title"
                      className="text-sm font-medium text-gray-700 bg-transparent border-none focus:outline-none p-0 flex-1" />
                    <div className="flex items-center gap-1">
                      <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <input value={role.roleUrl} onChange={(e) => updateRole(role.id, { roleUrl: e.target.value })}
                        placeholder="Role URL"
                        className="text-xs text-indigo-500 placeholder-gray-300 bg-transparent border-none focus:outline-none w-40" />
                    </div>
                  </div>

                  {/* Why this role */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Why this role?</label>
                    <textarea value={role.whyRole} onChange={(e) => updateRole(role.id, { whyRole: e.target.value })}
                      rows={2} placeholder="Why is this role a good fit for you?"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" />
                  </div>

                  {/* Timeline */}
                  <div>
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Interview Timeline</h4>
                    {events.length === 0 ? (
                      <p className="text-xs text-gray-400">No interviews yet.</p>
                    ) : (
                      <div className="flex gap-4">
                        <div className="relative pl-5 flex-shrink-0" style={{ minWidth: "240px" }}>
                          <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-200" />
                          {events.map((ev) => {
                            const isPast = new Date(ev.date + "T12:00:00") < today;
                            const isSelected = selectedEventId === ev.id;
                            return (
                              <div key={ev.id} className="relative pb-3 last:pb-0 flex items-center">
                                <div className={`absolute -left-3 h-2.5 w-2.5 rounded-full border-2 ${
                                  isSelected ? "border-indigo-500 bg-indigo-500" :
                                  isPast ? "border-gray-400 bg-gray-400" : "border-indigo-300 bg-white"
                                }`} />
                                <div onClick={() => setSelectedEventId(isSelected ? null : ev.id)}
                                  className={`w-full rounded-lg border px-3 py-2 text-xs cursor-pointer transition-all ${
                                    isSelected ? "border-indigo-300 bg-indigo-50" :
                                    isPast ? "border-gray-100 bg-gray-50 hover:border-gray-200" :
                                    "border-gray-200 bg-white hover:border-indigo-200"
                                  }`}>
                                  <div className="flex items-center justify-between">
                                    <span className={isPast ? "text-gray-400" : "text-gray-600"}>
                                      {new Date(ev.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                                    </span>
                                    {ev.interviewType && (
                                      <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${
                                        ev.interviewType === "recruiter-screen" ? "bg-teal-50 text-teal-700" :
                                        ev.interviewType === "behavioral" ? "bg-blue-50 text-blue-600" :
                                        ev.interviewType === "case" ? "bg-purple-50 text-purple-600" : "bg-gray-100 text-gray-500"
                                      }`}>{
                                        ev.interviewType === "recruiter-screen" ? "Recruiter Screen" :
                                        ev.interviewType === "behavioral" ? "Behavioral" :
                                        ev.interviewType === "case" ? "Case" : ev.interviewType
                                      }</span>
                                    )}
                                  </div>
                                  {ev.startTime && <p className={`mt-0.5 ${isPast ? "text-gray-300" : "text-gray-400"}`}>{ev.startTime}{ev.endTime ? ` — ${ev.endTime}` : ""}</p>}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Detail panel */}
                        {selectedEventId && (() => {
                          const ev = events.find((e) => e.id === selectedEventId);
                          if (!ev) return null;
                          return (
                            <div ref={detailPanelRef} className="flex-1 rounded-lg border border-indigo-100 bg-indigo-50/20 p-4 text-sm" style={{ animation: "slideIn 0.2s ease-out" }}>
                              <div className="flex items-center justify-between mb-3">
                                <p className="font-medium text-gray-900">{new Date(ev.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
                                <button onClick={() => setSelectedEventId(null)} className="text-gray-400 hover:text-gray-600">
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>

                              {/* Questions They Asked */}
                              <div className="mb-3">
                                <p className="mb-1 text-xs font-semibold text-gray-500">Questions They Asked</p>
                                <ul className="space-y-1 pl-3">
                                  {ev.questionsAsked.map((q, qi) => (
                                    <li key={qi} className="group flex items-start gap-2">
                                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                                      {editingQ?.eventId === ev.id && editingQ.type === "asked" && editingQ.index === qi ? (
                                        <input value={editQValue} onChange={(e) => setEditQValue(e.target.value)} autoFocus
                                          onBlur={() => { const u = [...ev.questionsAsked]; u[qi] = editQValue; dispatch({ type: "UPDATE_EVENT", payload: { id: ev.id, updates: { questionsAsked: u } } }); setEditingQ(null); }}
                                          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditingQ(null); }}
                                          className="flex-1 rounded border border-indigo-300 px-2 py-0.5 text-sm focus:outline-none" />
                                      ) : (
                                        <span onClick={() => { setEditingQ({ eventId: ev.id, type: "asked", index: qi }); setEditQValue(q); }}
                                          className="flex-1 text-sm text-gray-600 cursor-pointer">{q}</span>
                                      )}
                                      <button onClick={() => dispatch({ type: "REMOVE_EVENT_QUESTION_ASKED", payload: { eventId: ev.id, index: qi } })}
                                        className="mt-0.5 invisible group-hover:visible text-gray-300 hover:text-red-500 flex-shrink-0">
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                                <input placeholder="+ Add" onKeyDown={(e) => {
                                  if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                                    dispatch({ type: "ADD_EVENT_QUESTION_ASKED", payload: { eventId: ev.id, question: (e.target as HTMLInputElement).value.trim() } });
                                    (e.target as HTMLInputElement).value = "";
                                  }
                                }} className="ml-3 text-xs text-gray-400 placeholder-gray-300 bg-transparent border-none focus:outline-none focus:text-gray-600 py-0.5" />
                              </div>

                              {/* Questions to Ask */}
                              <div>
                                <p className="mb-1 text-xs font-semibold text-gray-500">Questions to Ask</p>
                                <ul className="space-y-1 pl-3">
                                  {ev.questionsToAsk.map((q, qi) => (
                                    <li key={qi} className="group flex items-start gap-2">
                                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-300 flex-shrink-0" />
                                      {editingQ?.eventId === ev.id && editingQ.type === "toAsk" && editingQ.index === qi ? (
                                        <input value={editQValue} onChange={(e) => setEditQValue(e.target.value)} autoFocus
                                          onBlur={() => { const u = [...ev.questionsToAsk]; u[qi] = editQValue; dispatch({ type: "UPDATE_EVENT", payload: { id: ev.id, updates: { questionsToAsk: u } } }); setEditingQ(null); }}
                                          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditingQ(null); }}
                                          className="flex-1 rounded border border-indigo-300 px-2 py-0.5 text-sm focus:outline-none" />
                                      ) : (
                                        <span onClick={() => { setEditingQ({ eventId: ev.id, type: "toAsk", index: qi }); setEditQValue(q); }}
                                          className="flex-1 text-sm text-gray-600 cursor-pointer">{q}</span>
                                      )}
                                      <button onClick={() => dispatch({ type: "REMOVE_EVENT_QUESTION_TO_ASK", payload: { eventId: ev.id, index: qi } })}
                                        className="mt-0.5 invisible group-hover:visible text-gray-300 hover:text-red-500 flex-shrink-0">
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                                <input placeholder="+ Add" onKeyDown={(e) => {
                                  if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                                    dispatch({ type: "ADD_EVENT_QUESTION_TO_ASK", payload: { eventId: ev.id, question: (e.target as HTMLInputElement).value.trim() } });
                                    (e.target as HTMLInputElement).value = "";
                                  }
                                }} className="ml-3 text-xs text-gray-400 placeholder-gray-300 bg-transparent border-none focus:outline-none focus:text-gray-600 py-0.5" />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Add interview button */}
                    {addingInterviewForRole === role.id ? (
                      <div className="mt-3 rounded-lg border border-gray-200 p-3 space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <input type="date" value={newEvDate} onChange={(e) => setNewEvDate(e.target.value)}
                            className="rounded border border-gray-200 px-2 py-1.5 text-xs focus:border-indigo-400 focus:outline-none" />
                          <input type="time" value={newEvStart} onChange={(e) => setNewEvStart(e.target.value)}
                            className="rounded border border-gray-200 px-2 py-1.5 text-xs focus:border-indigo-400 focus:outline-none" />
                          <input type="time" value={newEvEnd} onChange={(e) => setNewEvEnd(e.target.value)}
                            className="rounded border border-gray-200 px-2 py-1.5 text-xs focus:border-indigo-400 focus:outline-none" />
                        </div>
                        <select value={newEvType} onChange={(e) => setNewEvType(e.target.value)}
                          className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs focus:border-indigo-400 focus:outline-none">
                          <option value="">Type...</option>
                          <option value="recruiter-screen">Recruiter Screen</option>
                          <option value="behavioral">Behavioral</option>
                          <option value="case">Case</option>
                          <option value="presentation">Presentation</option>
                          <option value="mixed">Mixed</option>
                        </select>
                        <div className="flex gap-2">
                          <button disabled={!newEvDate} onClick={() => {
                            dispatch({ type: "ADD_EVENT", payload: {
                              title: `${company.name} — ${role.title}`, date: newEvDate,
                              startTime: newEvStart, endTime: newEvEnd, category: "interview",
                              interviewType: (newEvType || null) as InterviewType | null,
                              interviewStage: null, companyId: company.id, companyName: company.name,
                              role: role.title, questionsAsked: [], questionsToAsk: [], notes: "",
                            }});
                            setNewEvDate(""); setNewEvStart(""); setNewEvEnd(""); setNewEvType("");
                            setAddingInterviewForRole(null);
                          }} className="rounded bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-700 disabled:opacity-50">Add</button>
                          <button onClick={() => setAddingInterviewForRole(null)} className="text-xs text-gray-500">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setAddingInterviewForRole(role.id)}
                        className="mt-2 text-xs text-indigo-500 hover:text-indigo-700">+ Add interview</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {archivedRoles.length > 0 && (
        <div className="mt-6">
          <p className="text-xs text-gray-400">{archivedRoles.length} archived {archivedRoles.length === 1 ? "role" : "roles"}</p>
        </div>
      )}
    </div>
  );
}
