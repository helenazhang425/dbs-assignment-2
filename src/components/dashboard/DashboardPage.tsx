"use client";

import { useState } from "react";
import Link from "next/link";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useApp } from "@/context/AppContext";
import { EventCategory, InterviewType, InterviewStage } from "@/types";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

export default function DashboardPage() {
  const { state, dispatch } = useApp();
  const [newItem, setNewItem] = useState("");
  const [newItemDate, setNewItemDate] = useState("");
  const [calendarView, setCalendarView] = useState<"list" | "week" | "month">("list");
  const [listMode, setListMode] = useState<"chrono" | "bytype">("chrono");
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [companyPrepSections, setCompanyPrepSections] = useState<string[]>(() => {
    // Initialize with events that already have tasks
    return ["ev2", "ev3", "ev6", "ev7"]; // Blink Health, Clover Health, Sprinter Health, Granted
  });
  const [showPrepSearch, setShowPrepSearch] = useState(false);
  const [prepSearchQuery, setPrepSearchQuery] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [companySearch, setCompanySearch] = useState("");
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Event form state
  const [eventTitle, setEventTitle] = useState("");
  const [eventCompanySearch, setEventCompanySearch] = useState("");
  const [eventCompanyName, setEventCompanyName] = useState("");
  const [eventRole, setEventRole] = useState("");
  const [eventCategory, setEventCategory] = useState<EventCategory>("interview");
  const [eventInterviewType, setEventInterviewType] = useState<InterviewType | null>(null);
  const [eventStage, setEventStage] = useState<InterviewStage | null>(null);
  const [eventDate, setEventDate] = useState("");
  const [eventStartTime, setEventStartTime] = useState("");
  const [eventEndTime, setEventEndTime] = useState("");
  const [eventNotes, setEventNotes] = useState("");

  const today = new Date(new Date().toDateString());

  // ---- Computed stats ----
  const generalChecklist = state.checklist.filter((i) => !i.companyId && !i.eventId);
  const eventChecklist = state.checklist.filter((i) => i.eventId);
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
    .filter((ev) => new Date(ev.date + "T12:00:00") >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const nextInterview = upcomingEvents.find((ev) => ev.category === "interview");

  // Events this week
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
  const eventsThisWeek = state.events.filter(
    (ev) => new Date(ev.date + "T12:00:00") >= today && new Date(ev.date + "T12:00:00") <= endOfWeek
  );
  const interviewsThisWeek = eventsThisWeek.filter((ev) => ev.category === "interview").length;
  const practiceThisWeek = eventsThisWeek.filter((ev) => ev.category === "practice").length;

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
    mixed: "Mixed",
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

    let title = eventTitle.trim();
    if (!title) {
      if (eventCategory === "interview" && eventCompanyName) {
        title = eventRole ? `${eventCompanyName} — ${eventRole}` : eventCompanyName;
      } else {
        title = eventNotes.trim() || "Event";
      }
    }

    dispatch({
      type: "ADD_EVENT",
      payload: {
        title,
        date: eventDate,
        startTime: eventStartTime,
        endTime: eventEndTime,
        category: eventCategory,
        interviewType: eventInterviewType,
        interviewStage: eventCategory === "interview" ? eventStage : null,
        companyId: null,
        companyName: eventCompanyName,
        role: eventRole,
        notes: eventNotes.trim(),
      },
    });
    resetEventForm();
    setShowAddEvent(false);
  }

  function resetEventForm() {
    setEventTitle("");
    setEventCompanySearch("");
    setEventCompanyName("");
    setEventRole("");
    setEventCategory("interview");
    setEventInterviewType(null);
    setEventStage(null);
    setEventDate("");
    setEventStartTime("");
    setEventEndTime("");
    setEventNotes("");
  }

  // ---- Calendar helpers ----
  function getCalendarMonth() {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const year = target.getFullYear();
    const month = target.getMonth();
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

  // Application stats — simplified into 3 buckets
  const totalApplications = state.applications.length;
  const rejectedVerdicts = ["rejected without interview", "rejected - 1st round", "rejected - complete process"];
  const inProcessVerdicts = ["in process"];
  const appNoUpdate = state.applications.filter((a) => a.verdict.toLowerCase() === "no update").length;
  const appRejected = state.applications.filter((a) => rejectedVerdicts.includes(a.verdict.toLowerCase())).length;
  const appInProcess = state.applications.filter((a) => inProcessVerdicts.includes(a.verdict.toLowerCase())).length;
  const appStatRows = [
    { label: "No Update", count: appNoUpdate, color: "bg-amber-400" },
    { label: "Rejected", count: appRejected, color: "bg-red-400" },
    { label: "In Process", count: appInProcess, color: "bg-blue-500" },
  ].filter((r) => r.count > 0);

  // Selected date events
  const selectedDateEvents = selectedDate ? getEventsForDateStr(selectedDate) : [];

  function urgencyColor(dateStr: string) {
    const diff = Math.ceil((new Date(dateStr + "T12:00:00").getTime() - today.getTime()) / 86400000);
    if (diff <= 0) return "text-red-600 font-bold";
    if (diff <= 1) return "text-red-500 font-semibold";
    if (diff <= 3) return "text-orange-500 font-semibold";
    if (diff <= 7) return "text-amber-500 font-medium";
    return "text-indigo-500 font-medium";
  }

  function dotColor(cat: string) {
    if (cat === "interview") return "bg-indigo-500";
    if (cat === "practice") return "bg-green-500";
    if (cat === "networking") return "bg-amber-500";
    return "bg-gray-400";
  }

  function typeBadge(ev: typeof upcomingEvents[0]) {
    if (!ev.interviewType) return null;
    const config: Record<string, { label: string; cls: string }> = {
      behavioral: { label: "Behavioral", cls: "bg-blue-50 text-blue-600" },
      case: { label: "Case", cls: "bg-purple-50 text-purple-600" },
      "recruiter-screen": { label: "Recruiter Screen", cls: "bg-teal-50 text-teal-700" },
      presentation: { label: "Presentation", cls: "bg-orange-50 text-orange-600" },
      mixed: { label: "Mixed", cls: "bg-pink-50 text-pink-600" },
      other: { label: "Other", cls: "bg-gray-100 text-gray-500" },
    };
    return config[ev.interviewType] ?? null;
  }

  return (
    <div>
      {/* Greeting */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <span className="text-xs text-gray-400">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {eventsThisWeek.length > 0
            ? `You have ${eventsThisWeek.length} event${eventsThisWeek.length > 1 ? "s" : ""} this week${
                interviewsThisWeek > 0 ? ` — ${interviewsThisWeek} interview${interviewsThisWeek > 1 ? "s" : ""}` : ""
              }${practiceThisWeek > 0 ? `${interviewsThisWeek > 0 ? "," : " —"} ${practiceThisWeek} practice` : ""
              }. Keep it up!`
            : "No events this week — keep prepping!"}
        </p>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Pipeline */}
        <Link href="/applications">
          <div className="h-full rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Applications</p>
              <p className="text-xs text-gray-400">{totalApplications} total</p>
            </div>
            {totalApplications > 0 ? (
              <div className="mt-3 space-y-2">
                {appStatRows.map((row) => {
                  const pct = Math.round((row.count / totalApplications) * 100);
                  return (
                    <div key={row.label} className="flex items-center gap-2">
                      <span className="w-20 text-xs text-gray-600 truncate">{row.label}</span>
                      <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className={`h-full rounded-full ${row.color}`} style={{ width: `${Math.max(pct, 3)}%` }} />
                      </div>
                      <span className="w-20 text-right text-xs text-gray-500">{row.count} ({pct}%)</span>
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
        {nextInterview ? (() => {
          const totalInterviews = upcomingEvents.filter((ev) => ev.category === "interview").length;
          const moreCount = totalInterviews - 1;
          return (
          <Link href={nextInterview.companyId ? `/companies/${nextInterview.companyId}` : "/companies"}>
            <div className="h-full rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Upcoming Interview</p>
                {moreCount > 0 && (
                  <span className="text-xs text-indigo-500">+{moreCount} more</span>
                )}
              </div>
              <p className="mt-3 text-sm font-semibold text-gray-900">{nextInterview.title}</p>
              {nextInterview.startTime && (
                <p className="mt-0.5 text-xs text-gray-500">
                  {nextInterview.startTime}{nextInterview.endTime ? ` — ${nextInterview.endTime}` : ""}
                </p>
              )}
              <p className="mt-1 text-lg font-bold text-indigo-600">{daysUntil(nextInterview.date)}</p>
              <p className="text-xs text-gray-400">
                {new Date(nextInterview.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </p>
            </div>
          </Link>
          );
        })() : (
          <div className="h-full rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Upcoming Interview</p>
            <p className="mt-3 text-sm text-gray-400">None scheduled</p>
            <p className="mt-1 text-xs text-indigo-500 cursor-pointer" onClick={() => setShowAddEvent(true)}>Add an event →</p>
          </div>
        )}

        {/* Unresolved Feedback */}
        <Link href="/stories">
          <div className="h-full rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md hover:-translate-y-0.5">
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
          <div className="h-full rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md hover:-translate-y-0.5">
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
            <h2 className="text-lg font-semibold text-gray-900">Checklist</h2>
          </div>

          {(() => {
            // Sort: dated first (ascending), then undated
            const sortedGeneral = [...generalChecklist].sort((a, b) => {
              if (a.dueDate && !b.dueDate) return -1;
              if (!a.dueDate && b.dueDate) return 1;
              if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
              return 0;
            });

            if (generalChecklist.length === 0) {
              return <p className="py-6 text-center text-sm text-gray-400">No tasks yet. Add one above!</p>;
            }

            const renderItem = (item: typeof generalChecklist[0]) => (
              <div key={item.id} className="group/prep flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-50">
                <input type="checkbox" checked={item.completed}
                  onChange={() => dispatch({ type: "TOGGLE_CHECKLIST_ITEM", payload: { id: item.id } })}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                {editingChecklistId === item.id ? (
                  <input defaultValue={item.text} autoFocus
                    onBlur={(e) => {
                      dispatch({ type: "UPDATE_CHECKLIST_ITEM", payload: { id: item.id, updates: { text: e.target.value } } });
                      setEditingChecklistId(null);
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditingChecklistId(null); }}
                    className="flex-1 rounded border border-indigo-300 px-1.5 py-0.5 text-sm focus:outline-none" />
                ) : (
                  <span
                    onClick={() => setEditingChecklistId(item.id)}
                    className={`flex-1 text-sm cursor-pointer select-none transition-all duration-200 ${item.completed ? "text-gray-400 line-through opacity-60" : "text-gray-700"}`}
                  >
                    {item.text}
                  </span>
                )}
                {item.dueDate && (
                  <span className={`text-xs ${new Date(item.dueDate) < today && !item.completed ? "text-red-500 font-medium" : "text-gray-400"}`}>
                    {new Date(item.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
                <button onClick={() => dispatch({ type: "DELETE_CHECKLIST_ITEM", payload: { id: item.id } })}
                  className="invisible group-hover/prep:visible text-gray-300 hover:text-red-500">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );

            function handleDragEnd(result: DropResult) {
              if (!result.destination) return;
              const items = [...sortedGeneral];
              const [moved] = items.splice(result.source.index, 1);
              items.splice(result.destination.index, 0, moved);
              // Reorder all checklist items: keep event items in place, reorder general
              const eventItems = state.checklist.filter((i) => i.eventId || i.companyId);
              dispatch({ type: "REORDER_CHECKLIST", payload: { ids: [...items.map((i) => i.id), ...eventItems.map((i) => i.id)] } });
            }

            return (
              <div className="space-y-1">
                <div className="px-3 pb-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">General Prep</p>
                </div>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="general-checklist">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps}>
                        {sortedGeneral.map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <div ref={provided.innerRef} {...provided.draggableProps}
                                className={snapshot.isDragging ? "opacity-80 shadow-lg rounded-lg bg-white" : ""}>
                                <div className="flex items-center">
                                  <div {...provided.dragHandleProps} className="px-1 py-2 cursor-grab text-gray-300 hover:text-gray-400">
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                      <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
                                      <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                                      <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
                                    </svg>
                                  </div>
                                  <div className="flex-1">{renderItem(item)}</div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
                {/* Inline add at bottom of General Prep */}
                <form className="group/addform flex items-center gap-3 rounded-lg px-3 py-2" onSubmit={handleAddGeneral}>
                  <span className="h-4 w-4 text-gray-300 flex items-center justify-center text-sm">+</span>
                  <input
                    type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)}
                    placeholder="Add a task"
                    className="flex-1 text-sm text-gray-500 placeholder-gray-300 bg-transparent border-none focus:outline-none focus:text-gray-700"
                  />
                  <label className={`cursor-pointer text-gray-300 hover:text-gray-500 transition-colors relative ${newItem ? "opacity-100" : "opacity-0 group-hover/addform:opacity-100"}`}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <input
                      type="date" value={newItemDate} onChange={(e) => setNewItemDate(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </label>
                  {newItemDate && (
                    <span className="text-xs text-indigo-500">
                      {new Date(newItemDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </form>
                {/* Company Prep — intentional sections */}
                <div className="px-3 pt-3">
                  <div className="border-t border-gray-200 mt-2" />
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Company Prep</p>
                    <button onClick={() => { setShowPrepSearch(!showPrepSearch); setPrepSearchQuery(""); }}
                      className="text-gray-400 hover:text-indigo-500 transition-colors">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Search to add a new prep section */}
                {showPrepSearch && (
                  <div className="px-3 pt-2 relative">
                    <input
                      value={prepSearchQuery}
                      onChange={(e) => setPrepSearchQuery(e.target.value)}
                      placeholder="Search upcoming events..."
                      autoFocus
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    {prepSearchQuery && (
                      <div className="absolute z-10 mt-1 left-3 right-3 rounded-lg border border-gray-200 bg-white shadow-lg max-h-48 overflow-y-auto">
                        {upcomingEvents
                          .filter((ev) => !companyPrepSections.includes(ev.id))
                          .filter((ev) => ev.title.toLowerCase().includes(prepSearchQuery.toLowerCase()) || ev.companyName?.toLowerCase().includes(prepSearchQuery.toLowerCase()))
                          .map((ev) => (
                            <button key={ev.id} onClick={() => {
                              setCompanyPrepSections((prev) => [...prev, ev.id]);
                              setShowPrepSearch(false);
                              setPrepSearchQuery("");
                            }}
                              className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-indigo-50">
                              <span className="font-medium">{ev.title}</span>
                              <span className="ml-2 text-xs text-gray-400">
                                {new Date(ev.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            </button>
                          ))}
                        {/* Custom option */}
                        <button onClick={() => {
                          const customId = `custom-${crypto.randomUUID()}`;
                          setCompanyPrepSections((prev) => [...prev, customId]);
                          // Add a placeholder task so the section has a name
                          dispatch({ type: "ADD_CHECKLIST_ITEM", payload: { text: prepSearchQuery.trim(), eventId: customId } });
                          setShowPrepSearch(false);
                          setPrepSearchQuery("");
                        }}
                          className="block w-full px-3 py-2 text-left text-sm text-indigo-600 hover:bg-indigo-50 border-t border-gray-100">
                          + Create &ldquo;{prepSearchQuery}&rdquo;
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Render active company prep sections */}
                {companyPrepSections
                  .filter((sectionId) => {
                    // Auto-remove: event passed or all tasks completed
                    const ev = state.events.find((e) => e.id === sectionId);
                    if (ev && new Date(ev.date + "T12:00:00") < today) return false;
                    const tasks = eventChecklist.filter((t) => t.eventId === sectionId);
                    if (tasks.length > 0 && tasks.every((t) => t.completed)) return false;
                    return true;
                  })
                  .map((sectionId) => {
                    const ev = state.events.find((e) => e.id === sectionId);
                    const sectionTitle = ev?.title ?? sectionId.startsWith("custom-") ? eventChecklist.find((t) => t.eventId === sectionId)?.text ?? "Custom" : sectionId;
                    const evTasks = eventChecklist.filter((t) => t.eventId === sectionId);
                    return (
                      <div key={sectionId} className="group/section">
                        <div className="flex items-center px-3 pt-2">
                          <p className="flex-1 text-xs text-gray-400">{ev?.title ?? sectionTitle}</p>
                          <button onClick={() => setCompanyPrepSections((prev) => prev.filter((id) => id !== sectionId))}
                            className="invisible group-hover/section:visible text-gray-300 hover:text-red-500">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        {evTasks.map(renderItem)}
                        <form className="flex items-center gap-3 rounded-lg px-3 py-1.5" onSubmit={(e) => {
                          e.preventDefault();
                          const input = (e.target as HTMLFormElement).elements.namedItem(`companyTask-${sectionId}`) as HTMLInputElement;
                          if (!input.value.trim()) return;
                          dispatch({ type: "ADD_CHECKLIST_ITEM", payload: { text: input.value.trim(), eventId: sectionId } });
                          input.value = "";
                        }}>
                          <span className="h-4 w-4 text-gray-300 flex items-center justify-center text-sm">+</span>
                          <input name={`companyTask-${sectionId}`} placeholder="Add a task"
                            className="flex-1 text-sm text-gray-500 placeholder-gray-300 bg-transparent border-none focus:outline-none focus:text-gray-700" />
                        </form>
                      </div>
                    );
                  })}
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

          {(() => {
            const practiceEvents = upcomingEvents.filter((ev) => ev.category === "practice");
            const interviewEvents = upcomingEvents.filter((ev) => ev.category === "interview");

            const renderEvent = (ev: typeof upcomingEvents[0], showDot = false) => {
              const badge = typeBadge(ev);
              const isEditing = editingEventId === ev.id;

              if (isEditing) {
                const rolesForCompany = ev.companyName
                  ? Array.from(new Set(state.applications.filter((a) => a.company === ev.companyName).map((a) => a.role)))
                  : [];
                const searchQ = companySearch.toLowerCase();
                const matchedCompanies = searchQ
                  ? Array.from(new Set(state.applications.map((a) => a.company))).filter((c) => c.toLowerCase().includes(searchQ)).slice(0, 8)
                  : [];

                const categoryOptions = [
                  { value: "interview", label: "Interview", bg: "bg-indigo-100 text-indigo-700", active: "bg-indigo-600 text-white" },
                  { value: "practice", label: "Practice", bg: "bg-green-100 text-green-700", active: "bg-green-600 text-white" },
                  { value: "networking", label: "Networking", bg: "bg-amber-100 text-amber-700", active: "bg-amber-500 text-white" },
                  { value: "other", label: "Other", bg: "bg-gray-100 text-gray-600", active: "bg-gray-500 text-white" },
                ];

                // Type options depend on category
                const practiceTypes = [
                  { value: "behavioral", label: "Behavioral", bg: "bg-blue-50 text-blue-600", active: "bg-blue-500 text-white" },
                  { value: "case", label: "Case", bg: "bg-purple-50 text-purple-600", active: "bg-purple-500 text-white" },
                  { value: "other", label: "Other", bg: "bg-gray-100 text-gray-500", active: "bg-gray-500 text-white" },
                ];
                const interviewTypes = [
                  { value: "recruiter-screen", label: "Recruiter Screen", bg: "bg-teal-50 text-teal-600", active: "bg-teal-500 text-white" },
                  { value: "behavioral", label: "Behavioral", bg: "bg-blue-50 text-blue-600", active: "bg-blue-500 text-white" },
                  { value: "case", label: "Case", bg: "bg-purple-50 text-purple-600", active: "bg-purple-500 text-white" },
                  { value: "presentation", label: "Presentation", bg: "bg-orange-50 text-orange-600", active: "bg-orange-500 text-white" },
                  { value: "mixed", label: "Mixed", bg: "bg-pink-50 text-pink-600", active: "bg-pink-500 text-white" },
                  { value: "other", label: "Other", bg: "bg-gray-100 text-gray-500", active: "bg-gray-500 text-white" },
                ];
                const currentTypeOptions = ev.category === "practice" ? practiceTypes
                  : ev.category === "networking" || ev.category === "other" ? []
                  : interviewTypes;

                const stageOptions = [
                  { value: "recruiter", label: "Recruiter Screen" },
                  { value: "round-1", label: "Round 1" },
                  { value: "round-2", label: "Round 2" },
                  { value: "round-3", label: "Round 3" },
                  { value: "final", label: "Final Round" },
                  { value: "other", label: "Other" },
                ];

                // Auto-generate title from role + company
                function autoTitle(companyName: string, role: string) {
                  if (companyName && role) return `${companyName} — ${role}`;
                  if (companyName) return companyName;
                  return ev.title;
                }

                return (
                  <div key={ev.id} className="rounded-lg border border-indigo-200 bg-indigo-50/30 px-3 py-3 space-y-3">
                    {/* Title (auto-generated: role + company) */}
                    <input defaultValue={ev.title}
                      onBlur={(e) => dispatch({ type: "UPDATE_EVENT", payload: { id: ev.id, updates: { title: e.target.value } } })}
                      className="w-full rounded border border-gray-200 px-2 py-1 text-sm font-medium focus:border-indigo-400 focus:outline-none" />

                    {/* Category pills */}
                    <div>
                      <p className="mb-1 text-xs text-gray-400">Category</p>
                      <div className="flex flex-wrap gap-1.5">
                        {categoryOptions.map((opt) => (
                          <button key={opt.value}
                            onClick={() => dispatch({ type: "UPDATE_EVENT", payload: { id: ev.id, updates: { category: opt.value as EventCategory, interviewType: opt.value === "networking" ? null : ev.interviewType } } })}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${ev.category === opt.value ? opt.active : opt.bg + " opacity-60 hover:opacity-80"}`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Type pills (conditional on category) */}
                    {currentTypeOptions.length > 0 && (
                      <div>
                        <p className="mb-1 text-xs text-gray-400">Type</p>
                        <div className="flex flex-wrap gap-1.5">
                          {currentTypeOptions.map((opt) => (
                            <button key={opt.value}
                              onClick={() => dispatch({ type: "UPDATE_EVENT", payload: { id: ev.id, updates: { interviewType: ev.interviewType === opt.value ? null : opt.value as InterviewType } } })}
                              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${ev.interviewType === opt.value ? opt.active : opt.bg + " opacity-60 hover:opacity-80"}`}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Company search + Role + Stage (interviews only) */}
                    {ev.category === "interview" && (
                      <div className="space-y-2">
                        <div className="relative">
                          <p className="mb-1 text-xs text-gray-400">Company</p>
                          <input
                            value={companySearch !== "" ? companySearch : (ev.companyName || "")}
                            onChange={(e) => {
                              setCompanySearch(e.target.value);
                              if (!e.target.value) {
                                dispatch({ type: "UPDATE_EVENT", payload: { id: ev.id, updates: { companyName: "", role: "", title: ev.title } } });
                              }
                            }}
                            onFocus={() => { if (!companySearch) setCompanySearch(ev.companyName || ""); }}
                            placeholder="Search company..."
                            className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none" />
                          {searchQ && matchedCompanies.length > 0 && (
                            <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-40 overflow-y-auto">
                              {matchedCompanies.map((c) => (
                                <button key={c}
                                  onClick={() => {
                                    const firstRole = state.applications.find((a) => a.company === c)?.role ?? "";
                                    dispatch({ type: "UPDATE_EVENT", payload: { id: ev.id, updates: { companyName: c, role: firstRole, title: autoTitle(c, firstRole) } } });
                                    setCompanySearch("");
                                  }}
                                  className="block w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-indigo-50">
                                  {c}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="mb-1 text-xs text-gray-400">Role</p>
                            <select value={ev.role || ""}
                              onChange={(e) => {
                                const role = e.target.value;
                                dispatch({ type: "UPDATE_EVENT", payload: { id: ev.id, updates: { role, title: autoTitle(ev.companyName, role) } } });
                              }}
                              className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none">
                              <option value="">Role...</option>
                              {rolesForCompany.map((r) => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </div>
                          <div>
                            <p className="mb-1 text-xs text-gray-400">Stage</p>
                            <select value={ev.interviewStage || ""}
                              onChange={(e) => dispatch({ type: "UPDATE_EVENT", payload: { id: ev.id, updates: { interviewStage: (e.target.value || null) as InterviewStage | null } } })}
                              className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none">
                              <option value="">Stage...</option>
                              {stageOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Date + Times */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="mb-1 text-xs text-gray-400">Date</p>
                        <input type="date" defaultValue={ev.date}
                          onBlur={(e) => dispatch({ type: "UPDATE_EVENT", payload: { id: ev.id, updates: { date: e.target.value } } })}
                          className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none" />
                      </div>
                      <div>
                        <p className="mb-1 text-xs text-gray-400">Start</p>
                        <input type="time" defaultValue={ev.startTime}
                          onBlur={(e) => dispatch({ type: "UPDATE_EVENT", payload: { id: ev.id, updates: { startTime: e.target.value } } })}
                          className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none" />
                      </div>
                      <div>
                        <p className="mb-1 text-xs text-gray-400">End</p>
                        <input type="time" defaultValue={ev.endTime}
                          onBlur={(e) => dispatch({ type: "UPDATE_EVENT", payload: { id: ev.id, updates: { endTime: e.target.value } } })}
                          className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none" />
                      </div>
                    </div>

                    <div>
                      <p className="mb-1 text-xs text-gray-400">Notes</p>
                      <input defaultValue={ev.notes} placeholder="Notes"
                        onBlur={(e) => dispatch({ type: "UPDATE_EVENT", payload: { id: ev.id, updates: { notes: e.target.value } } })}
                        className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none" />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button onClick={() => { dispatch({ type: "DELETE_EVENT", payload: { id: ev.id } }); setEditingEventId(null); }}
                        className="text-xs text-red-500 hover:text-red-700">Delete</button>
                      <button onClick={() => { setEditingEventId(null); setCompanySearch(""); }}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Done</button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={ev.id} onClick={() => setEditingEventId(ev.id)}
                  className="cursor-pointer rounded-lg border border-gray-100 px-3 py-2.5 hover:border-indigo-200 hover:bg-indigo-50/20 transition-colors">
                  <div className="flex items-start gap-2">
                    {showDot && (
                      <div className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${dotColor(ev.category)}`} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{ev.title}</p>
                        {badge && (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}>{badge.label}</span>
                        )}
                      </div>
                      {ev.startTime && (
                        <p className="mt-0.5 text-xs text-gray-500">
                          {ev.startTime}{ev.endTime ? ` — ${ev.endTime}` : ""}
                        </p>
                      )}
                      {ev.notes && <p className="mt-0.5 text-xs text-gray-400 truncate">{ev.notes}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xs ${urgencyColor(ev.date)}`}>{daysUntil(ev.date)}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(ev.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                  {/* Per-event tasks (from checklist) */}
                  {(() => {
                    const evTasks = state.checklist.filter((t) => t.eventId === ev.id);
                    return (
                      <div className="mt-2 border-t border-gray-50 pt-2" onClick={(e) => e.stopPropagation()}>
                        {evTasks.length > 0 && (
                          <>
                            <p className="mb-1.5 text-xs text-gray-400">
                              {evTasks.filter((t) => t.completed).length}/{evTasks.length} prep tasks
                            </p>
                            <div className="space-y-1">
                              {evTasks.map((task) => (
                                <div key={task.id} className="group/task flex items-center gap-2">
                                  <input type="checkbox" checked={task.completed}
                                    onChange={() => dispatch({ type: "TOGGLE_CHECKLIST_ITEM", payload: { id: task.id } })}
                                    className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                  {editingChecklistId === task.id ? (
                                    <input defaultValue={task.text} autoFocus
                                      onBlur={(e) => {
                                        dispatch({ type: "UPDATE_CHECKLIST_ITEM", payload: { id: task.id, updates: { text: e.target.value } } });
                                        setEditingChecklistId(null);
                                      }}
                                      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditingChecklistId(null); }}
                                      className="flex-1 rounded border border-indigo-300 px-1.5 py-0.5 text-sm focus:outline-none" />
                                  ) : (
                                    <span onClick={() => setEditingChecklistId(task.id)}
                                      className={`flex-1 text-sm cursor-pointer select-none transition-all duration-200 ${task.completed ? "text-gray-400 line-through opacity-60" : "text-gray-600"}`}>
                                      {task.text}
                                    </span>
                                  )}
                                  <button onClick={() => dispatch({ type: "DELETE_CHECKLIST_ITEM", payload: { id: task.id } })}
                                    className="invisible group-hover/task:visible text-gray-300 hover:text-red-500">
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                        <form className="mt-1.5 flex gap-1.5" onSubmit={(e) => {
                          e.preventDefault();
                          const input = (e.target as HTMLFormElement).elements.namedItem("newTask") as HTMLInputElement;
                          if (!input.value.trim()) return;
                          dispatch({ type: "ADD_CHECKLIST_ITEM", payload: { text: input.value.trim(), eventId: ev.id } });
                          input.value = "";
                        }}>
                          <input name="newTask" placeholder="Add a task"
                            className="flex-1 rounded border border-transparent px-2 py-1 text-xs text-gray-500 placeholder-gray-400 focus:border-gray-200 focus:text-gray-600 focus:outline-none" />
                        </form>
                      </div>
                    );
                  })()}
                </div>
              );
            };

            return (<>
          {calendarView === "list" && (
              <div>
                {/* Sub-toggle */}
                <div className="mb-3 flex rounded-lg border border-gray-200 w-fit">
                  <button onClick={() => setListMode("chrono")}
                    className={`px-3 py-1 text-xs font-medium rounded-l-lg ${listMode === "chrono" ? "bg-gray-100 text-gray-700" : "text-gray-400 hover:bg-gray-50"}`}>
                    Chronological
                  </button>
                  <button onClick={() => setListMode("bytype")}
                    className={`px-3 py-1 text-xs font-medium rounded-r-lg ${listMode === "bytype" ? "bg-gray-100 text-gray-700" : "text-gray-400 hover:bg-gray-50"}`}>
                    By Type
                  </button>
                </div>

                {upcomingEvents.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-400">No upcoming events</p>
                ) : listMode === "chrono" ? (
                  <div className="space-y-2">
                    {upcomingEvents.map((ev) => renderEvent(ev, true))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">
                        <span className="h-2 w-2 rounded-full bg-green-500" /> Practice
                      </p>
                      <div className="space-y-2">
                        {practiceEvents.length === 0 ? (
                          <p className="py-4 text-center text-xs text-gray-300">No practice sessions</p>
                        ) : practiceEvents.map((ev) => renderEvent(ev))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">
                        <span className="h-2 w-2 rounded-full bg-indigo-500" /> Interviews
                      </p>
                      <div className="space-y-2">
                        {interviewEvents.length === 0 ? (
                          <p className="py-4 text-center text-xs text-gray-300">No upcoming interviews</p>
                        ) : interviewEvents.map((ev) => renderEvent(ev))}
                      </div>
                    </div>
                  </div>
                )}
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
                            onClick={(e) => { e.stopPropagation(); setSelectedDate(dateStr); }}
                            className={`cursor-pointer rounded px-1.5 py-0.5 text-xs truncate hover:opacity-80 ${
                              ev.category === "interview"
                                ? "bg-indigo-100 text-indigo-700"
                                : ev.category === "networking"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {ev.startTime && <span className="font-normal opacity-75">{ev.startTime} </span>}
                            {(() => {
                              const tb = typeBadge(ev);
                              return tb ? tb.label : (ev.title.length > 10 ? ev.title.slice(0, 10) + "…" : ev.title);
                            })()}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 pt-3 text-xs text-gray-400">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-500" /> Interview</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500" /> Practice</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Networking</span>
              </div>
              {/* Edit form for week view */}
              {editingEventId && (() => {
                const editEv = upcomingEvents.find((e) => e.id === editingEventId);
                return editEv ? <div className="mt-4">{renderEvent(editEv)}</div> : null;
              })()}
              {/* Selected date detail */}
              {!editingEventId && selectedDate && (
                <SelectedDatePanel
                  dateStr={selectedDate}
                  events={getEventsForDateStr(selectedDate)}
                  checklist={state.checklist}
                  dispatch={dispatch}
                  onEditEvent={(id) => setEditingEventId(id)}
                />
              )}
            </div>
          )}

          {calendarView === "month" && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <button onClick={() => setMonthOffset((o) => o - 1)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-700">{monthName}</p>
                  {monthOffset !== 0 && (
                    <button onClick={() => setMonthOffset(0)}
                      className="rounded px-2 py-0.5 text-xs text-indigo-500 hover:bg-indigo-50">Today</button>
                  )}
                </div>
                <button onClick={() => setMonthOffset((o) => o + 1)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
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
              {/* Edit form for month view */}
              {editingEventId && (() => {
                const editEv = state.events.find((e) => e.id === editingEventId);
                return editEv ? <div className="mt-4">{renderEvent(editEv)}</div> : null;
              })()}
              {/* Selected date detail */}
              {!editingEventId && selectedDate && (
                <SelectedDatePanel
                  dateStr={selectedDate}
                  events={getEventsForDateStr(selectedDate)}
                  checklist={state.checklist}
                  dispatch={dispatch}
                  onEditEvent={(id) => setEditingEventId(id)}
                />
              )}
            </div>
          )}
          </>);
          })()}
        </div>
      </div>

      {/* Add Event Modal */}
      <Modal open={showAddEvent} onClose={() => { setShowAddEvent(false); resetEventForm(); }} title="Add Event">
        <form onSubmit={handleAddEvent} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Category pills */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Category</label>
            <div className="flex gap-2">
              {([
                { value: "interview", label: "Interview", active: "bg-indigo-600 text-white", inactive: "bg-indigo-100 text-indigo-700" },
                { value: "practice", label: "Practice", active: "bg-green-600 text-white", inactive: "bg-green-100 text-green-700" },
                { value: "networking", label: "Networking", active: "bg-amber-500 text-white", inactive: "bg-amber-100 text-amber-700" },
                { value: "other", label: "Other", active: "bg-gray-500 text-white", inactive: "bg-gray-100 text-gray-600" },
              ] as const).map((opt) => (
                <button key={opt.value} type="button"
                  onClick={() => setEventCategory(opt.value)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${eventCategory === opt.value ? opt.active : opt.inactive + " opacity-60 hover:opacity-80"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
            <input type="text" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder={eventCategory === "interview" ? "Auto-generated from company + role" : "e.g. Mock interview with Sarah"} />
          </div>

          {/* Type pills (conditional on category, consistent with edit form) */}
          {eventCategory !== "networking" && eventCategory !== "other" && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Type</label>
            <div className="flex flex-wrap gap-2">
              {(eventCategory === "practice" ? [
                { value: "behavioral", label: "Behavioral", active: "bg-blue-500 text-white", inactive: "bg-blue-50 text-blue-600" },
                { value: "case", label: "Case", active: "bg-purple-500 text-white", inactive: "bg-purple-50 text-purple-600" },
                { value: "other", label: "Other", active: "bg-gray-500 text-white", inactive: "bg-gray-100 text-gray-500" },
              ] : [
                { value: "recruiter-screen", label: "Recruiter Screen", active: "bg-teal-500 text-white", inactive: "bg-teal-50 text-teal-600" },
                { value: "behavioral", label: "Behavioral", active: "bg-blue-500 text-white", inactive: "bg-blue-50 text-blue-600" },
                { value: "case", label: "Case", active: "bg-purple-500 text-white", inactive: "bg-purple-50 text-purple-600" },
                { value: "presentation", label: "Presentation", active: "bg-orange-500 text-white", inactive: "bg-orange-50 text-orange-600" },
                { value: "mixed", label: "Mixed", active: "bg-pink-500 text-white", inactive: "bg-pink-50 text-pink-600" },
                { value: "other", label: "Other", active: "bg-gray-500 text-white", inactive: "bg-gray-100 text-gray-500" },
              ] as { value: string; label: string; active: string; inactive: string }[]).map((opt) => (
                <button key={opt.value} type="button"
                  onClick={() => setEventInterviewType(eventInterviewType === opt.value ? null : opt.value as InterviewType)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${eventInterviewType === opt.value ? opt.active : opt.inactive + " opacity-60 hover:opacity-80"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          )}

          {/* Interview-specific: Company search + Role + Stage */}
          {eventCategory === "interview" && (
            <>
              <div className="relative">
                <label className="mb-1 block text-sm font-medium text-gray-700">Company</label>
                <input type="text" value={eventCompanySearch || eventCompanyName}
                  onChange={(e) => { setEventCompanySearch(e.target.value); setEventCompanyName(""); setEventRole(""); }}
                  placeholder="Search from applications..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                {eventCompanySearch && (() => {
                  const q = eventCompanySearch.toLowerCase();
                  const matches = Array.from(new Set(state.applications.map((a) => a.company)))
                    .filter((c) => c.toLowerCase().includes(q)).slice(0, 8);
                  return matches.length > 0 ? (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-40 overflow-y-auto">
                      {matches.map((c) => (
                        <button key={c} type="button"
                          onClick={() => {
                            setEventCompanyName(c);
                            setEventCompanySearch("");
                            const firstRole = state.applications.find((a) => a.company === c)?.role ?? "";
                            setEventRole(firstRole);
                          }}
                          className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-indigo-50">
                          {c}
                        </button>
                      ))}
                    </div>
                  ) : null;
                })()}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
                  <select value={eventRole} onChange={(e) => setEventRole(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                    <option value="">Select role...</option>
                    {eventCompanyName && Array.from(new Set(state.applications.filter((a) => a.company === eventCompanyName).map((a) => a.role))).map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Stage</label>
                  <select value={eventStage ?? ""} onChange={(e) => setEventStage((e.target.value || null) as InterviewStage | null)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                    <option value="">Select stage...</option>
                    {Object.entries(stageLabels).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
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
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <textarea value={eventNotes} onChange={(e) => setEventNotes(e.target.value)} rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Any details..." />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => { setShowAddEvent(false); resetEventForm(); }}>Cancel</Button>
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
  onEditEvent,
}: {
  dateStr: string;
  events: ReturnType<typeof Array.prototype.filter>;
  checklist: { id: string; text: string; completed: boolean; companyId: string | null }[];
  dispatch: React.Dispatch<{ type: "TOGGLE_CHECKLIST_ITEM"; payload: { id: string } }>;
  onEditEvent?: (id: string) => void;
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
          {(events as { id: string; title: string; category: string; startTime?: string; endTime?: string; notes: string; companyId: string | null }[]).map((ev) => {
            const tasks = ev.companyId ? checklist.filter((i) => i.companyId === ev.companyId) : [];
            return (
              <div key={ev.id} onClick={() => onEditEvent?.(ev.id)}
                className={`rounded-lg bg-white p-3 border border-gray-100 ${onEditEvent ? "cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/20 transition-colors" : ""}`}>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${ev.category === "interview" ? "bg-indigo-500" : "bg-green-500"}`} />
                  <span className="text-sm font-medium text-gray-900">{ev.title}</span>
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-xs ${
                    ev.category === "interview" ? "bg-indigo-100 text-indigo-700" : "bg-green-100 text-green-700"
                  }`}>{(() => {
                    const typeConfig: Record<string, string> = {
                      behavioral: "Behavioral", case: "Case", "recruiter-screen": "Recruiter Screen",
                      presentation: "Presentation", mixed: "Mixed",
                    };
                    const iType = (ev as unknown as { interviewType?: string }).interviewType;
                    return iType
                      ? typeConfig[iType] ?? (ev.category === "interview" ? "Interview" : "Practice")
                      : ev.category === "interview" ? "Interview" : ev.category === "practice" ? "Practice" : ev.category === "networking" ? "Networking" : "Other";
                  })()}</span>
                </div>
                {ev.startTime && (
                  <p className="mt-1 ml-4 text-xs text-gray-500">
                    {ev.startTime}{ev.endTime ? ` — ${ev.endTime}` : ""}
                  </p>
                )}
                {ev.notes && <p className="mt-0.5 ml-4 text-xs text-gray-400">{ev.notes}</p>}
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
