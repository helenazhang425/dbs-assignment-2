"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useApp } from "@/context/AppContext";
import { CompanyStatus } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  "in process": "bg-amber-100 text-amber-700",
  "no-update": "bg-blue-50 text-blue-700",
  interviewing: "bg-indigo-100 text-indigo-700",
  saved: "bg-gray-100 text-gray-600",
  offer: "bg-green-100 text-green-700",
  "rejected-no-interview": "bg-red-50 text-red-600",
  "rejected-first-round": "bg-red-50 text-red-600",
  "rejected-complete": "bg-red-100 text-red-700",
  "no-opening": "bg-gray-100 text-gray-500",
  withdrew: "bg-purple-50 text-purple-600",
};

const COMPLETED_STATUSES: CompanyStatus[] = [
  "offer", "rejected-no-interview", "rejected-first-round", "rejected-complete", "no-opening", "withdrew",
];

const NON_ACTIVE_STATUSES: CompanyStatus[] = [
  ...COMPLETED_STATUSES, "saved", "no-update",
];

function isCompanyArchived(roles: { status: CompanyStatus }[]): boolean {
  if (roles.length === 0) return false;
  return roles.every((r) => NON_ACTIVE_STATUSES.includes(r.status))
    && roles.some((r) => COMPLETED_STATUSES.includes(r.status));
}

