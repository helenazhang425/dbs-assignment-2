import { AppState, Question, Company, ChecklistItem, Story, PrepEvent, Application, SavedPosition } from "@/types";

export type AppAction =
  // Questions
  | { type: "ADD_QUESTION"; payload: Omit<Question, "id" | "createdAt" | "practiced"> }
  | { type: "UPDATE_QUESTION"; payload: { id: string; updates: Partial<Question> } }
  | { type: "TOGGLE_PRACTICED"; payload: { id: string } }
  | { type: "DELETE_QUESTION"; payload: { id: string } }
  // Companies
  | { type: "ADD_COMPANY"; payload: Omit<Company, "id" | "createdAt"> }
  | { type: "UPDATE_COMPANY"; payload: { id: string; updates: Partial<Company> } }
  | { type: "DELETE_COMPANY"; payload: { id: string } }
  // Checklist
  | { type: "ADD_CHECKLIST_ITEM"; payload: { text: string; dueDate?: string; companyId?: string | null; eventId?: string | null; recurring?: "daily" | "weekly" | null } }
  | { type: "TOGGLE_CHECKLIST_ITEM"; payload: { id: string } }
  | { type: "UPDATE_CHECKLIST_ITEM"; payload: { id: string; updates: Partial<ChecklistItem> } }
  | { type: "DELETE_CHECKLIST_ITEM"; payload: { id: string } }
  | { type: "CLEAR_COMPLETED" }
  // Stories
  | { type: "ADD_STORY"; payload: Omit<Story, "id" | "createdAt" | "updatedAt" | "feedback"> }
  | { type: "UPDATE_STORY"; payload: { id: string; updates: Partial<Omit<Story, "feedback">> } }
  | { type: "DELETE_STORY"; payload: { id: string } }
  | { type: "ADD_FEEDBACK"; payload: { storyId: string; text: string } }
  | { type: "TOGGLE_FEEDBACK"; payload: { storyId: string; feedbackId: string } }
  | { type: "DELETE_FEEDBACK"; payload: { storyId: string; feedbackId: string } }
  // Events
  | { type: "ADD_EVENT"; payload: Omit<PrepEvent, "id" | "createdAt"> }
  | { type: "UPDATE_EVENT"; payload: { id: string; updates: Partial<PrepEvent> } }
  | { type: "DELETE_EVENT"; payload: { id: string } }
  // Applications
  | { type: "ADD_APPLICATION"; payload: Omit<Application, "id" | "createdAt"> }
  | { type: "UPDATE_APPLICATION"; payload: { id: string; updates: Partial<Application> } }
  | { type: "DELETE_APPLICATION"; payload: { id: string } }
  // Saved Positions
  | { type: "ADD_SAVED_POSITION"; payload: Omit<SavedPosition, "id" | "createdAt"> }
  | { type: "UPDATE_SAVED_POSITION"; payload: { id: string; updates: Partial<SavedPosition> } }
  | { type: "DELETE_SAVED_POSITION"; payload: { id: string } }
  | { type: "CONVERT_TO_APPLICATION"; payload: { id: string } };

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // Questions
    case "ADD_QUESTION":
      return {
        ...state,
        questions: [
          ...state.questions,
          {
            ...action.payload,
            id: crypto.randomUUID(),
            practiced: false,
            createdAt: Date.now(),
          },
        ],
      };
    case "UPDATE_QUESTION":
      return {
        ...state,
        questions: state.questions.map((q) =>
          q.id === action.payload.id ? { ...q, ...action.payload.updates } : q
        ),
      };
    case "TOGGLE_PRACTICED":
      return {
        ...state,
        questions: state.questions.map((q) =>
          q.id === action.payload.id ? { ...q, practiced: !q.practiced } : q
        ),
      };
    case "DELETE_QUESTION":
      return {
        ...state,
        questions: state.questions.filter((q) => q.id !== action.payload.id),
      };

    // Companies
    case "ADD_COMPANY":
      return {
        ...state,
        companies: [
          ...state.companies,
          {
            ...action.payload,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
          },
        ],
      };
    case "UPDATE_COMPANY":
      return {
        ...state,
        companies: state.companies.map((c) =>
          c.id === action.payload.id ? { ...c, ...action.payload.updates } : c
        ),
      };
    case "DELETE_COMPANY":
      return {
        ...state,
        companies: state.companies.filter((c) => c.id !== action.payload.id),
      };

    // Checklist
    case "ADD_CHECKLIST_ITEM":
      return {
        ...state,
        checklist: [
          ...state.checklist,
          {
            id: crypto.randomUUID(),
            text: action.payload.text,
            completed: false,
            dueDate: action.payload.dueDate ?? "",
            companyId: action.payload.companyId ?? null,
            eventId: action.payload.eventId ?? null,
            recurring: action.payload.recurring ?? null,
            createdAt: Date.now(),
          },
        ],
      };
    case "TOGGLE_CHECKLIST_ITEM":
      return {
        ...state,
        checklist: state.checklist.map((item) =>
          item.id === action.payload.id
            ? { ...item, completed: !item.completed }
            : item
        ),
      };
    case "UPDATE_CHECKLIST_ITEM":
      return {
        ...state,
        checklist: state.checklist.map((item) =>
          item.id === action.payload.id
            ? { ...item, ...action.payload.updates }
            : item
        ),
      };
    case "DELETE_CHECKLIST_ITEM":
      return {
        ...state,
        checklist: state.checklist.filter((item) => item.id !== action.payload.id),
      };
    case "CLEAR_COMPLETED":
      return {
        ...state,
        checklist: state.checklist.filter((item) => !item.completed),
      };

    // Stories
    case "ADD_STORY":
      return {
        ...state,
        stories: [
          ...state.stories,
          {
            ...action.payload,
            id: crypto.randomUUID(),
            feedback: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
      };
    case "UPDATE_STORY":
      return {
        ...state,
        stories: state.stories.map((s) =>
          s.id === action.payload.id
            ? { ...s, ...action.payload.updates, updatedAt: Date.now() }
            : s
        ),
      };
    case "DELETE_STORY":
      return {
        ...state,
        stories: state.stories.filter((s) => s.id !== action.payload.id),
      };
    case "ADD_FEEDBACK":
      return {
        ...state,
        stories: state.stories.map((s) =>
          s.id === action.payload.storyId
            ? {
                ...s,
                feedback: [
                  ...s.feedback,
                  {
                    id: crypto.randomUUID(),
                    text: action.payload.text,
                    resolved: false,
                    createdAt: Date.now(),
                  },
                ],
                updatedAt: Date.now(),
              }
            : s
        ),
      };
    case "TOGGLE_FEEDBACK":
      return {
        ...state,
        stories: state.stories.map((s) =>
          s.id === action.payload.storyId
            ? {
                ...s,
                feedback: s.feedback.map((f) =>
                  f.id === action.payload.feedbackId
                    ? { ...f, resolved: !f.resolved }
                    : f
                ),
              }
            : s
        ),
      };
    case "DELETE_FEEDBACK":
      return {
        ...state,
        stories: state.stories.map((s) =>
          s.id === action.payload.storyId
            ? {
                ...s,
                feedback: s.feedback.filter(
                  (f) => f.id !== action.payload.feedbackId
                ),
              }
            : s
        ),
      };

    // Events
    case "ADD_EVENT":
      return {
        ...state,
        events: [
          ...state.events,
          {
            ...action.payload,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
          },
        ],
      };
    case "UPDATE_EVENT":
      return {
        ...state,
        events: state.events.map((ev) =>
          ev.id === action.payload.id ? { ...ev, ...action.payload.updates } : ev
        ),
      };
    case "DELETE_EVENT":
      return {
        ...state,
        events: state.events.filter((ev) => ev.id !== action.payload.id),
      };

    // Applications
    case "ADD_APPLICATION":
      return {
        ...state,
        applications: [
          ...state.applications,
          { ...action.payload, id: crypto.randomUUID(), createdAt: Date.now() },
        ],
      };
    case "UPDATE_APPLICATION":
      return {
        ...state,
        applications: state.applications.map((a) =>
          a.id === action.payload.id ? { ...a, ...action.payload.updates } : a
        ),
      };
    case "DELETE_APPLICATION":
      return {
        ...state,
        applications: state.applications.filter((a) => a.id !== action.payload.id),
      };

    // Saved Positions
    case "ADD_SAVED_POSITION":
      return {
        ...state,
        savedPositions: [
          ...state.savedPositions,
          { ...action.payload, id: crypto.randomUUID(), createdAt: Date.now() },
        ],
      };
    case "UPDATE_SAVED_POSITION":
      return {
        ...state,
        savedPositions: state.savedPositions.map((sp) =>
          sp.id === action.payload.id ? { ...sp, ...action.payload.updates } : sp
        ),
      };
    case "DELETE_SAVED_POSITION":
      return {
        ...state,
        savedPositions: state.savedPositions.filter((sp) => sp.id !== action.payload.id),
      };
    case "CONVERT_TO_APPLICATION": {
      const pos = state.savedPositions.find((sp) => sp.id === action.payload.id);
      if (!pos) return state;
      return {
        ...state,
        savedPositions: state.savedPositions.filter((sp) => sp.id !== action.payload.id),
        applications: [
          ...state.applications,
          {
            id: crypto.randomUUID(),
            company: pos.company,
            role: pos.role,
            appliedDate: new Date().toISOString().slice(0, 10),
            method: "",
            location: "",
            verdict: "No Update",
            notes: pos.notes,
            spokeTo: "",
            createdAt: Date.now(),
          },
        ],
      };
    }

    default:
      return state;
  }
}
