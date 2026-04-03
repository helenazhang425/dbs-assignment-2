import { AppState, Question, Company, ChecklistItem, Story } from "@/types";

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
  | { type: "ADD_CHECKLIST_ITEM"; payload: { text: string } }
  | { type: "TOGGLE_CHECKLIST_ITEM"; payload: { id: string } }
  | { type: "DELETE_CHECKLIST_ITEM"; payload: { id: string } }
  | { type: "CLEAR_COMPLETED" }
  // Stories
  | { type: "ADD_STORY"; payload: Omit<Story, "id" | "createdAt" | "updatedAt" | "feedback"> }
  | { type: "UPDATE_STORY"; payload: { id: string; updates: Partial<Omit<Story, "feedback">> } }
  | { type: "DELETE_STORY"; payload: { id: string } }
  | { type: "ADD_FEEDBACK"; payload: { storyId: string; text: string } }
  | { type: "TOGGLE_FEEDBACK"; payload: { storyId: string; feedbackId: string } }
  | { type: "DELETE_FEEDBACK"; payload: { storyId: string; feedbackId: string } };

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

    default:
      return state;
  }
}
