"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import Button from "@/components/ui/Button";

type Tab = "applied" | "saved";
type SortKey = "company" | "role" | "appliedDate" | "method" | "location" | "verdict";
type SortDir = "asc" | "desc";

const VERDICT_COLORS: Record<string, string> = {
  "no update": "bg-amber-100 text-amber-700",
  "rejected without interview": "bg-red-50 text-red-600",
  "rejected - 1st round": "bg-red-100 text-red-700",
  "rejected - complete process": "bg-red-200 text-red-800",
  "no opening": "bg-gray-100 text-gray-600",
  withdrew: "bg-purple-100 text-purple-700",
  offer: "bg-green-100 text-green-700",
};

function getVerdictClass(verdict: string) {
  return VERDICT_COLORS[verdict.toLowerCase()] ?? "bg-gray-100 text-gray-600";
}

const VERDICTS = [
  "No Update",
  "Rejected without interview",
  "Rejected without Interview",
  "Rejected - 1st Round",
  "Rejected - Complete Process",
  "No Opening",
  "Withdrew",
  "Offer",
];

export default function ApplicationsPage() {
  const { state, dispatch } = useApp();
  const [tab, setTab] = useState<Tab>("applied");
  const [search, setSearch] = useState("");
  const [verdictFilter, setVerdictFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("appliedDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showAddRow, setShowAddRow] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkVerdict, setBulkVerdict] = useState("No Update");

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
    if (verdictFilter !== "all") {
      result = result.filter((a) => a.verdict.toLowerCase() === verdictFilter.toLowerCase());
    }
    result = [...result].sort((a, b) => {
      const aVal = a[sortKey] ?? "";
      const bVal = b[sortKey] ?? "";
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [state.applications, search, verdictFilter, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
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
    setNewCompany(""); setNewRole(""); setNewDate(""); setNewMethod("Company website"); setNewLocation(""); setNewVerdict("No Update"); setShowAddRow(false);
  }

  function handleAddSaved(e: React.FormEvent) {
    e.preventDefault();
    if (!newSavedCompany.trim()) return;
    dispatch({
      type: "ADD_SAVED_POSITION",
      payload: { company: newSavedCompany.trim(), role: newSavedRole.trim(), url: "", notes: newSavedNotes.trim(), deadline: newSavedDeadline },
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
    if (sortKey !== key) return <span className="text-gray-300 ml-1">↕</span>;
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
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExport}>Export CSV</Button>
          <Button onClick={() => tab === "applied" ? setShowAddRow(true) : setShowAddSaved(true)}>
            {tab === "applied" ? "Add Application" : "Add Position"}
          </Button>
        </div>
      </div>

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
            <select value={verdictFilter} onChange={(e) => setVerdictFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
              <option value="all">All verdicts</option>
              {uniqueVerdicts.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

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

          <p className="mb-2 text-xs text-gray-400">{filtered.length} results</p>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-10 px-3 py-3">
                    <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  </th>
                  {columns.map((col) => (
                    <th key={col.key} onClick={() => handleSort(col.key)}
                      className={`${col.width} cursor-pointer select-none px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 hover:text-gray-700`}>
                      {col.label}{sortIcon(col.key)}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 w-48">Notes</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((app) => (
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
                          {app.appliedDate ? new Date(app.appliedDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }) : "—"}
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
                    <td className="px-4 py-2.5">
                      {editingCell?.id === app.id && editingCell.field === "verdict" ? (
                        <select value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={saveEdit} autoFocus
                          className="rounded border border-indigo-300 px-1.5 py-0.5 text-sm focus:outline-none">
                          {VERDICTS.map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                      ) : (
                        <span onClick={() => startEdit(app.id, "verdict", app.verdict)}
                          className={`cursor-pointer inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getVerdictClass(app.verdict)}`}>
                          {app.verdict}
                        </span>
                      )}
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
                      <button onClick={() => dispatch({ type: "DELETE_APPLICATION", payload: { id: app.id } })}
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
            {filtered.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-400">No applications match your search.</div>
            )}
          </div>

          {showAddRow && (
            <form onSubmit={handleAddRow} className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <input value={newCompany} onChange={(e) => setNewCompany(e.target.value)} placeholder="Company" required
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                <input value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="Role"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                <input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="Location"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                <select value={newVerdict} onChange={(e) => setNewVerdict(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  {VERDICTS.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                <div className="flex gap-2">
                  <Button type="submit" size="sm">Add</Button>
                  <Button variant="secondary" size="sm" type="button" onClick={() => setShowAddRow(false)}>Cancel</Button>
                </div>
              </div>
            </form>
          )}
        </>
      )}

      {tab === "saved" && (
        <>
          <div className="space-y-3">
            {state.savedPositions.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">
                No saved positions. Add one to track jobs you want to apply to.
              </div>
            ) : (
              state.savedPositions.map((pos) => (
                <div key={pos.id} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{pos.company}</p>
                    <p className="text-sm text-gray-500">{pos.role}</p>
                    {pos.notes && <p className="mt-1 text-xs text-gray-400">{pos.notes}</p>}
                  </div>
                  {pos.deadline && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-400">Deadline</p>
                      <p className="text-sm font-medium text-gray-700">
                        {new Date(pos.deadline + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" onClick={() => dispatch({ type: "CONVERT_TO_APPLICATION", payload: { id: pos.id } })}>
                      Applied
                    </Button>
                    <button onClick={() => dispatch({ type: "DELETE_SAVED_POSITION", payload: { id: pos.id } })}
                      className="text-gray-300 hover:text-red-500">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {showAddSaved && (
            <form onSubmit={handleAddSaved} className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <input value={newSavedCompany} onChange={(e) => setNewSavedCompany(e.target.value)} placeholder="Company" required
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                <input value={newSavedRole} onChange={(e) => setNewSavedRole(e.target.value)} placeholder="Role"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                <input type="date" value={newSavedDeadline} onChange={(e) => setNewSavedDeadline(e.target.value)} placeholder="Deadline"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                <div className="flex gap-2">
                  <Button type="submit" size="sm">Save</Button>
                  <Button variant="secondary" size="sm" type="button" onClick={() => setShowAddSaved(false)}>Cancel</Button>
                </div>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
