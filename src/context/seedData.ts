import { AppState } from "@/types";

export const seedData: AppState = {
  questions: [
    {
      id: "q1",
      text: "Tell me about a time you had to deal with a difficult team member.",
      category: "behavioral",
      practiced: false,
      storyId: null,
      notes: "",
      createdAt: Date.now() - 86400000 * 5,
    },
    {
      id: "q2",
      text: "Describe a situation where you had to make a decision with incomplete information.",
      category: "behavioral",
      practiced: true,
      storyId: "s1",
      notes: "Focus on the framework I used to evaluate options.",
      createdAt: Date.now() - 86400000 * 4,
    },
    {
      id: "q3",
      text: "Walk me through how you would prioritize features for a new product launch.",
      category: "product-case",
      practiced: false,
      storyId: null,
      notes: "",
      createdAt: Date.now() - 86400000 * 3,
    },
    {
      id: "q4",
      text: "How would you measure the success of a new feature?",
      category: "product-case",
      practiced: false,
      storyId: null,
      notes: "",
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: "q5",
      text: "Tell me about a time you failed and what you learned from it.",
      category: "behavioral",
      practiced: false,
      storyId: null,
      notes: "",
      createdAt: Date.now() - 86400000,
    },
    {
      id: "q6",
      text: "How do you stay current with industry trends and technologies?",
      category: "role-specific",
      practiced: false,
      storyId: null,
      notes: "",
      createdAt: Date.now(),
    },
    {
      id: "q7",
      text: "Describe your approach to debugging a complex system issue.",
      category: "role-specific",
      practiced: false,
      storyId: null,
      notes: "",
      createdAt: Date.now(),
    },
    {
      id: "q8",
      text: "Tell me about a time you influenced a decision without having authority.",
      category: "behavioral",
      practiced: false,
      storyId: null,
      notes: "",
      createdAt: Date.now(),
    },
  ],

  companies: [
    {
      id: "c1",
      name: "Acme Corp",
      role: "Software Engineer",
      interviewDate: "2026-04-15",
      whyCompany: "Strong engineering culture, interesting scale problems.",
      whyRole: "Opportunity to work on distributed systems and grow technically.",
      notes: "Recruiter mentioned team is growing fast. Focus on system design in interviews.",
      questionsAsked: ["Tell me about yourself", "System design: URL shortener"],
      questionsToAsk: [
        "What does a typical day look like on the team?",
        "How do you approach technical debt?",
      ],
      createdAt: Date.now() - 86400000 * 3,
    },
  ],

  checklist: [
    { id: "cl1", text: "Update resume", completed: true, createdAt: Date.now() - 86400000 * 7 },
    { id: "cl2", text: "Prepare 3 STAR stories", completed: false, createdAt: Date.now() - 86400000 * 6 },
    { id: "cl3", text: "Research target companies", completed: false, createdAt: Date.now() - 86400000 * 5 },
    { id: "cl4", text: "Practice answering out loud", completed: false, createdAt: Date.now() - 86400000 * 4 },
    { id: "cl5", text: "Prepare questions to ask interviewers", completed: false, createdAt: Date.now() - 86400000 * 3 },
    { id: "cl6", text: "Do a mock interview with a friend", completed: false, createdAt: Date.now() - 86400000 * 2 },
  ],

  stories: [
    {
      id: "s1",
      title: "Led migration to new data pipeline",
      situation:
        "Our team's data pipeline was outdated and causing frequent outages, affecting downstream analytics for 50+ stakeholders.",
      task: "I was tasked with leading the migration to a new pipeline architecture within a 3-month deadline.",
      action:
        "I mapped all dependencies, created a phased migration plan, set up parallel pipelines for testing, and coordinated with 4 teams to ensure a smooth transition.",
      result:
        "We completed the migration 2 weeks early with zero downtime. Pipeline reliability improved from 94% to 99.8%.",
      tags: ["leadership", "technical", "project-management"],
      feedback: [
        {
          id: "f1",
          text: "Add more detail about how you handled disagreements during the planning phase.",
          resolved: false,
          createdAt: Date.now() - 86400000,
        },
        {
          id: "f2",
          text: "Quantify the cost savings from improved reliability.",
          resolved: true,
          createdAt: Date.now() - 86400000 * 2,
        },
      ],
      createdAt: Date.now() - 86400000 * 5,
      updatedAt: Date.now() - 86400000,
    },
  ],
};
