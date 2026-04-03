"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { EventCategory, InterviewType, InterviewStage } from "@/types";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

export default function DashboardPage() {
  const { state, dispatch } = useApp();
  const [newItem, setNewItem] = useState("");
  const [newItemDate, setNewItemDate] = useState("");
  const [calendarView, setCalendarView] = useState<"list" | "week" | "month">("list");
  const [weekOffset, setWeekOffset] = useState(0);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Event form state
  const [eventCompanyId, setEventCompanyId] = useState<string>("");
  const [eventCategory, setEventCategory] = useState<EventCategory>("interview");
  const [eventInterviewType, setEventInterviewType] = useState<InterviewType>("recruiter-screen");
  const [eventStage, setEventStage] = useState<InterviewStage>("recruiter");
  const [eventDate, setEventDate] = useState("");
  const [eventStartTime, setEventStartTime] = useState("");
  const [eventEndTime, setEventEndTime] = useState("");
  const [eventNotes, setEventNotes] = useState("");

  const today = new Date(new Date().toDateString());

  // ---- Computed stats ----
  const generalChecklist = state.checklist.filter((i) => !i.companyId);
  const generalDone = generalChecklist.filter((i) => i.completed).length;
  const generalTotal = generalChecklist.length;

  const questionsPracticed = state.questions.filter((q) => q.practiced).length;
  const questionsTotal = state.questions.length;
  const storiesCount = state.stories.length;
  const unresolvedFeedback = state.stories.reduce(
    (sum, s) => sum + s.feedback.filter((f) => !f.resolved).length, 0
  );

  // Next interview event
  const upcomingEvents = state.events
    .filter((ev) => new Date(ev.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const nextInterview = upcomingEvents.find((ev) => ev.category === "interview");

  // Interviews this week
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
  const interviewsThisWeek = state.events.filter(
    (ev) => ev.category === "interview" && new Date(ev.date) >= today && new Date(ev.date) <= endOfWeek
  ).length;

  // Last practiced
  const practicedQuestions = state.questions.filter((q) => q.practiced);
  const lastPracticedDate = practicedQuestions.length > 0
    ? Math.max(...practicedQuestions.map((q) => q.createdAt))
    : null;
  const daysSinceLastPractice = lastPracticedDate
    ? Math.floor((Date.now() - lastPracticedDate) / 86400000)
    : null;

  function daysUntil(dateStr: string) {
    const diff = Math.ceil((new Date(dateStr).getTime() - today.getTime()) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    return `in ${diff} days`;
  }

  function lastPracticedLabel() {
    if (daysSinceLastPractice === null) return "Not yet";
    if (daysSinceLastPractice === 0) return "Today";
    if (daysSinceLastPractice === 1) return "Yesterday";
    return `${daysSinceLastPractice} days ago`;
  }

  // ---- Handlers ----
  function handleAddGeneral(e: React.FormEvent) {
    e.preventDefault();
    if (!newItem.trim()) return;
    dispatch({ type: "ADD_CHECKLIST_ITEM", payload: { text: newItem.trim(), dueDate: newItemDate, companyId: null } });
    setNewItem("");
    setNewItemDate("");
  }

  const interviewTypeLabels: Record<InterviewType, string> = {
    "recruiter-screen": "Recruiter Screen",
    case: "Case Interview",
    behavioral: "Behavioral",
    technical: "Technical",
    "system-design": "System Design",
    presentation: "Presentation",
    other: "Other",
  };

  const stageLabels: Record<InterviewStage, string> = {
    recruiter: "Recruiter Screen",
    "round-1": "Round 1",
    "round-2": "Round 2",
    "round-3": "Round 3",
    final: "Final Round",
    other: "Other",
  };

  function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!eventDate) return;

    const company = state.companies.find((c) => c.id === eventCompanyId);
    let title = "";
    if (eventCategory === "interview" && company) {
      title = `${company.name} — ${stageLabels[eventStage]}`;
    } else if (eventCategory === "practice") {
      title = eventNotes.trim() || "Practice session";
    } else {
      title = eventNotes.trim() || "Event";
    }

    dispatch({
      type: "ADD_EVENT",
      payload: {
        title,
        date: eventDate,
        startTime: eventStartTime,
        endTime: eventEndTime,
        category: eventCategory,
        interviewType: eventCategory === "interview" ? eventInterviewType : null,
        interviewStage: eventCategory === "interview" ? eventStage : null,
        companyId: eventCategory === "interview" ? (eventCompanyId || null) : null,
        notes: eventNotes.trim(),
      },
    });
    setEventCompanyId("");
    setEventCategory("interview");
    setEventInterviewType("recruiter-screen");
    setEventStage("recruiter");
    setEventDate("");
    setEventStartTime("");
    setEventEndTime("");
    setEventNotes("");
    setShowAddEvent(false);
  }

  // ---- Calendar helpers ----
  function getCalendarMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { year, month, firstDay, daysInMonth };
  }

  function toDateStr(y: number, m: number, d: number) {
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  function getEventsForDateStr(dateStr: string) {
    return state.events.filter((ev) => ev.date === dateStr);
  }

  function getWeekDates() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - dayOfWeek + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return d;
    });
  }

  const { year, month, firstDay, daysInMonth } = getCalendarMonth();
  const monthName = new Date(year, month).toLocaleString("en-US", { month: "long", year: "numeric" });
  const weekDates = getWeekDates();

  // Application stats (derived from applications array)
  const verdictConfig: { verdict: string; label: string; color: string }[] = [
    { verdict: "No Update", label: "No Update", color: "bg-amber-400" },
    { verdict: "Rejected without interview", label: "Rejected - No Interview", color: "bg-red-300" },
    { verdict: "Rejected without Interview", label: "Rejected - No Interview", color: "bg-red-300" },
    { verdict: "Rejected - 1st Round", label: "Rejected - 1st Round", color: "bg-red-400" },
    { verdict: "Rejected - Complete Process", label: "Rejected - Complete", color: "bg-red-500" },
    { verdict: "No Opening", label: "No Opening", color: "bg-gray-300" },
    { verdict: "Withdrew", label: "Withdrew", color: "bg-purple-400" },
    { verdict: "Offer", label: "Offer", color: "bg-green-500" },
  ];
  const verdictCounts = new Map<string, { label: string; color: string; count: number }>();
  for (const app of state.applications) {
    const cfg = verdictConfig.find((v) => v.verdict.toLowerCase() === app.verdict.toLowerCase());
    const label = cfg?.label ?? app.verdict;
    const color = cfg?.color ?? "bg-gray-400";
    const existing = verdictCounts.get(label);
    if (existing) {
      existing.count++;
    } else {
      verdictCounts.set(label, { label, color, count: 1 });
    }
  }
  const appStatRows = Array.from(verdictCounts.values())
    .sort((a, b) => b.count - a.count);
  const totalApplications = state.applications.length;

  // Selected date events
  const selectedDateEvents = selectedDate ? getEventsForDateStr(selectedDate) : [];

  return (
    <div>
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          {interviewsThisWeek > 0
            ? `You have ${interviewsThisWeek} interview${interviewsThisWeek > 1 ? "s" : ""} this week — keep it up!`
            : "No interviews this week — keep prepping!"}
        </p>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Pipeline */}
        <Link href="/applications">
          <div className="h-full rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Applications</p>
              <p className="text-xs text-gray-400">{totalApplications} total</p>
            </div>
            {totalApplications > 0 ? (
              <div className="mt-3 space-y-2">
                {appStatRows.map((row) => {
                  const pct = Math.round((row.count / totalApplications) * 100);
                  return (
                    <div key={row.label} className="flex items-center gap-3">
                      <span className="w-40 text-xs text-gray-600 truncate">{row.label}</span>
                      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className={`h-full rounded-full ${row.color}`} style={{ width: `${Math.max(pct, 2)}%` }} />
                      </div>
                      <span className="w-16 text-right text-xs text-gray-500">{row.count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 text-xs text-gray-400">No applications yet</p>
            )}
          </div>
        </Link>


        {/* Upcoming Interview */}
        {nextInterview ? (
          <div className="h-full rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Upcoming Interview</p>
            <p className="mt-3 text-sm font-semibold text-gray-900">{nextInterview.title}</p>
            {nextInterview.startTime && (
              <p className="mt-0.5 text-xs text-gray-500">
                {nextInterview.startTime}{nextInterview.endTime ? ` — ${nextInterview.endTime}` : ""}
              </p>
            )}
            <p className="mt-1 text-lg font-bold text-indigo-600">{daysUntil(nextInterview.date)}</p>
            <p className="text-xs text-gray-400">
              {new Date(nextInterview.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </p>
          </div>
        ) : (
          <div className="h-full rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Upcoming Interview</p>
            <p className="mt-3 text-sm text-gray-400">None scheduled</p>
            <p className="mt-1 text-xs text-indigo-500 cursor-pointer" onClick={() => setShowAddEvent(true)}>Add an event →</p>
          </div>
        )}

        {/* Unresolved Feedback */}
        <Link href="/stories">
          <div className="h-full rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Story Feedback</p>
            {unresolvedFeedback > 0 ? (
              <>
                <p className="mt-3 text-2xl font-bold text-amber-500">{unresolvedFeedback}</p>
                <p className="text-xs text-gray-400">edit{unresolvedFeedback > 1 ? "s" : ""} to make</p>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm font-medium text-green-600">All addressed</p>
                <p className="text-xs text-gray-400">Nice work!</p>
              </>
            )}
          </div>
        </Link>

        {/* To Apply */}
        <Link href="/applications">
          <div className="h-full rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">To Apply</p>
            <p className="mt-3 text-2xl font-bold text-indigo-600">{state.savedPositions.length}</p>
            <p className="text-xs text-gray-400">
              {state.savedPositions.length === 0 ? "No saved positions" : `position${state.savedPositions.length > 1 ? "s" : ""} saved`}
            </p>
          </div>
        </Link>
      </div>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left: General Checklist */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">General Prep</h2>
            <Link href="/checklist" className="text-xs text-indigo-500 hover:text-indigo-700">View all</Link>
          </div>

          <form onSubmit={handleAddGeneral} className="mb-4 flex gap-2">
            <input
              type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)}
              placeholder="Add a task..."
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <input
              type="date" value={newItemDate} onChange={(e) => setNewItemDate(e.target.value)}
              className="w-36 rounded-lg border border-gray-200 px-2 py-2 text-xs text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button type="submit" disabled={!newItem.trim()}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >Add</button>
          </form>

          {(() => {
            const dated = generalChecklist
              .filter((i) => i.dueDate)
              .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
            const undated = generalChecklist.filter((i) => !i.dueDate);

            if (generalChecklist.length === 0) {
              return <p className="py-6 text-center text-sm text-gray-400">No tasks yet. Add one above!</p>;
            }

            const renderItem = (item: typeof generalChecklist[0]) => (
              <div key={item.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-50">
                <input type="checkbox" checked={item.completed}
                  onChange={() => dispatch({ type: "TOGGLE_CHECKLIST_ITEM", payload: { id: item.id } })}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span
                  onClick={() => dispatch({ type: "TOGGLE_CHECKLIST_ITEM", payload: { id: item.id } })}
                  className={`flex-1 text-sm cursor-pointer select-none ${item.completed ? "text-gray-400 line-through" : "text-gray-700"}`}
                >
                  {item.text}
                </span>
                {item.dueDate && (
                  <span className={`text-xs ${new Date(item.dueDate) < today && !item.completed ? "text-red-500 font-medium" : "text-gray-400"}`}>
                    {new Date(item.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
            );

            return (
              <div className="space-y-1">
                {dated.map(renderItem)}
                {dated.length > 0 && undated.length > 0 && (
                  <div className="px-3 pt-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-300">No date</p>
                  </div>
                )}
                {undated.map(renderItem)}
              </div>
            );
          })()}
        </div>

        {/* Right: Schedule */}
        <div className="lg:col-span-3 rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Schedule</h2>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-gray-200">
                {(["list", "week", "month"] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => { setCalendarView(view); setSelectedDate(null); }}
                    className={`px-3 py-1 text-xs font-medium capitalize ${
                      view === "list" ? "rounded-l-lg" : view === "month" ? "rounded-r-lg" : ""
                    } ${calendarView === view ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
                  >{view}</button>
                ))}
              </div>
              <button onClick={() => setShowAddEvent(true)}
                className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700"
              >Add</button>
            </div>
          </div>

          {calendarView === "list" && (
            <div className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">No upcoming events</p>
              ) : (
                upcomingEvents.map((ev) => {
                  const eventTasks = ev.companyId ? state.checklist.filter((i) => i.companyId === ev.companyId) : [];
                  const tasksDone = eventTasks.filter((i) => i.completed).length;
                  return (
                    <div key={ev.id} className="rounded-lg border border-gray-100 px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${ev.category === "interview" ? "bg-indigo-500" : "bg-green-500"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{ev.title}</p>
                          {ev.startTime && (
                            <p className="mt-0.5 text-xs text-gray-500">
                              {ev.startTime}{ev.endTime ? ` — ${ev.endTime}` : ""}
                            </p>
                          )}
                          {ev.notes && <p className="mt-0.5 text-xs text-gray-400 truncate">{ev.notes}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-medium text-indigo-600">{daysUntil(ev.date)}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(ev.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </p>
                        </div>
                      </div>
                      {eventTasks.length > 0 && (
                        <div className="mt-2 ml-5 border-t border-gray-50 pt-2">
                          <p className="mb-1.5 text-xs text-gray-400">{tasksDone}/{eventTasks.length} prep tasks</p>
                          <div className="space-y-1">
                            {eventTasks.map((task) => (
                              <div key={task.id} className="flex items-center gap-2">
                                <input type="checkbox" checked={task.completed}
                                  onChange={() => dispatch({ type: "TOGGLE_CHECKLIST_ITEM", payload: { id: task.id } })}
                                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span
                                  onClick={() => dispatch({ type: "TOGGLE_CHECKLIST_ITEM", payload: { id: task.id } })}
                                  className={`text-sm cursor-pointer select-none ${task.completed ? "text-gray-400 line-through" : "text-gray-600"}`}
                                >
                                  {task.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div className="flex items-center gap-4 pt-2 text-xs text-gray-400">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-500" /> Interview</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500" /> Practice</span>
              </div>
            </div>
          )}

          {calendarView === "week" && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <button
                  onClick={() => setWeekOffset((o) => o - 1)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-700">
                    {weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} — {weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                  {weekOffset !== 0 && (
                    <button
                      onClick={() => setWeekOffset(0)}
                      className="rounded px-2 py-0.5 text-xs text-indigo-500 hover:bg-indigo-50"
                    >
                      Today
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setWeekOffset((o) => o + 1)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {weekDates.map((d) => {
                  const dateStr = toDateStr(d.getFullYear(), d.getMonth(), d.getDate());
                  const dayEvents = getEventsForDateStr(dateStr);
                  const isToday = d.getTime() === today.getTime();
                  const isSelected = selectedDate === dateStr;
                  return (
                    <div
                      key={dateStr}
                      onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                      className={`cursor-pointer rounded-xl border p-3 text-center transition-all ${
                        isSelected
                          ? "border-indigo-300 bg-indigo-50"
                          : isToday
                          ? "border-indigo-200 bg-indigo-50/50"
                          : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <p className="text-xs text-gray-400">
                        {d.toLocaleDateString("en-US", { weekday: "short" })}
                      </p>
                      <p className={`mt-1 text-lg font-semibold ${isToday ? "text-indigo-600" : "text-gray-700"}`}>
                        {d.getDate()}
                      </p>
                      <div className="mt-2 space-y-1">
                        {dayEvents.map((ev) => (
                          <div
                            key={ev.id}
                            className={`rounded px-1.5 py-0.5 text-xs truncate ${
                              ev.category === "interview"
                                ? "bg-indigo-100 text-indigo-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {ev.title.length > 12 ? ev.title.slice(0, 12) + "…" : ev.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Selected date detail */}
              {selectedDate && (
                <SelectedDatePanel
                  dateStr={selectedDate}
                  events={getEventsForDateStr(selectedDate)}
                  checklist={state.checklist}
                  dispatch={dispatch}
                />
              )}
            </div>
          )}

          {calendarView === "month" && (
            <div>
              <p className="mb-3 text-sm font-medium text-gray-700">{monthName}</p>
              <div className="grid grid-cols-7 gap-1 text-center">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <div key={d} className="py-2 text-xs font-medium text-gray-400">{d}</div>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = toDateStr(year, month, day);
                  const dayEvents = getEventsForDateStr(dateStr);
                  const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                  const isSelected = selectedDate === dateStr;
                  const hasInterview = dayEvents.some((ev) => ev.category === "interview");
                  const hasPractice = dayEvents.some((ev) => ev.category === "practice");
                  return (
                    <div
                      key={day}
                      onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                      className={`relative cursor-pointer rounded-lg p-2 text-sm transition-all hover:bg-gray-50 ${
                        isSelected
                          ? "bg-indigo-50 ring-2 ring-indigo-400"
                          : isToday
                          ? "bg-indigo-50"
                          : ""
                      }`}
                    >
                      <span className={`${isToday ? "font-bold text-indigo-600" : "text-gray-700"}`}>
                        {day}
                      </span>
                      {dayEvents.length > 0 && (
                        <div className="mt-1 flex justify-center gap-1">
                          {hasInterview && <span className="h-1.5 w-4 rounded-full bg-indigo-400" />}
                          {hasPractice && <span className="h-1.5 w-4 rounded-full bg-green-400" />}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 pt-3 text-xs text-gray-400">
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-4 rounded-full bg-indigo-400" /> Interview</span>
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-4 rounded-full bg-green-400" /> Practice</span>
              </div>
              {/* Selected date detail */}
              {selectedDate && (
                <SelectedDatePanel
                  dateStr={selectedDate}
                  events={getEventsForDateStr(selectedDate)}
                  checklist={state.checklist}
                  dispatch={dispatch}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Event Modal */}
      <Modal open={showAddEvent} onClose={() => setShowAddEvent(false)} title="Add Event">
        <form onSubmit={handleAddEvent} className="space-y-4">
          {/* Category toggle */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Type</label>
            <div className="flex rounded-lg border border-gray-200">
              <button type="button"
                onClick={() => setEventCategory("interview")}
                className={`flex-1 rounded-l-lg px-4 py-2 text-sm font-medium ${
                  eventCategory === "interview" ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-50"
                }`}
              >Interview</button>
              <button type="button"
                onClick={() => setEventCategory("practice")}
                className={`flex-1 rounded-r-lg px-4 py-2 text-sm font-medium ${
                  eventCategory === "practice" ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-50"
                }`}
              >Practice</button>
            </div>
          </div>

          {/* Company (interview only) */}
          {eventCategory === "interview" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Company</label>
              <select value={eventCompanyId} onChange={(e) => setEventCompanyId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <option value="">Select a company...</option>
                {state.companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} — {c.role}</option>
                ))}
              </select>
            </div>
          )}

          {/* Interview type + stage (interview only) */}
          {eventCategory === "interview" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
                <select value={eventInterviewType} onChange={(e) => setEventInterviewType(e.target.value as InterviewType)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  {Object.entries(interviewTypeLabels).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Stage</label>
                <select value={eventStage} onChange={(e) => setEventStage(e.target.value as InterviewStage)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  {Object.entries(stageLabels).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Date + Time */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
            <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Start time</label>
              <input type="time" value={eventStartTime} onChange={(e) => setEventStartTime(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">End time</label>
              <input type="time" value={eventEndTime} onChange={(e) => setEventEndTime(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {eventCategory === "practice" ? "Details" : "Notes (optional)"}
            </label>
            <textarea value={eventNotes} onChange={(e) => setEventNotes(e.target.value)} rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder={eventCategory === "practice" ? "e.g. Mock interview with Sarah" : "Any details..."} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowAddEvent(false)}>Cancel</Button>
            <Button type="submit">Add Event</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ---- Selected Date Panel (shared between week and month views) ----
function SelectedDatePanel({
  dateStr,
  events,
  checklist,
  dispatch,
}: {
  dateStr: string;
  events: ReturnType<typeof Array.prototype.filter>;
  checklist: { id: string; text: string; completed: boolean; companyId: string | null }[];
  dispatch: React.Dispatch<{ type: "TOGGLE_CHECKLIST_ITEM"; payload: { id: string } }>;
}) {
  const dateLabel = new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50/30 p-4">
      <p className="text-sm font-medium text-gray-700">{dateLabel}</p>
      {events.length === 0 ? (
        <p className="mt-2 text-sm text-gray-400">No events this day</p>
      ) : (
        <div className="mt-3 space-y-3">
          {(events as { id: string; title: string; category: string; notes: string; companyId: string | null }[]).map((ev) => {
            const tasks = ev.companyId ? checklist.filter((i) => i.companyId === ev.companyId) : [];
            return (
              <div key={ev.id} className="rounded-lg bg-white p-3 border border-gray-100">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${ev.category === "interview" ? "bg-indigo-500" : "bg-green-500"}`} />
                  <span className="text-sm font-medium text-gray-900">{ev.title}</span>
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-xs ${
                    ev.category === "interview" ? "bg-indigo-100 text-indigo-700" : "bg-green-100 text-green-700"
                  }`}>{ev.category}</span>
                </div>
                {ev.notes && <p className="mt-1 ml-4 text-xs text-gray-500">{ev.notes}</p>}
                {tasks.length > 0 && (
                  <div className="mt-2 ml-4 space-y-1">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-2">
                        <input type="checkbox" checked={task.completed}
                          onChange={() => dispatch({ type: "TOGGLE_CHECKLIST_ITEM", payload: { id: task.id } })}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span
                          onClick={() => dispatch({ type: "TOGGLE_CHECKLIST_ITEM", payload: { id: task.id } })}
                          className={`text-xs cursor-pointer select-none ${task.completed ? "text-gray-400 line-through" : "text-gray-600"}`}
                        >
                          {task.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
