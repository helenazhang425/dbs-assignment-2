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

export interface Company {
  id: string;
  name: string;
  role: string;
  interviewDate: string;
  whyCompany: string;
  whyRole: string;
  notes: string;
  questionsAsked: string[];
  questionsToAsk: string[];
  createdAt: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
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

export interface AppState {
  questions: Question[];
  companies: Company[];
  checklist: ChecklistItem[];
  stories: Story[];
}