export default function CompanyList() {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState("");
  const [addSearch, setAddSearch] = useState("");
  const [archivedSearch, setArchivedSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedActive, setSelectedActive] = useState<Set<string>>(new Set());
  const [selectedArchived, setSelectedArchived] = useState<Set<string>>(new Set());

  const inProcessApps = useMemo(() => {
    const companyNames = new Set(state.companies.map((c) => c.name.toLowerCase()));
    return state.applications
      .filter((a) => a.verdict.toLowerCase() === "in process")
      .filter((a) => !companyNames.has(a.company.toLowerCase()));
  }, [state.applications, state.companies]);

  const suggestions = useMemo(() => {
    const map = new Map<string, { company: string; roles: string[] }>();
    inProcessApps.forEach((a) => {
      if (!map.has(a.company)) map.set(a.company, { company: a.company, roles: [] });
      map.get(a.company)!.roles.push(a.role);
    });
    return Array.from(map.values());
  }, [inProcessApps]);

  const activeCompanies = useMemo(() =>
    state.companies.filter((c) => !isCompanyArchived(c.roles)),
  [state.companies]);

  const archivedCompanies = useMemo(() =>
    state.companies.filter((c) => isCompanyArchived(c.roles)),
  [state.companies]);

  const today = new Date(new Date().toDateString());

  function getNextEventDate(companyName: string): number {
    const upcoming = state.events
      .filter((ev) => ev.companyName?.toLowerCase() === companyName.toLowerCase() && new Date(ev.date + "T12:00:00") >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return upcoming.length > 0 ? new Date(upcoming[0].date).getTime() : Infinity;
  }

  const filtered = useMemo(() => {
    let result = activeCompanies;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        c.name.toLowerCase().includes(q) || c.roles.some((r) => r.title.toLowerCase().includes(q))
      );
    }
    return [...result].sort((a, b) => {
      const aNext = getNextEventDate(a.name);
      const bNext = getNextEventDate(b.name);
      if (aNext !== bNext) return aNext - bNext;
      return b.createdAt - a.createdAt;
    });
  }, [activeCompanies, search, state.events]);

  const filteredArchived = useMemo(() => {
    if (!archivedSearch) return archivedCompanies;
    const q = archivedSearch.toLowerCase();
    return archivedCompanies.filter((c) =>
      c.name.toLowerCase().includes(q) || c.roles.some((r) => r.title.toLowerCase().includes(q))
    );
  }, [archivedCompanies, archivedSearch]);

  const addMatches = useMemo(() => {
    if (!addSearch) return [];
    const q = addSearch.toLowerCase();
    const existing = new Set(state.companies.map((c) => c.name.toLowerCase()));
    return Array.from(new Set(state.applications.map((a) => a.company)))
      .filter((c) => c.toLowerCase().includes(q) && !existing.has(c.toLowerCase()))
      .slice(0, 6);
  }, [addSearch, state.applications, state.companies]);

  function quickAdd(company: string, roles: string[]) {
    dispatch({
      type: "ADD_COMPANY",
      payload: {
        name: company,
        roles: roles.map((r) => ({
          id: crypto.randomUUID(),
          title: r,
          whyRole: "",
          roleUrl: "",
          notes: "",
          status: "interviewing" as const,
        })),
        companyUrl: "",
        whyCompany: "",
        notes: "",
      },
    });
  }

  function archiveCompany(companyId: string) {
    const company = state.companies.find((c) => c.id === companyId);
    if (!company) return;
    dispatch({
      type: "UPDATE_COMPANY",
      payload: {
        id: companyId,
        updates: {
          roles: company.roles.map((r) =>
            NON_ACTIVE_STATUSES.includes(r.status) ? r : { ...r, status: "withdrew" as CompanyStatus }
          ),
        },
      },
    });
  }

  function unarchiveCompany(companyId: string) {
    const company = state.companies.find((c) => c.id === companyId);
    if (!company) return;
    dispatch({
      type: "UPDATE_COMPANY",
      payload: {
        id: companyId,
        updates: {
          roles: company.roles.map((r) => ({ ...r, status: "interviewing" as CompanyStatus })),
        },
      },
    });
  }

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === "active" && destination.droppableId === "archived") {
      setShowArchived(true);
      archiveCompany(draggableId);
    } else if (source.droppableId === "archived" && destination.droppableId === "active") {
      unarchiveCompany(draggableId);
    }
  }

  function toggleActive(id: string) {
    setSelectedActive((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }

  function toggleArchived(id: string) {
    setSelectedArchived((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }

  function bulkArchive() {
    selectedActive.forEach((id) => archiveCompany(id));
    setSelectedActive(new Set());
    setShowArchived(true);
  }

  function bulkDelete() {
    selectedArchived.forEach((id) => dispatch({ type: "DELETE_COMPANY", payload: { id } }));
    setSelectedArchived(new Set());
  }

  function renderCompanyCard(c: typeof state.companies[0], isArchived = false) {
    const upcoming = state.events.filter(
      (ev) => ev.companyName?.toLowerCase() === c.name.toLowerCase() && new Date(ev.date + "T12:00:00") >= today
    );
    const isSelected = isArchived ? selectedArchived.has(c.id) : selectedActive.has(c.id);
    return (
      <>
        <div className="absolute top-3 left-3 z-10">
          <input type="checkbox" checked={isSelected}
            onChange={(e) => { e.stopPropagation(); isArchived ? toggleArchived(c.id) : toggleActive(c.id); }}
            className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
        </div>
        <Link href={`/companies/${c.id}`}>
          <div className={`h-full rounded-xl border p-5 pl-9 transition-all cursor-pointer ${
            isSelected ? "ring-1 ring-indigo-300 bg-indigo-50/30" :
            isArchived
              ? "border-gray-200 bg-gray-50 hover:shadow-sm"
              : "border-gray-200 bg-white hover:shadow-md hover:-translate-y-0.5"
          }`}>
            <h3 className={`font-semibold ${isArchived ? "text-gray-500" : "text-gray-900"}`}>{c.name}</h3>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {c.roles.filter((r) => r.status !== "no-update" && r.status !== "saved").map((r) => {
                const roleEvents = state.events.filter((ev) =>
                  ev.companyName?.toLowerCase() === c.name.toLowerCase() &&
                  ev.role?.toLowerCase() === r.title.toLowerCase()
                );
                const pastCount = roleEvents.filter((ev) => new Date(ev.date + "T12:00:00") < today).length;
                const futureCount = roleEvents.filter((ev) => new Date(ev.date + "T12:00:00") >= today).length;
                return (
                  <span key={r.id} className="flex items-center gap-1">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[r.status?.toLowerCase()] ?? "bg-gray-100 text-gray-600"}`}>
                      {r.title}
                    </span>
                    {(pastCount > 0 || futureCount > 0) && (
                      <span className="flex gap-0.5">
                        {Array.from({ length: pastCount }).map((_, i) => (
                          <span key={`p${i}`} className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                        ))}
                        {Array.from({ length: futureCount }).map((_, i) => (
                          <span key={`f${i}`} className="h-1.5 w-1.5 rounded-full border border-indigo-300 bg-white" />
                        ))}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
            {!isArchived && upcoming.length > 0 && (() => {
              const next = upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
              const typeLabel = next.interviewType === "recruiter-screen" ? "Recruiter Screen" :
                next.interviewType === "behavioral" ? "Behavioral" :
                next.interviewType === "case" ? "Case" :
                next.interviewType === "presentation" ? "Presentation" :
                next.interviewType === "mixed" ? "Mixed" : next.interviewType;
              return (
                <p className="mt-2 text-xs text-indigo-500">
                  Next: {new Date(next.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  {typeLabel ? ` · ${typeLabel}` : ""}
                </p>
              );
            })()}
            {c.whyCompany && <p className="mt-2 text-xs text-gray-400 line-clamp-2">{c.whyCompany}</p>}
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-400">
              {(() => { const visibleRoles = c.roles.filter((r) => r.status !== "no-update" && r.status !== "saved").length; return <span>{visibleRoles} {visibleRoles === 1 ? "role" : "roles"}</span>; })()}
            </div>
          </div>
        </Link>
        {isArchived ? (
          <button onClick={(e) => { e.preventDefault(); unarchiveCompany(c.id); }}
            className="absolute top-3 right-3 invisible group-hover:visible rounded-full bg-white border border-gray-200 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 shadow-sm transition-colors">
            Restore
          </button>
        ) : (
          <button onClick={(e) => { e.preventDefault(); archiveCompany(c.id); }}
            className="absolute top-3 right-3 invisible group-hover:visible rounded-full bg-white border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50 shadow-sm transition-colors">
            Archive
          </button>
        )}
      </>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
        <p className="mt-1 text-sm text-gray-500">
          {activeCompanies.length} active{archivedCompanies.length > 0 ? ` · ${archivedCompanies.length} archived` : ""}
        </p>
      </div>

      {suggestions.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            {suggestions.length} {suggestions.length === 1 ? "company" : "companies"} in process — add to start prepping?
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button key={s.company} onClick={() => quickAdd(s.company, s.roles)}
                className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors">
                + {s.company} ({s.roles.length} {s.roles.length === 1 ? "role" : "roles"})
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search companies..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>

      {selectedActive.size > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-indigo-50 px-4 py-2" style={{ animation: "slideDown 0.2s ease" }}>
          <span className="text-sm text-indigo-700">{selectedActive.size} selected</span>
          <button onClick={bulkArchive} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Archive</button>
          <button onClick={() => setSelectedActive(new Set())} className="ml-auto text-xs text-gray-500 hover:text-gray-700">Clear</button>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="active" direction="horizontal">
          {(provided, snapshot) => (
            <div ref={provided.innerRef} {...provided.droppableProps}
              className={`grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 min-h-[80px] rounded-xl p-1 transition-colors ${snapshot.isDraggingOver ? "bg-indigo-50/50 ring-1 ring-indigo-200" : ""}`}>
              {filtered.map((c, index) => (
                <Draggable key={c.id} draggableId={c.id} index={index}>
                  {(dragProvided, dragSnapshot) => (
                    <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps}
                      className={`relative group ${dragSnapshot.isDragging ? "opacity-80 shadow-xl rotate-1" : ""}`}>
                      {renderCompanyCard(c)}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        {filtered.length === 0 && activeCompanies.length > 0 && (
          <div className="py-12 text-center text-sm text-gray-400">No companies match your search.</div>
        )}

        <div className="mt-6 relative">
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-3 hover:border-gray-400 transition-colors">
            <span className="text-gray-300 text-sm">+</span>
            <input value={addSearch} onChange={(e) => setAddSearch(e.target.value)}
              placeholder="Add a company..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && addSearch.trim()) {
                  quickAdd(addSearch.trim(), []);
                  setAddSearch("");
                }
              }}
              className="flex-1 text-sm text-gray-500 placeholder-gray-300 bg-transparent border-none focus:outline-none focus:text-gray-700" />
          </div>
          {addSearch && addMatches.length > 0 && (<>
            <div className="fixed inset-0 z-30" onClick={() => setAddSearch("")} />
            <div className="absolute z-40 mt-1 left-0 right-0 rounded-lg border border-gray-200 bg-white shadow-lg max-h-48 overflow-y-auto">
              {addMatches.map((company) => {
                const roles = state.applications.filter((a) => a.company === company && a.verdict.toLowerCase() === "in process").map((a) => a.role);
                return (
                  <button key={company} onClick={() => { quickAdd(company, roles); setAddSearch(""); }}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-indigo-50">
                    <span className="font-medium">{company}</span>
                    <span className="ml-2 text-xs text-gray-400">{roles.length} {roles.length === 1 ? "role" : "roles"}</span>
                  </button>
                );
              })}
            </div>
          </>)}
        </div>

        {state.companies.length === 0 && !search && (
          <div className="py-8 text-center text-sm text-gray-400">No companies yet. Add one above or use the suggestions.</div>
        )}

        {/* Archived companies */}
        <div className="mt-8">
          <button onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
            <svg className={`h-3.5 w-3.5 transition-transform ${showArchived ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Archived ({archivedCompanies.length})
          </button>
          <Droppable droppableId="archived" direction="horizontal">
            {(provided, snapshot) => (
              <div ref={provided.innerRef} {...provided.droppableProps}
                className={`mt-3 min-h-[60px] rounded-xl p-1 transition-colors ${snapshot.isDraggingOver ? "bg-red-50/50 ring-1 ring-red-200" : ""} ${!showArchived && !snapshot.isDraggingOver ? "opacity-0 h-0 min-h-0 overflow-hidden" : ""}`}>
                {(showArchived || snapshot.isDraggingOver) && (
                  <>
                    {showArchived && (
                      <>
                        <input type="text" value={archivedSearch} onChange={(e) => setArchivedSearch(e.target.value)}
                          placeholder="Search archived companies..."
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-3" />
                        {selectedArchived.size > 0 && (
                          <div className="mb-3 flex items-center gap-3 rounded-lg bg-red-50 px-4 py-2" style={{ animation: "slideDown 0.2s ease" }}>
                            <span className="text-sm text-red-700">{selectedArchived.size} selected</span>
                            <button onClick={() => { selectedArchived.forEach((id) => unarchiveCompany(id)); setSelectedArchived(new Set()); }}
                              className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Restore</button>
                            <button onClick={bulkDelete} className="text-xs font-medium text-red-500 hover:text-red-700">Delete</button>
                            <button onClick={() => setSelectedArchived(new Set())} className="ml-auto text-xs text-gray-500 hover:text-gray-700">Clear</button>
                          </div>
                        )}
                      </>
                    )}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredArchived.map((c, index) => (
                        <Draggable key={c.id} draggableId={c.id} index={index}>
                          {(dragProvided, dragSnapshot) => (
                            <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps}
                              className={`relative group ${dragSnapshot.isDragging ? "opacity-80 shadow-xl -rotate-1" : ""}`}>
                              {renderCompanyCard(c, true)}
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </div>
                    {showArchived && filteredArchived.length === 0 && !snapshot.isDraggingOver && (
                      <div className="py-6 text-center text-sm text-gray-400">
                        {archivedCompanies.length === 0 ? "Drag a company here to archive it." : "No archived companies match your search."}
                      </div>
                    )}
                  </>
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>
    </div>
  );
}
