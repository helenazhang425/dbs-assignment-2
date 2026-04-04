"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { InterviewType, CompanyRole, CompanyStatus } from "@/types";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

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
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);
  const [addingRole, setAddingRole] = useState(false);
  const [addRoleSearch, setAddRoleSearch] = useState("");
  const [roleHighlight, setRoleHighlight] = useState(-1);
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

  function syncRoleName(oldTitle: string, newTitle: string) {
    if (!newTitle || oldTitle.toLowerCase() === newTitle.toLowerCase()) return;
    // Sync to events
    state.events
      .filter((ev) => ev.companyName?.toLowerCase() === company!.name.toLowerCase() &&
        ev.role?.toLowerCase() === oldTitle.toLowerCase())
      .forEach((ev) => {
        dispatch({ type: "UPDATE_EVENT", payload: { id: ev.id, updates: { role: newTitle, title: `${company!.name} — ${newTitle}` } } });
      });
    // Sync to applications
    state.applications
      .filter((a) => a.company.toLowerCase() === company!.name.toLowerCase() &&
        a.role.toLowerCase() === oldTitle.toLowerCase())
      .forEach((a) => {
        dispatch({ type: "UPDATE_APPLICATION", payload: { id: a.id, updates: { role: newTitle } } });
      });
  }

  function changeRoleStatus(roleId: string, newStatus: CompanyStatus) {
    const role = company!.roles.find((r) => r.id === roleId);
    if (!role) return;
    updateRole(roleId, { status: newStatus });
    // Sync to matching applications
    const verdict = STATUS_TO_LABEL[newStatus];
    state.applications
      .filter((a) => a.company.toLowerCase() === company!.name.toLowerCase() &&
        a.role.toLowerCase() === role.title.toLowerCase())
      .forEach((a) => {
        dispatch({ type: "UPDATE_APPLICATION", payload: { id: a.id, updates: { verdict } } });
      });
  }

  function confirmDeleteRole() {
    if (!deleteRoleId) return;
    update({ roles: company!.roles.filter((r) => r.id !== deleteRoleId) });
    if (expandedRoleId === deleteRoleId) setExpandedRoleId(null);
    setDeleteRoleId(null);
  }

  function addRole() {
    const newRole: CompanyRole = { id: crypto.randomUUID(), title: "", whyRole: "", roleUrl: "", notes: "", status: "interviewing" };
    update({ roles: [...company!.roles, newRole] });
    setExpandedRoleId(newRole.id);
  }

  // Roles from applications that aren't already on this company card
  const suggestedRoles = useMemo(() => {
    const activeTitles = new Set(company!.roles.filter((r) => r.status !== "no-update" && r.status !== "saved").map((r) => r.title.toLowerCase()));
    return state.applications
      .filter((a) => a.company.toLowerCase() === company!.name.toLowerCase())
      .filter((a) => !activeTitles.has(a.role.toLowerCase()))
      .map((a) => ({ role: a.role, verdict: a.verdict }));
  }, [state.applications, company]);

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

  const COMPLETED_STATUSES: CompanyStatus[] = ["offer", "rejected-no-interview", "rejected-first-round", "rejected-complete", "no-opening", "withdrew"];
  const activeRoles = company.roles.filter((r) => !COMPLETED_STATUSES.includes(r.status));
  const archivedRoles = company.roles.filter((r) => COMPLETED_STATUSES.includes(r.status));

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
      </div>

      {/* Role grid cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {activeRoles.map((role) => {
          const events = getRoleEvents(role.title);
          const nextEv = events.find((ev) => new Date(ev.date + "T12:00:00") >= today);
          const isSelected = expandedRoleId === role.id;

          return (
            <div key={role.id} className="group/card relative">
              <div
                onClick={() => { setExpandedRoleId(isSelected ? null : role.id); setSelectedEventId(null); }}
                className={`h-full rounded-xl border p-5 cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected ? "border-indigo-300 bg-indigo-50/30 shadow-md" :
                  "border-gray-200 bg-white hover:shadow-md hover:-translate-y-0.5"
                }`}>
                <div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getVerdictClass(STATUS_TO_LABEL[role.status] ?? "No Update")}`}>
                    {STATUS_TO_LABEL[role.status] ?? role.status}
                  </span>
                  <h3 className="mt-2 font-semibold text-gray-900 text-sm">{role.title || "Untitled Role"}</h3>
                </div>
                <div className="text-xs text-gray-400 space-y-1">
                  {nextEv && (
                    <p className="text-indigo-500">
                      Next: {new Date(nextEv.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {nextEv.interviewType ? ` · ${nextEv.interviewType === "recruiter-screen" ? "Recruiter Screen" : nextEv.interviewType}` : ""}
                    </p>
                  )}
                  <p>{events.length} {events.length === 1 ? "round" : "rounds"}</p>
                </div>
              </div>
              {/* Delete button */}
              <button onClick={(e) => { e.stopPropagation(); setDeleteRoleId(role.id); }}
                className="absolute top-2 right-2 invisible group-hover/card:visible rounded-full p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
        {/* Add role card */}
        <div onClick={addRole}
          className="flex items-center justify-center rounded-xl border border-dashed border-gray-300 p-5 cursor-pointer text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors">
          <span className="text-sm">+ Add role</span>
        </div>
      </div>

      {/* Expanded role detail */}
      {expandedRoleId && (() => {
        const role = company.roles.find((r) => r.id === expandedRoleId);
        if (!role) return null;
        const events = getRoleEvents(role.title);
        return (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 space-y-4" style={{ animation: "slideUp 0.2s ease-out" }}>
            {/* Role title with suggestions */}
            <div className="relative">
              <input key={role.id} defaultValue={role.title}
                onFocus={(e) => { e.target.dataset.originalTitle = role.title; setAddRoleSearch(e.target.value); setRoleHighlight(-1); }}
                onChange={(e) => { setAddRoleSearch(e.target.value); setRoleHighlight(-1); }}
                onBlur={(e) => {
                  // Delay to allow suggestion click
                  setTimeout(() => {
                    const newTitle = e.target.value;
                    const oldTitle = e.target.dataset.originalTitle ?? role.title;
                    if (newTitle !== oldTitle) {
                      updateRole(role.id, { title: newTitle });
                      syncRoleName(oldTitle, newTitle);
                    }
                    setAddRoleSearch("");
                    setRoleHighlight(-1);
                  }, 150);
                }}
                onKeyDown={(e) => {
                  const matches = suggestedRoles.filter((s) => s.role.toLowerCase().includes(addRoleSearch.toLowerCase()));
                  if (e.key === "ArrowDown") { e.preventDefault(); setRoleHighlight((h) => Math.min(h + 1, matches.length - 1)); }
                  else if (e.key === "ArrowUp") { e.preventDefault(); setRoleHighlight((h) => Math.max(h - 1, 0)); }
                  else if (e.key === "Enter") {
                    e.preventDefault();
                    if (roleHighlight >= 0 && roleHighlight < matches.length) {
                      const s = matches[roleHighlight];
                      const oldTitle = (e.target as HTMLInputElement).dataset.originalTitle ?? role.title;
                      (e.target as HTMLInputElement).value = s.role;
                      updateRole(role.id, { title: s.role, status: LABEL_TO_STATUS[s.verdict] ?? role.status });
                      syncRoleName(oldTitle, s.role);
                      setAddRoleSearch("");
                      setRoleHighlight(-1);
                    } else {
                      (e.target as HTMLInputElement).blur();
                    }
                  }
                  else if (e.key === "Escape") { setAddRoleSearch(""); setRoleHighlight(-1); }
                }}
                placeholder="Role title"
                className="text-lg font-semibold text-gray-900 bg-transparent border-none focus:outline-none p-0 w-full rounded-md hover:bg-gray-50 focus:bg-white px-1 -mx-1 transition-colors cursor-text" />
              {addRoleSearch !== "" && (() => {
                const matches = suggestedRoles.filter((s) => s.role.toLowerCase().includes(addRoleSearch.toLowerCase()));
                return matches.length > 0 ? (
                <div className="absolute z-40 mt-1 left-0 right-0 rounded-lg border border-gray-200 bg-white shadow-lg p-1.5">
                  {matches.map((s, i) => (
                    <button key={s.role} onMouseDown={(e) => {
                      e.preventDefault();
                      const input = e.currentTarget.closest(".relative")?.querySelector("input") as HTMLInputElement;
                      if (input) {
                        const oldTitle = input.dataset.originalTitle ?? role.title;
                        input.value = s.role;
                        updateRole(role.id, { title: s.role, status: LABEL_TO_STATUS[s.verdict] ?? role.status });
                        syncRoleName(oldTitle, s.role);
                        setAddRoleSearch("");
                        setRoleHighlight(-1);
                      }
                    }}
                      onMouseEnter={() => setRoleHighlight(i)}
                      className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm ${roleHighlight === i ? "bg-indigo-50" : "hover:bg-gray-50"}`}>
                      <span className="text-gray-700">{s.role}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getVerdictClass(s.verdict)}`}>{s.verdict}</span>
                    </button>
                  ))}
                </div>
                ) : null;
              })()}
              <div className="flex items-center gap-1 mt-1">
                <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <input value={role.roleUrl} onChange={(e) => updateRole(role.id, { roleUrl: e.target.value })}
                  placeholder="Role URL" size={role.roleUrl ? role.roleUrl.length || 10 : 10}
                  className="text-xs text-indigo-500 placeholder-gray-300 bg-transparent border-none focus:outline-none" />
                {role.roleUrl && (
                  <a href={role.roleUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-indigo-500">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
              <StatusDropdown status={role.status} onChange={(s) => changeRoleStatus(role.id, s)} />
            </div>

            {/* Why this role */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Why this role?</label>
              <textarea value={role.whyRole} onChange={(e) => updateRole(role.id, { whyRole: e.target.value })}
                rows={2} placeholder="Why is this role a good fit for you?"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" />
            </div>

            {/* Notes */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Notes</label>
              <textarea value={role.notes ?? ""} onChange={(e) => updateRole(role.id, { notes: e.target.value })}
                rows={2} placeholder="Anything to remember about this role..."
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
                    {/* Add next interview — always at top of timeline (newest first) */}
                    <div className="relative pb-4 flex items-center">
                      <div className="absolute -left-3 h-2.5 w-2.5 rounded-full border-2 border-dashed border-indigo-300 bg-white" />
                      {addingInterviewForRole === role.id ? (
                        <div className="w-full rounded-lg border border-indigo-200 bg-indigo-50/30 px-3 py-2 space-y-2" style={{ animation: "slideIn 0.2s ease-out" }}>
                          <div className="grid grid-cols-3 gap-2">
                            <input type="date" value={newEvDate} onChange={(e) => setNewEvDate(e.target.value)}
                              className="rounded border border-gray-200 px-2 py-1.5 text-xs focus:border-indigo-400 focus:outline-none" />
                            <input type="time" value={newEvStart} onChange={(e) => setNewEvStart(e.target.value)}
                              className="rounded border border-gray-200 px-2 py-1.5 text-xs focus:border-indigo-400 focus:outline-none" />
                            <input type="time" value={newEvEnd} onChange={(e) => setNewEvEnd(e.target.value)}
                              className="rounded border border-gray-200 px-2 py-1.5 text-xs focus:border-indigo-400 focus:outline-none" />
                          </div>
                          <InterviewTypeDropdown value={(newEvType || null) as InterviewType | null} onChange={(v) => setNewEvType(v ?? "")} />
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
                        <div onClick={() => setAddingInterviewForRole(role.id)}
                          className="w-full rounded-lg border border-dashed border-indigo-200 px-3 py-2 text-xs text-indigo-500 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors">
                          + Add next interview
                        </div>
                      )}
                    </div>
                    {events.map((ev, idx) => {
                      const isPast = new Date(ev.date + "T12:00:00") < today;
                      const isSelected = selectedEventId === ev.id;
                      const isLastEvent = idx === events.length - 1;
                      return (
                        <div key={ev.id}>
                          <div className={`relative flex items-center ${isLastEvent ? "" : "pb-4"}`}>
                            <div className={`absolute -left-3 h-2.5 w-2.5 rounded-full border-2 ${
                              isSelected ? "border-indigo-500 bg-indigo-500" :
                              isPast ? "border-gray-400 bg-gray-400" : "border-indigo-300 bg-white"
                            }`} />
                            <div onClick={() => setSelectedEventId(isSelected ? null : ev.id)}
                              className={`w-full rounded-lg border px-3 py-2 text-xs cursor-pointer transition-all min-h-[3rem] flex flex-col justify-center ${
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
                                    ev.interviewType === "case" ? "bg-purple-50 text-purple-600" :
                                    ev.interviewType === "presentation" ? "bg-orange-50 text-orange-600" :
                                    ev.interviewType === "mixed" ? "bg-pink-50 text-pink-600" : "bg-gray-100 text-gray-500"
                                  }`}>{
                                    ev.interviewType === "recruiter-screen" ? "Recruiter Screen" :
                                    ev.interviewType === "behavioral" ? "Behavioral" :
                                    ev.interviewType === "case" ? "Case" :
                                    ev.interviewType === "presentation" ? "Presentation" :
                                    ev.interviewType === "mixed" ? "Mixed" :
                                    ev.interviewType === "other" ? "Other" : ev.interviewType
                                  }</span>
                                )}
                              </div>
                              <p className={`mt-0.5 ${isPast ? "text-gray-300" : "text-gray-400"}`}>{ev.startTime ? `${ev.startTime}${ev.endTime ? ` — ${ev.endTime}` : ""}` : "\u00A0"}</p>
                            </div>
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

                        {/* Editable date, time, type */}
                        <div className="mb-3 space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <input type="date" defaultValue={ev.date}
                              onBlur={(e) => dispatch({ type: "UPDATE_EVENT", payload: { id: ev.id, updates: { date: e.target.value } } })}
                              className="rounded border border-gray-200 px-2 py-1.5 text-xs focus:border-indigo-400 focus:outline-none" />
                            <input type="time" defaultValue={ev.startTime}
                              onBlur={(e) => dispatch({ type: "UPDATE_EVENT", payload: { id: ev.id, updates: { startTime: e.target.value } } })}
                              className="rounded border border-gray-200 px-2 py-1.5 text-xs focus:border-indigo-400 focus:outline-none" />
                            <input type="time" defaultValue={ev.endTime}
                              onBlur={(e) => dispatch({ type: "UPDATE_EVENT", payload: { id: ev.id, updates: { endTime: e.target.value } } })}
                              className="rounded border border-gray-200 px-2 py-1.5 text-xs focus:border-indigo-400 focus:outline-none" />
                          </div>
                          <InterviewTypeDropdown value={ev.interviewType} onChange={(v) => dispatch({ type: "UPDATE_EVENT", payload: { id: ev.id, updates: { interviewType: v } } })} />
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

                        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                          <button onClick={() => {
                            dispatch({ type: "DELETE_EVENT", payload: { id: ev.id } });
                            setSelectedEventId(null);
                          }} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Add interview — shown below timeline when no events exist */}
              {events.length === 0 && (
                addingInterviewForRole === role.id ? (
                  <div className="mt-2 rounded-lg border border-gray-200 p-3 space-y-2" style={{ animation: "slideIn 0.2s ease-out" }}>
                    <div className="grid grid-cols-3 gap-2">
                      <input type="date" value={newEvDate} onChange={(e) => setNewEvDate(e.target.value)}
                        className="rounded border border-gray-200 px-2 py-1.5 text-xs focus:border-indigo-400 focus:outline-none" />
                      <input type="time" value={newEvStart} onChange={(e) => setNewEvStart(e.target.value)}
                        className="rounded border border-gray-200 px-2 py-1.5 text-xs focus:border-indigo-400 focus:outline-none" />
                      <input type="time" value={newEvEnd} onChange={(e) => setNewEvEnd(e.target.value)}
                        className="rounded border border-gray-200 px-2 py-1.5 text-xs focus:border-indigo-400 focus:outline-none" />
                    </div>
                    <InterviewTypeDropdown value={(newEvType || null) as InterviewType | null} onChange={(v) => setNewEvType(v ?? "")} />
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
                )
              )}
            </div>
          </div>
        );
      })()}

      {archivedRoles.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-xs text-gray-400">{archivedRoles.length} archived {archivedRoles.length === 1 ? "role" : "roles"}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {archivedRoles.map((role) => {
              const events = getRoleEvents(role.title);
              const isSelected = expandedRoleId === role.id;
              return (
                <div key={role.id} className="group/card relative">
                  <div
                    onClick={() => { setExpandedRoleId(isSelected ? null : role.id); setSelectedEventId(null); }}
                    className={`h-full rounded-xl border p-5 cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected ? "border-indigo-300 bg-indigo-50/30 shadow-md" :
                      "border-gray-200 bg-gray-100 hover:shadow-sm"
                    }`}>
                    <div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getVerdictClass(STATUS_TO_LABEL[role.status] ?? "No Update")}`}>
                        {STATUS_TO_LABEL[role.status] ?? role.status}
                      </span>
                      <h3 className="mt-2 font-semibold text-gray-900 text-sm">{role.title || "Untitled Role"}</h3>
                    </div>
                    <div className="text-xs text-gray-400 space-y-1">
                      <p>{events.length} {events.length === 1 ? "round" : "rounds"}</p>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteRoleId(role.id); }}
                    className="absolute top-2 right-2 invisible group-hover/card:visible rounded-full p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete role confirmation */}
      <Modal open={!!deleteRoleId} onClose={() => setDeleteRoleId(null)} title="Delete role?">
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to delete <span className="font-medium text-gray-900">{company.roles.find((r) => r.id === deleteRoleId)?.title || "this role"}</span>? This will remove all associated data.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setDeleteRoleId(null)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={confirmDeleteRole}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">Delete</button>
        </div>
      </Modal>
    </div>
  );
}

const VERDICT_COLORS: Record<string, string> = {
  "no update": "bg-blue-50 text-blue-700",
  "in process": "bg-amber-100 text-amber-700",
  "rejected - no interview": "bg-red-50 text-red-600",
  "rejected - interviewed": "bg-red-100 text-red-700",
  "no opening": "bg-gray-100 text-gray-600",
  withdrew: "bg-purple-100 text-purple-700",
  offer: "bg-green-100 text-green-700",
};

const VERDICTS = ["No Update", "In Process", "Rejected - No Interview", "Rejected - Interviewed", "No Opening", "Withdrew", "Offer"];

function getVerdictClass(v: string) {
  return VERDICT_COLORS[v.toLowerCase()] ?? "bg-gray-100 text-gray-600";
}

const STATUS_TO_LABEL: Record<CompanyStatus, string> = {
  saved: "No Update", "no-update": "No Update", interviewing: "In Process",
  offer: "Offer", "rejected-no-interview": "Rejected - No Interview",
  "rejected-first-round": "Rejected - Interviewed", "rejected-complete": "Rejected - Interviewed",
  "no-opening": "No Opening", withdrew: "Withdrew",
};

const LABEL_TO_STATUS: Record<string, CompanyStatus> = {
  "No Update": "no-update", "In Process": "interviewing", "Offer": "offer",
  "Rejected - No Interview": "rejected-no-interview", "Rejected - Interviewed": "rejected-complete",
  "No Opening": "no-opening", "Withdrew": "withdrew",
};

function StatusDropdown({ status, onChange }: { status: CompanyStatus; onChange: (s: CompanyStatus) => void }) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const label = STATUS_TO_LABEL[status] ?? "No Update";

  useEffect(() => { if (open) setHighlighted(VERDICTS.indexOf(label)); }, [open]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) { if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(true); } return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, VERDICTS.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter" && highlighted >= 0) { e.preventDefault(); onChange(LABEL_TO_STATUS[VERDICTS[highlighted]] ?? "no-update"); setOpen(false); }
    else if (e.key === "Escape") { setOpen(false); }
  }

  return (
    <div className="relative mt-2">
      <button onClick={() => setOpen(!open)} onKeyDown={handleKeyDown}
        className={`flex items-center gap-1.5 rounded-2xl px-2.5 py-0.5 text-xs font-medium cursor-pointer ${getVerdictClass(label)}`}>
        <span>{label}</span>
        <svg className="h-3 w-3 opacity-50 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (<>
        <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
        <div className="absolute z-40 mt-1 left-0 w-56 rounded-lg border border-gray-200 bg-white shadow-lg p-1.5" onKeyDown={handleKeyDown}>
          {VERDICTS.map((v, i) => (
            <button key={v} onClick={() => { onChange(LABEL_TO_STATUS[v] ?? "no-update"); setOpen(false); }}
              onMouseEnter={() => setHighlighted(i)}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs ${highlighted === i ? "bg-indigo-50" : label === v ? "bg-gray-50" : "hover:bg-gray-50"}`}>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getVerdictClass(v)}`}>{v}</span>
            </button>
          ))}
        </div>
      </>)}
    </div>
  );
}

const INTERVIEW_TYPES: { value: InterviewType; label: string; cls: string }[] = [
  { value: "recruiter-screen", label: "Recruiter Screen", cls: "bg-teal-50 text-teal-700" },
  { value: "behavioral", label: "Behavioral", cls: "bg-blue-50 text-blue-600" },
  { value: "case", label: "Case", cls: "bg-purple-50 text-purple-600" },
  { value: "presentation", label: "Presentation", cls: "bg-orange-50 text-orange-600" },
  { value: "mixed", label: "Mixed", cls: "bg-pink-50 text-pink-600" },
  { value: "other", label: "Other", cls: "bg-gray-100 text-gray-500" },
];

function InterviewTypeDropdown({ value, onChange }: { value: InterviewType | null; onChange: (v: InterviewType | null) => void }) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const current = INTERVIEW_TYPES.find((t) => t.value === value);
  // Options: None + all types
  const allOptions = [{ value: null as InterviewType | null, label: "None", cls: "bg-gray-100 text-gray-400" }, ...INTERVIEW_TYPES.map((t) => ({ ...t, value: t.value as InterviewType | null }))];

  useEffect(() => { if (open) setHighlighted(allOptions.findIndex((o) => o.value === value)); }, [open]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) { if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(true); } return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, allOptions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter" && highlighted >= 0) { e.preventDefault(); onChange(allOptions[highlighted].value); setOpen(false); }
    else if (e.key === "Escape") { setOpen(false); }
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} onKeyDown={handleKeyDown}
        className={`flex items-center gap-1.5 rounded-2xl px-2.5 py-0.5 text-xs font-medium cursor-pointer ${current ? current.cls : "bg-gray-100 text-gray-400"}`}>
        <span>{current ? current.label : "Type..."}</span>
        <svg className="h-3 w-3 opacity-50 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (<>
        <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
        <div className="absolute z-40 mt-1 left-0 w-52 rounded-lg border border-gray-200 bg-white shadow-lg p-1.5" onKeyDown={handleKeyDown}>
          {allOptions.map((opt, i) => (
            <button key={opt.label} onClick={() => { onChange(opt.value); setOpen(false); }}
              onMouseEnter={() => setHighlighted(i)}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs ${highlighted === i ? "bg-indigo-50" : value === opt.value ? "bg-gray-50" : "hover:bg-gray-50"}`}>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${opt.cls}`}>{opt.label}</span>
            </button>
          ))}
        </div>
      </>)}
    </div>
  );
}
