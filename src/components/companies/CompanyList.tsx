"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import Badge from "@/components/ui/Badge";

const STATUS_COLORS: Record<string, string> = {
  "in process": "bg-amber-100 text-amber-700",
  "no-update": "bg-blue-50 text-blue-700",
  interviewing: "bg-indigo-100 text-indigo-700",
  saved: "bg-gray-100 text-gray-600",
};

export default function CompanyList() {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState("");
  const [addSearch, setAddSearch] = useState("");

  // In Process apps that don't have a matching company card
  const inProcessApps = useMemo(() => {
    const companyNames = new Set(state.companies.map((c) => c.name.toLowerCase()));
    return state.applications
      .filter((a) => a.verdict.toLowerCase() === "in process")
      .filter((a) => !companyNames.has(a.company.toLowerCase()));
  }, [state.applications, state.companies]);

  // Unique companies from in-process for suggestions
  const suggestions = useMemo(() => {
    const map = new Map<string, { company: string; role: string }>();
    inProcessApps.forEach((a) => {
      if (!map.has(a.company)) map.set(a.company, { company: a.company, role: a.role });
    });
    return Array.from(map.values());
  }, [inProcessApps]);

  const filtered = useMemo(() => {
    if (!search) return state.companies;
    const q = search.toLowerCase();
    return state.companies.filter((c) => c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q));
  }, [state.companies, search]);

  // Add search matches from applications
  const addMatches = useMemo(() => {
    if (!addSearch) return [];
    const q = addSearch.toLowerCase();
    const existing = new Set(state.companies.map((c) => c.name.toLowerCase()));
    return Array.from(new Set(state.applications.map((a) => a.company)))
      .filter((c) => c.toLowerCase().includes(q) && !existing.has(c.toLowerCase()))
      .slice(0, 6);
  }, [addSearch, state.applications, state.companies]);

  function quickAdd(company: string, role: string) {
    dispatch({
      type: "ADD_COMPANY",
      payload: {
        name: company,
        role: role,
        status: "interviewing",
        interviewDate: "",
        roleUrl: "",
        companyUrl: "",
        whyCompany: "",
        whyRole: "",
        notes: "",
        questionsAsked: [],
        questionsToAsk: [],
      },
    });
  }

  function getAppStatus(companyName: string, role: string) {
    const app = state.applications.find((a) =>
      a.company.toLowerCase() === companyName.toLowerCase() &&
      (!role || a.role.toLowerCase() === role.toLowerCase())
    ) ?? state.applications.find((a) => a.company.toLowerCase() === companyName.toLowerCase());
    return app?.verdict ?? null;
  }

  function getUpcomingEvents(companyName: string) {
    const today = new Date(new Date().toDateString());
    return state.events.filter(
      (ev) => ev.companyName?.toLowerCase() === companyName.toLowerCase() && new Date(ev.date + "T12:00:00") >= today
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
        <p className="mt-1 text-sm text-gray-500">
          Deep research on companies you&apos;re interviewing with
        </p>
      </div>

      {/* Auto-suggest for In Process apps */}
      {suggestions.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            {suggestions.length} {suggestions.length === 1 ? "company" : "companies"} in process — add to start prepping?
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button key={s.company} onClick={() => quickAdd(s.company, s.role)}
                className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors">
                + {s.company}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search companies..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>

      {/* Company cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => {
          const appStatus = getAppStatus(c.name, c.role);
          const upcoming = getUpcomingEvents(c.name);
          return (
            <Link key={c.id} href={`/companies/${c.id}`}>
              <div className="h-full rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-gray-900">{c.name}</h3>
                  {appStatus && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[appStatus.toLowerCase()] ?? "bg-gray-100 text-gray-600"}`}>
                      {appStatus}
                    </span>
                  )}
                </div>
                {c.role && <p className="mt-1 text-sm text-gray-500">{c.role}</p>}
                {c.whyCompany && <p className="mt-2 text-xs text-gray-400 line-clamp-2">{c.whyCompany}</p>}
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-400">
                  {c.interviewDate && (
                    <span className="text-indigo-500">
                      Interview: {new Date(c.interviewDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                  {upcoming.length > 0 && (
                    <span className="text-green-600">{upcoming.length} upcoming</span>
                  )}
                  {c.questionsToAsk.length > 0 && <span>{c.questionsToAsk.length} Qs to ask</span>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && state.companies.length > 0 && (
        <div className="py-12 text-center text-sm text-gray-400">No companies match your search.</div>
      )}

      {/* Inline add */}
      <div className="mt-6 relative">
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-3 hover:border-gray-400 transition-colors">
          <span className="text-gray-300 text-sm">+</span>
          <input value={addSearch} onChange={(e) => setAddSearch(e.target.value)}
            placeholder="Add a company..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && addSearch.trim()) {
                quickAdd(addSearch.trim(), "");
                setAddSearch("");
              }
            }}
            className="flex-1 text-sm text-gray-500 placeholder-gray-300 bg-transparent border-none focus:outline-none focus:text-gray-700" />
        </div>
        {addSearch && addMatches.length > 0 && (<>
          <div className="fixed inset-0 z-30" onClick={() => setAddSearch("")} />
          <div className="absolute z-40 mt-1 left-0 right-0 rounded-lg border border-gray-200 bg-white shadow-lg max-h-48 overflow-y-auto">
            {addMatches.map((company) => {
              const app = state.applications.find((a) => a.company === company);
              return (
                <button key={company} onClick={() => { quickAdd(company, app?.role ?? ""); setAddSearch(""); }}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-indigo-50">
                  <span className="font-medium">{company}</span>
                  {app?.role && <span className="ml-2 text-xs text-gray-400">{app.role}</span>}
                </button>
              );
            })}
          </div>
        </>)}
      </div>

      {state.companies.length === 0 && !search && (
        <div className="py-8 text-center text-sm text-gray-400">
          No companies yet. Add one above or use the suggestions.
        </div>
      )}
    </div>
  );
}
