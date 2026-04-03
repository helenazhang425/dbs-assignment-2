"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import Button from "@/components/ui/Button";

type Tab = "applied" | "saved";
type SortKey = "company" | "role" | "appliedDate" | "method" | "location" | "verdict";
type SortDir = "asc" | "desc" | "none";

const VERDICT_COLORS: Record<string, string> = {
  "no update": "bg-blue-50 text-blue-700",
  "in process": "bg-amber-100 text-amber-700",
  "rejected without interview": "bg-red-50 text-red-600",
  "rejected - interviewed": "bg-red-100 text-red-700",
  "no opening": "bg-gray-100 text-gray-600",
  withdrew: "bg-purple-100 text-purple-700",
  offer: "bg-green-100 text-green-700",
};

function getVerdictClass(verdict: string) {
  return VERDICT_COLORS[verdict.toLowerCase()] ?? "bg-gray-100 text-gray-600";
}

const VERDICTS = [
  "No Update",
  "In Process",
  "Rejected without Interview",
  "Rejected - interviewed",
  "No Opening",
  "Withdrew",
  "Offer",
];

export default function ApplicationsPage() {
  const { state, dispatch } = useApp();
  const [tab, setTab] = useState<Tab>("applied");
  const [search, setSearch] = useState("");
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("appliedDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [visibleCount, setVisibleCount] = useState(15);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkVerdict, setBulkVerdict] = useState("No Update");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingSavedCell, setEditingSavedCell] = useState<{ id: string; field: string } | null>(null);
  const [editSavedValue, setEditSavedValue] = useState("");

  // New application row
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newMethod, setNewMethod] = useState("Company website");
  const [newLocation, setNewLocation] = useState("");
  const [newVerdict, setNewVerdict] = useState("No Update");

  // New saved position
  const [newSavedCompany, setNewSavedCompany] = useState("");
  const [newSavedRole, setNewSavedRole] = useState("");
  const [newSavedDeadline, setNewSavedDeadline] = useState("");
  const [newSavedMethod, setNewSavedMethod] = useState("");
  const [savedSearch, setSavedSearch] = useState("");
  const [savedColumnFilters, setSavedColumnFilters] = useState<Record<string, string>>({});
  const [savedActiveFilter, setSavedActiveFilter] = useState<string | null>(null);
  const [savedFilterSearch, setSavedFilterSearch] = useState("");
  const [savedSortKey, setSavedSortKey] = useState<string>("");
  const [savedSortDir, setSavedSortDir] = useState<SortDir>("none");
  const [newSavedUrl, setNewSavedUrl] = useState("");
  const [newSavedNotes, setNewSavedNotes] = useState("");
  const [showAddSaved, setShowAddSaved] = useState(false);

  const uniqueVerdicts = useMemo(() => {
    const set = new Set(state.applications.map((a) => a.verdict));
    return Array.from(set).sort();
  }, [state.applications]);

  const filtered = useMemo(() => {
    let result = state.applications;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((a) => a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q));
    }
    // Apply column filters
    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value) {
        result = result.filter((a) => (a as unknown as Record<string, string>)[key]?.toLowerCase() === value.toLowerCase());
      }
    });
    if (sortDir !== "none") {
      result = [...result].sort((a, b) => {
        const aVal = a[sortKey] ?? "";
        const bVal = b[sortKey] ?? "";
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return result;
  }, [state.applications, search, columnFilters, sortKey, sortDir]);

  const displayedApps = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  const filteredSaved = useMemo(() => {
    let result = state.savedPositions;
    if (savedSearch) {
      const q = savedSearch.toLowerCase();
      result = result.filter((p) => p.company.toLowerCase().includes(q) || p.role.toLowerCase().includes(q));
    }
    Object.entries(savedColumnFilters).forEach(([key, value]) => {
      if (value) {
        result = result.filter((p) => (p as unknown as Record<string, string>)[key]?.toLowerCase() === value.toLowerCase());
      }
    });
    if (savedSortDir !== "none" && savedSortKey) {
      result = [...result].sort((a, b) => {
        const aVal = (a as unknown as Record<string, string>)[savedSortKey] ?? "";
        const bVal = (b as unknown as Record<string, string>)[savedSortKey] ?? "";
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return savedSortDir === "asc" ? cmp : -cmp;
      });
    }
    return result;
  }, [state.savedPositions, savedSearch, savedColumnFilters, savedSortKey, savedSortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      if (sortDir === "asc") setSortDir("desc");
      else if (sortDir === "desc") setSortDir("none");
      else setSortDir("asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function startEdit(id: string, field: string, currentValue: string) {
    setEditingCell({ id, field });
    setEditValue(currentValue);
  }

  function saveEdit() {
    if (!editingCell) return;
    dispatch({ type: "UPDATE_APPLICATION", payload: { id: editingCell.id, updates: { [editingCell.field]: editValue } } });
    setEditingCell(null);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") setEditingCell(null);
  }

  function handleAddRow(e: React.FormEvent) {
    e.preventDefault();
    if (!newCompany.trim()) return;
    dispatch({
      type: "ADD_APPLICATION",
      payload: { company: newCompany.trim(), role: newRole.trim(), appliedDate: newDate, method: newMethod, location: newLocation.trim(), verdict: newVerdict, notes: "", spokeTo: "" },
    });
    setNewCompany(""); setNewRole(""); setNewDate(""); setNewMethod("Company website"); setNewLocation(""); setNewVerdict("No Update");
  }

  function handleAddSaved(e: React.FormEvent) {
    e.preventDefault();
    if (!newSavedCompany.trim()) return;
    dispatch({
      type: "ADD_SAVED_POSITION",
      payload: { company: newSavedCompany.trim(), role: newSavedRole.trim(), method: newSavedMethod.trim(), url: newSavedUrl.trim(), notes: newSavedNotes.trim(), deadline: newSavedDeadline },
    });
    setNewSavedCompany(""); setNewSavedRole(""); setNewSavedDeadline(""); setNewSavedNotes(""); setShowAddSaved(false);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((a) => a.id)));
    }
  }

  function applyBulkVerdict() {
    selectedIds.forEach((id) => {
      dispatch({ type: "UPDATE_APPLICATION", payload: { id, updates: { verdict: bulkVerdict } } });
    });
    setSelectedIds(new Set());
  }

  function handleExport() {
    const headers = ["Company", "Role", "Applied Date", "Method", "Location", "Verdict", "Notes", "Spoke To"];
    const rows = state.applications.map((a) =>
      [a.company, a.role, a.appliedDate, a.method, a.location, a.verdict, a.notes, a.spokeTo]
        .map((v) => `"${(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "applications.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key || sortDir === "none") return null;
    return <span className="text-indigo-500 ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const columns: { key: SortKey; label: string; width: string }[] = [
    { key: "company", label: "Company", width: "w-40" },
    { key: "role", label: "Role", width: "w-52" },
    { key: "appliedDate", label: "Applied", width: "w-28" },
    { key: "method", label: "Method", width: "w-32" },
    { key: "verdict", label: "Verdict", width: "w-44" },
  ];

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="mt-1 text-sm text-gray-500">
            {state.applications.length} applied · {state.savedPositions.length} saved
          </p>
        </div>
        <Button variant="secondary" onClick={handleExport}>Export CSV</Button>
      </div>

      {/* Summary donut */}
      <ApplicationDonut applications={state.applications} />

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setTab("applied")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "applied" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Applied ({state.applications.length})
        </button>
        <button
          onClick={() => setTab("saved")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "saved" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          To Apply ({state.savedPositions.length})
        </button>
      </div>

      {tab === "applied" && (
        <>
          {/* Search + Filter + Bulk */}
          <div className="mb-4 flex gap-3 flex-wrap">
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company or role..."
              className="flex-1 min-w-48 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          {/* Active filters display */}
          {Object.entries(columnFilters).filter(([, v]) => v).length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-400">Filters:</span>
              {Object.entries(columnFilters).filter(([, v]) => v).map(([key, value]) => (
                <button key={key} onClick={() => setColumnFilters((prev) => ({ ...prev, [key]: "" }))}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${key === "verdict" ? getVerdictClass(value) : "bg-gray-100 text-gray-600"}`}>
                  {value}
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ))}
              <button onClick={() => setColumnFilters({})} className="text-xs text-gray-400 hover:text-gray-600">Clear all</button>
            </div>
          )}

          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <div className="mb-3 flex items-center gap-3 rounded-lg bg-indigo-50 px-4 py-2">
              <span className="text-sm text-indigo-700">{selectedIds.size} selected</span>
              <select value={bulkVerdict} onChange={(e) => setBulkVerdict(e.target.value)}
                className="rounded border border-indigo-200 px-2 py-1 text-xs focus:outline-none">
                {VERDICTS.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              <button onClick={applyBulkVerdict} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
                Apply verdict
              </button>
              <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-xs text-gray-500 hover:text-gray-700">
                Clear
              </button>
            </div>
          )}

          <p className="mb-2 text-xs text-gray-400">{displayedApps.length} of {filtered.length} shown</p>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-10 px-3 py-3">
                    <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  </th>
                  {columns.map((col) => (
                    <th key={col.key}
                      className={`${col.width} select-none px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 relative`}>
                      <div className="flex items-center gap-1">
                        <span className="cursor-pointer hover:text-gray-700" onClick={() => handleSort(col.key)}>
                          {col.label}{sortIcon(col.key)}
                        </span>
                        <button onClick={(e) => { e.stopPropagation(); setActiveFilter(activeFilter === col.key ? null : col.key); }}
                          className={`ml-auto p-0.5 rounded hover:bg-gray-200 ${columnFilters[col.key] ? "text-indigo-500" : "text-gray-300 hover:text-gray-500"}`}>
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                        </button>
                      </div>
                      {activeFilter === col.key && (() => {
                        const allValues = Array.from(new Set(state.applications.map((a) => (a as unknown as Record<string, string>)[col.key]).filter(Boolean)))
                          .sort(col.key === "appliedDate" ? (a, b) => b.localeCompare(a) : undefined);
                        const fq = filterSearch.toLowerCase();
                        const filteredValues = fq ? allValues.filter((v) => v.toLowerCase().includes(fq)) : allValues;
                        return (<>
                        <div className="fixed inset-0 z-30" onClick={() => { setActiveFilter(null); setFilterSearch(""); }} />
                        <div className="absolute z-40 mt-1 left-0 w-52 rounded-lg border border-gray-200 bg-white shadow-lg">
                          <div className="p-1.5">
                            <input value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} autoFocus
                              placeholder="Search..."
                              className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none" />
                          </div>
                          <div className="max-h-48 overflow-y-auto px-1 pb-1">
                            {filteredValues.map((val) => (
                              <button key={val} onClick={() => {
                                const newVal = columnFilters[col.key] === val ? "" : val;
                                setColumnFilters((prev) => ({ ...prev, [col.key]: newVal }));
                                setActiveFilter(null); setFilterSearch("");
                              }}
                                className={`block w-full px-2 py-1.5 text-left text-xs rounded hover:bg-gray-50 ${
                                  col.key === "verdict" ? getVerdictClass(val) : columnFilters[col.key] === val ? "text-indigo-600 font-medium" : "text-gray-600"
                                }`}>
                                {col.key === "verdict" ? (
                                  <span className={`inline-flex rounded-full px-2 py-0.5 ${getVerdictClass(val)}`}>{val}</span>
                                ) : val}
                              </button>
                            ))}
                          </div>
                        </div></>);
                      })()}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 w-48">Notes</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* Inline add row */}
                <tr className="hover:bg-gray-50">
                  <td className="px-3 py-2.5" />
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-300 text-sm">+</span>
                      <input value={newCompany} onChange={(e) => setNewCompany(e.target.value)}
                        placeholder="Add application..."
                        onKeyDown={(e) => { if (e.key === "Enter" && newCompany.trim()) { e.preventDefault(); handleAddRow(e as unknown as React.FormEvent); } }}
                        className="w-full text-sm text-gray-500 placeholder-gray-300 bg-transparent border-none focus:outline-none focus:text-gray-700" />
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    {newCompany && <input value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="Role"
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddRow(e as unknown as React.FormEvent); } }}
                      className="w-full text-sm text-gray-400 placeholder-gray-300 bg-transparent border-none focus:outline-none focus:text-gray-600" />}
                  </td>
                  <td className="px-4 py-2.5">
                    {newCompany && <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                      className="text-sm text-gray-400 bg-transparent border-none focus:outline-none focus:text-gray-600" />}
                  </td>
                  <td className="px-4 py-2.5">
                    {newCompany && <input value={newMethod} onChange={(e) => setNewMethod(e.target.value)} placeholder="Method"
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddRow(e as unknown as React.FormEvent); } }}
                      className="w-full text-sm text-gray-400 placeholder-gray-300 bg-transparent border-none focus:outline-none focus:text-gray-600" />}
                  </td>
                  <td className="px-4 py-2.5 relative">
                    {newCompany && (
                      <VerdictDropdown value={newVerdict} onChange={setNewVerdict} />
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {newCompany && <button type="button" onClick={() => handleAddRow({ preventDefault: () => {} } as React.FormEvent)}
                      className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">Add</button>}
                  </td>
                  <td />
                </tr>
                {displayedApps.map((app) => (
                  <tr key={app.id} className={`group hover:bg-gray-50 ${selectedIds.has(app.id) ? "bg-indigo-50/50" : ""}`}>
                    <td className="px-3 py-2.5">
                      <input type="checkbox" checked={selectedIds.has(app.id)} onChange={() => toggleSelect(app.id)}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    </td>
                    <td className="px-4 py-2.5">
                      {editingCell?.id === app.id && editingCell.field === "company" ? (
                        <input value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={handleKeyDown} autoFocus
                          className="w-full rounded border border-indigo-300 px-1.5 py-0.5 text-sm focus:outline-none" />
                      ) : (
                        <span onClick={() => startEdit(app.id, "company", app.company)} className="cursor-pointer text-gray-900 font-medium">{app.company}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {editingCell?.id === app.id && editingCell.field === "role" ? (
                        <input value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={handleKeyDown} autoFocus
                          className="w-full rounded border border-indigo-300 px-1.5 py-0.5 text-sm focus:outline-none" />
                      ) : (
                        <span onClick={() => startEdit(app.id, "role", app.role)} className="cursor-pointer text-gray-600">{app.role}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">
                      {editingCell?.id === app.id && editingCell.field === "appliedDate" ? (
                        <input type="date" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={handleKeyDown} autoFocus
                          className="rounded border border-indigo-300 px-1.5 py-0.5 text-sm focus:outline-none" />
                      ) : (
                        <span onClick={() => startEdit(app.id, "appliedDate", app.appliedDate)} className="cursor-pointer">
                          {app.appliedDate
                            ? app.appliedDate.length === 4
                              ? app.appliedDate
                              : new Date(app.appliedDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })
                            : "—"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">
                      {editingCell?.id === app.id && editingCell.field === "method" ? (
                        <input value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={handleKeyDown} autoFocus
                          className="w-full rounded border border-indigo-300 px-1.5 py-0.5 text-sm focus:outline-none" />
                      ) : (
                        <span onClick={() => startEdit(app.id, "method", app.method)} className="cursor-pointer">{app.method || "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 relative">
                      <VerdictDropdown value={app.verdict} onChange={(v) => {
                        dispatch({ type: "UPDATE_APPLICATION", payload: { id: app.id, updates: { verdict: v } } });
                      }} />
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">
                      {editingCell?.id === app.id && editingCell.field === "notes" ? (
                        <input value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={handleKeyDown} autoFocus
                          className="w-full rounded border border-indigo-300 px-1.5 py-0.5 text-sm focus:outline-none" />
                      ) : (
                        <span onClick={() => startEdit(app.id, "notes", app.notes)} className="cursor-pointer truncate block max-w-48">{app.notes || "—"}</span>
                      )}
                    </td>
                    <td className="px-2 py-2.5">
                      <button onClick={() => setDeleteConfirmId(app.id)}
                        className="invisible group-hover:visible text-gray-300 hover:text-red-500">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {displayedApps.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-400">No applications match your search.</div>
            )}
          </div>

          {hasMore && (
            <button onClick={() => setVisibleCount((c) => c + 15)}
              className="mt-3 w-full rounded-lg border border-gray-200 bg-white py-2.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
              Show more ({filtered.length - visibleCount} remaining)
            </button>
          )}
          {visibleCount > 15 && (
            <button onClick={() => setVisibleCount(15)}
              className="mt-2 w-full text-center text-xs text-gray-400 hover:text-gray-600">
              Show less
            </button>
          )}

        </>
      )}

      {tab === "saved" && (() => {
        const savedColumns = [
          { key: "company", label: "Company", width: "w-40" },
          { key: "role", label: "Role", width: "w-52" },
          { key: "method", label: "Method", width: "w-32" },
        ];
        return (
        <>
          <div className="mb-4 flex gap-3">
            <input type="text" value={savedSearch} onChange={(e) => setSavedSearch(e.target.value)}
              placeholder="Search company or role..."
              className="flex-1 min-w-48 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          {Object.entries(savedColumnFilters).filter(([, v]) => v).length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-400">Filters:</span>
              {Object.entries(savedColumnFilters).filter(([, v]) => v).map(([key, value]) => (
                <button key={key} onClick={() => setSavedColumnFilters((prev) => ({ ...prev, [key]: "" }))}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">
                  {value}
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ))}
              <button onClick={() => setSavedColumnFilters({})} className="text-xs text-gray-400 hover:text-gray-600">Clear all</button>
            </div>
          )}
          <p className="mb-2 text-xs text-gray-400">{filteredSaved.length} positions</p>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
                <tr>
                  {savedColumns.map((col) => (
                    <th key={col.key} className={`${col.width} select-none px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 relative`}>
                      <div className="flex items-center gap-1">
                        <span className="cursor-pointer hover:text-gray-700" onClick={() => {
                          if (savedSortKey === col.key) {
                            if (savedSortDir === "asc") setSavedSortDir("desc");
                            else if (savedSortDir === "desc") setSavedSortDir("none");
                            else setSavedSortDir("asc");
                          } else { setSavedSortKey(col.key); setSavedSortDir("asc"); }
                        }}>
                          {col.label}
                          {savedSortKey === col.key && savedSortDir !== "none" && (
                            <span className="text-indigo-500 ml-1">{savedSortDir === "asc" ? "↑" : "↓"}</span>
                          )}
                        </span>
                        <button onClick={() => setSavedActiveFilter(savedActiveFilter === col.key ? null : col.key)}
                          className={`ml-auto p-0.5 rounded hover:bg-gray-200 ${savedColumnFilters[col.key] ? "text-indigo-500" : "text-gray-300 hover:text-gray-500"}`}>
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                        </button>
                      </div>
                      {savedActiveFilter === col.key && (() => {
                        const allVals = Array.from(new Set(state.savedPositions.map((p) => (p as unknown as Record<string, string>)[col.key]).filter(Boolean))).sort();
                        const fq = savedFilterSearch.toLowerCase();
                        const filteredVals = fq ? allVals.filter((v) => v.toLowerCase().includes(fq)) : allVals;
                        return (<>
                          <div className="fixed inset-0 z-30" onClick={() => { setSavedActiveFilter(null); setSavedFilterSearch(""); }} />
                          <div className="absolute z-40 mt-1 left-0 w-52 rounded-lg border border-gray-200 bg-white shadow-lg">
                            <div className="p-1.5">
                              <input value={savedFilterSearch} onChange={(e) => setSavedFilterSearch(e.target.value)} autoFocus
                                placeholder="Search..." className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none" />
                            </div>
                            <div className="max-h-48 overflow-y-auto px-1 pb-1">
                              {filteredVals.map((val) => (
                                <button key={val} onClick={() => {
                                  setSavedColumnFilters((prev) => ({ ...prev, [col.key]: prev[col.key] === val ? "" : val }));
                                  setSavedActiveFilter(null); setSavedFilterSearch("");
                                }} className={`block w-full px-2 py-1.5 text-left text-xs rounded hover:bg-gray-50 ${savedColumnFilters[col.key] === val ? "text-indigo-600 font-medium" : "text-gray-600"}`}>
                                  {val}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>);
                      })()}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 w-48">Link</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 w-48">Notes</th>
                  <th className="w-24" />
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* Inline add row */}
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-300 text-sm">+</span>
                      <input value={newSavedCompany} onChange={(e) => setNewSavedCompany(e.target.value)}
                        placeholder="Add position..."
                        onKeyDown={(e) => { if (e.key === "Enter" && newSavedCompany.trim()) { e.preventDefault(); handleAddSaved(e as unknown as React.FormEvent); } }}
                        className="w-full text-sm text-gray-500 placeholder-gray-300 bg-transparent border-none focus:outline-none focus:text-gray-700" />
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    {newSavedCompany && <input value={newSavedRole} onChange={(e) => setNewSavedRole(e.target.value)} placeholder="Role"
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSaved(e as unknown as React.FormEvent); } }}
                      className="w-full text-sm text-gray-400 placeholder-gray-300 bg-transparent border-none focus:outline-none focus:text-gray-600" />}
                  </td>
                  <td className="px-4 py-2.5">
                    {newSavedCompany && <input value={newSavedMethod} onChange={(e) => setNewSavedMethod(e.target.value)} placeholder="Method"
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSaved(e as unknown as React.FormEvent); } }}
                      className="w-full text-sm text-gray-400 placeholder-gray-300 bg-transparent border-none focus:outline-none focus:text-gray-600" />}
                  </td>
                  <td className="px-4 py-2.5">
                    {newSavedCompany && <input value={newSavedUrl} onChange={(e) => setNewSavedUrl(e.target.value)} placeholder="URL"
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSaved(e as unknown as React.FormEvent); } }}
                      className="w-full text-sm text-gray-400 placeholder-gray-300 bg-transparent border-none focus:outline-none focus:text-gray-600" />}
                  </td>
                  <td className="px-4 py-2.5">
                    {newSavedCompany && <input value={newSavedNotes} onChange={(e) => setNewSavedNotes(e.target.value)} placeholder="Notes"
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSaved(e as unknown as React.FormEvent); } }}
                      className="w-full text-sm text-gray-400 placeholder-gray-300 bg-transparent border-none focus:outline-none focus:text-gray-600" />}
                  </td>
                  <td className="px-4 py-2.5">
                    {newSavedCompany && <button type="button" onClick={() => handleAddSaved({ preventDefault: () => {} } as React.FormEvent)}
                      className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">Save</button>}
                  </td>
                  <td />
                </tr>
                {filteredSaved.map((pos) => {
                  const isEditing = (field: string) => editingSavedCell?.id === pos.id && editingSavedCell.field === field;
                  const startSavedEdit = (field: string, value: string) => { setEditingSavedCell({ id: pos.id, field }); setEditSavedValue(value); };
                  const saveSavedEdit = () => {
                    if (editingSavedCell) {
                      dispatch({ type: "UPDATE_SAVED_POSITION", payload: { id: pos.id, updates: { [editingSavedCell.field]: editSavedValue } } });
                      setEditingSavedCell(null);
                    }
                  };
                  const savedKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") saveSavedEdit(); if (e.key === "Escape") setEditingSavedCell(null); };
                  return (
                  <tr key={pos.id} className="group hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      {isEditing("company") ? (
                        <input value={editSavedValue} onChange={(e) => setEditSavedValue(e.target.value)} onBlur={saveSavedEdit} onKeyDown={savedKeyDown} autoFocus
                          className="w-full rounded border border-indigo-300 px-1.5 py-0.5 text-sm focus:outline-none" />
                      ) : (
                        <span onClick={() => startSavedEdit("company", pos.company)} className="cursor-pointer text-sm font-medium text-gray-900">{pos.company}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {isEditing("role") ? (
                        <input value={editSavedValue} onChange={(e) => setEditSavedValue(e.target.value)} onBlur={saveSavedEdit} onKeyDown={savedKeyDown} autoFocus
                          className="w-full rounded border border-indigo-300 px-1.5 py-0.5 text-sm focus:outline-none" />
                      ) : (
                        <span onClick={() => startSavedEdit("role", pos.role)} className="cursor-pointer text-sm text-gray-600">{pos.role || "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {isEditing("method") ? (
                        <input value={editSavedValue} onChange={(e) => setEditSavedValue(e.target.value)} onBlur={saveSavedEdit} onKeyDown={savedKeyDown} autoFocus
                          className="w-full rounded border border-indigo-300 px-1.5 py-0.5 text-sm focus:outline-none" />
                      ) : (
                        <span onClick={() => startSavedEdit("method", pos.method)} className="cursor-pointer text-sm text-gray-500">{pos.method || "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {isEditing("url") ? (
                        <input value={editSavedValue} onChange={(e) => setEditSavedValue(e.target.value)} onBlur={saveSavedEdit} onKeyDown={savedKeyDown} autoFocus
                          placeholder="https://..."
                          className="w-full rounded border border-indigo-300 px-1.5 py-0.5 text-sm focus:outline-none" />
                      ) : (
                        pos.url ? (
                          <a href={pos.url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-500 hover:text-indigo-700 truncate block max-w-48"
                            onClick={(e) => { e.preventDefault(); startSavedEdit("url", pos.url); }}>
                            {pos.url}
                          </a>
                        ) : <span onClick={() => startSavedEdit("url", "")} className="cursor-pointer text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {isEditing("notes") ? (
                        <input value={editSavedValue} onChange={(e) => setEditSavedValue(e.target.value)} onBlur={saveSavedEdit} onKeyDown={savedKeyDown} autoFocus
                          className="w-full rounded border border-indigo-300 px-1.5 py-0.5 text-sm focus:outline-none" />
                      ) : (
                        <span onClick={() => startSavedEdit("notes", pos.notes)} className="cursor-pointer text-sm text-gray-500 truncate block max-w-48">{pos.notes || "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <Button size="sm" onClick={() => dispatch({ type: "CONVERT_TO_APPLICATION", payload: { id: pos.id } })}>
                        Applied
                      </Button>
                    </td>
                    <td className="px-2 py-2.5">
                      <button onClick={() => dispatch({ type: "DELETE_SAVED_POSITION", payload: { id: pos.id } })}
                        className="invisible group-hover:visible text-gray-300 hover:text-red-500">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>);
                })}
              </tbody>
            </table>
            {filteredSaved.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-400">{state.savedPositions.length === 0 ? "No saved positions. Add one above." : "No positions match your search."}</div>
            )}
          </div>
        </>);
      })()}
      {/* Delete confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative rounded-xl bg-white p-6 shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900">Delete application?</h3>
            <p className="mt-2 text-sm text-gray-500">This action cannot be undone.</p>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50">Cancel</button>
              <button onClick={() => { dispatch({ type: "DELETE_APPLICATION", payload: { id: deleteConfirmId } }); setDeleteConfirmId(null); }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Application donut chart with hover
function ApplicationDonut({ applications }: { applications: { verdict: string }[] }) {
  const [hovered, setHovered] = useState<{ label: string; count: number; pct: number; color: string } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const total = applications.length;
  const segments = [
    { label: "No Update", count: applications.filter((a) => a.verdict.toLowerCase() === "no update").length, color: "#60a5fa" },
    { label: "In Process", count: applications.filter((a) => a.verdict.toLowerCase() === "in process").length, color: "#f59e0b" },
    { label: "Rejected", count: applications.filter((a) => a.verdict.toLowerCase().includes("rejected")).length, color: "#ef4444" },
    { label: "Withdrew", count: applications.filter((a) => a.verdict.toLowerCase() === "withdrew").length, color: "#a855f7" },
    { label: "No Opening", count: applications.filter((a) => a.verdict.toLowerCase() === "no opening").length, color: "#9ca3af" },
  ].filter((s) => s.count > 0);

  const size = 120;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="mb-6 flex items-center gap-6">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}
        onMouseLeave={() => setHovered(null)}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
          {segments.map((s) => {
            const segLen = total > 0 ? (s.count / total) * circumference : 0;
            const rotation = (offset / circumference) * 360;
            offset += segLen;
            const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
            return (
              <circle key={s.label} cx={size/2} cy={size/2} r={radius} fill="none"
                stroke={s.color} strokeWidth={hovered?.label === s.label ? stroke + 4 : stroke}
                strokeDasharray={`${segLen} ${circumference - segLen}`}
                strokeDashoffset={0}
                transform={`rotate(${rotation} ${size/2} ${size/2})`}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={(e) => { setHovered({ ...s, pct }); setMousePos({ x: e.clientX, y: e.clientY }); }}
                onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {hovered ? (
            <span className="text-xl font-bold" style={{ color: hovered.color }}>{hovered.count}</span>
          ) : (
            <span className="text-lg font-bold text-gray-300">&nbsp;</span>
          )}
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{total} <span className="text-sm font-normal text-gray-500">total applications</span></p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
          {segments.map((s) => {
            const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
            return (
              <div key={s.label} className="flex items-center gap-1.5 cursor-default"
                onMouseEnter={() => setHovered({ ...s, pct })}
                onMouseLeave={() => setHovered(null)}>
                <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-xs text-gray-600">{s.label}</span>
                <span className="text-xs font-medium text-gray-700">{s.count}</span>
                <span className="text-xs text-gray-400">({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>
      {/* Tooltip on mouse */}
      {hovered && (
        <div className="fixed z-50 pointer-events-none rounded-lg bg-gray-900 text-white px-3 py-1.5 text-xs shadow-lg"
          style={{ left: mousePos.x + 12, top: mousePos.y - 10 }}>
          <span className="font-medium">{hovered.label}</span> · {hovered.count} ({hovered.pct}%)
        </div>
      )}
    </div>
  );
}

// Notion-style verdict dropdown
function VerdictDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer text-left ${getVerdictClass(value)}`}>
        {value}
        <svg className="ml-1 h-3 w-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (<>
        <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
        <div className="absolute z-40 mt-1 left-0 w-52 rounded-lg border border-gray-200 bg-white shadow-lg p-1.5">
          {VERDICTS.map((v) => (
            <button key={v} onClick={() => { onChange(v); setOpen(false); }}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-gray-50 ${value === v ? "bg-gray-50" : ""}`}>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getVerdictClass(v)}`}>{v}</span>
            </button>
          ))}
        </div>
      </>)}
    </div>
  );
}
