@AGENTS.md

# InterviewReady — Interview Prep Toolkit

## Overview
A multi-page Next.js + Tailwind app for personal interview preparation. All data is stored in client-side React state (in-memory only — resets on page refresh). No database, no localStorage.

**Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript

## Pages

### 1. Dashboard (`/`)
- Home page showing progress across all features
- Stat cards: questions practiced, stories written, checklist completion %, companies researched
- Quick links to each section

### 2. Practice Questions (`/questions`)
- Pre-loaded common questions + user can add their own
- Categories: behavioral, product/case, role-specific
- Per question: text, category, practiced toggle, linked story (optional), notes
- Filter by category

### 3. Companies (`/companies` → `/companies/[id]`)
- List page with company cards
- Detail page (dynamic route) per company with:
  - Company name, role, interview date
  - "Why this company?" and "Why this role?" textareas
  - Notes
  - Questions they asked (list)
  - Questions to ask them (list)

### 4. Checklist (`/checklist`)
- Straightforward to-do list
- Add items, check off, delete, clear completed
- Shows completion count

### 5. Stories (`/stories`)
- STAR format: Situation, Task, Action, Result
- Edit stories in place
- Feedback section per story: add entries, cross out when implemented
- Suggestions system: guiding questions ("What was the measurable outcome?") and one-click improvement tips ("Add quantifiable results") — clicking a tip adds it as feedback

## Data Model

```typescript
type QuestionCategory = "behavioral" | "product-case" | "role-specific";

interface Question {
  id: string;
  text: string;
  category: QuestionCategory;
  practiced: boolean;
  storyId: string | null;
  notes: string;
  createdAt: number;
}

interface Company {
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

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

interface FeedbackEntry {
  id: string;
  text: string;
  resolved: boolean;
  createdAt: number;
}

interface Story {
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

interface AppState {
  questions: Question[];
  companies: Company[];
  checklist: ChecklistItem[];
  stories: Story[];
}
```

## Architecture

- **State:** Single React Context + `useReducer` wrapping the entire app (`AppContext.tsx`)
- **Seed data:** Pre-loaded sample data in `seedData.ts` so the app isn't empty on first load
- **Layout:** `AppShell` ("use client") wraps the context provider + top navbar + main content area
- **Pages:** Each `page.tsx` is a thin server component that renders its client page component
- **Dynamic routes:** `params` is a Promise in Next.js 16 — must `await params` in `[id]` pages

## Style

- Light & airy: white backgrounds, soft gray borders, generous whitespace
- Accent color: indigo-500/600
- Cards: `rounded-xl border border-gray-200 bg-white shadow-sm`
- Font: Geist Sans (configured via next/font)
- Responsive: mobile-first grid layouts

## Build Approach

Build and polish one page at a time:
1. Dashboard (homepage)
2. A form page (e.g., Stories or Companies add/edit)
3. Dynamic route (Companies detail `/companies/[id]`)
4. Overview/listing page (Questions or Checklist)

Verify at least one interaction per page using Playwright MCP.
