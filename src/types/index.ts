export type QuestionCategory = "behavioral" | "product-case" | "role-specific";

export interface Question {
  id: string;
  text: string;
  category: QuestionCategory;
  practiced: boolean;
  storyId: string | null;
  notes: string;
  createdAt: number;
}

export type CompanyStatus =
  | "saved"
  | "no-update"
  | "interviewing"
  | "offer"
  | "rejected-no-interview"
  | "rejected-first-round"
  | "rejected-complete"
  | "no-opening"
  | "withdrew";

export interface CompanyRole {
  id: string;
  title: string;
  whyRole: string;
  roleUrl: string;
  status: CompanyStatus;
}

export interface Company {
  id: string;
  name: string;
  roles: CompanyRole[];
  companyUrl: string;
  whyCompany: string;
  notes: string;
  createdAt: number;
}

export type RecurringFrequency = "daily" | "weekly" | null;

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  dueDate: string;
  companyId: string | null;
  eventId: string | null; // null = general, string = tied to a specific event
  recurring: RecurringFrequency;
  createdAt: number;
}

export interface FeedbackEntry {
  id: string;
  text: string;
  resolved: boolean;
  createdAt: number;
}

export interface Story {
  id: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  tags: string[];
  feedback: FeedbackEntry[];
  createdAt: number;
  updatedAt: number;
}

export type EventCategory = "interview" | "practice" | "networking" | "other";

export type InterviewType = "recruiter-screen" | "case" | "behavioral" | "technical" | "system-design" | "presentation" | "mixed" | "other";
export type InterviewStage = "recruiter" | "round-1" | "round-2" | "round-3" | "final" | "other";

export interface PrepEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  category: EventCategory;
  interviewType: InterviewType | null;
  interviewStage: InterviewStage | null;
  companyId: string | null;
  companyName: string;
  role: string;
  questionsAsked: string[];
  questionsToAsk: string[];
  notes: string;
  createdAt: number;
}

export interface Application {
  id: string;
  company: string;
  role: string;
  appliedDate: string;
  method: string;
  location: string;
  verdict: string;
  notes: string;
  spokeTo: string;
  archived: boolean;
  createdAt: number;
}

export interface SavedPosition {
  id: string;
  company: string;
  role: string;
  method: string;
  url: string;
  notes: string;
  deadline: string;
  createdAt: number;
}

export interface AppState {
  questions: Question[];
  companies: Company[];
  checklist: ChecklistItem[];
  stories: Story[];
  events: PrepEvent[];
  applications: Application[];
  savedPositions: SavedPosition[];
}
