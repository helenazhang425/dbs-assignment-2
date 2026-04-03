"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import Button from "@/components/ui/Button";

export default function CompanyDetail({ companyId }: { companyId: string }) {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const company = state.companies.find((c) => c.id === companyId);

  const [newQuestionAsked, setNewQuestionAsked] = useState("");
  const [newQuestionToAsk, setNewQuestionToAsk] = useState("");

  if (!company) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Company not found.</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push("/companies")}>
          Back to Companies
        </Button>
      </div>
    );
  }

  function update(updates: Record<string, unknown>) {
    dispatch({ type: "UPDATE_COMPANY", payload: { id: companyId, updates } });
  }

  function addQuestionAsked(e: React.FormEvent) {
    e.preventDefault();
    if (!newQuestionAsked.trim()) return;
    update({ questionsAsked: [...company!.questionsAsked, newQuestionAsked.trim()] });
    setNewQuestionAsked("");
  }

  function removeQuestionAsked(index: number) {
    update({
      questionsAsked: company!.questionsAsked.filter((_, i) => i !== index),
    });
  }

  function addQuestionToAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!newQuestionToAsk.trim()) return;
    update({ questionsToAsk: [...company!.questionsToAsk, newQuestionToAsk.trim()] });
    setNewQuestionToAsk("");
  }

  function removeQuestionToAsk(index: number) {
    update({
      questionsToAsk: company!.questionsToAsk.filter((_, i) => i !== index),
    });
  }

  function handleDelete() {
    dispatch({ type: "DELETE_COMPANY", payload: { id: companyId } });
    router.push("/companies");
  }

  return (
    <div>
      <button
        onClick={() => router.push("/companies")}
        className="mb-6 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Companies
      </button>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <input
            value={company.name}
            onChange={(e) => update({ name: e.target.value })}
            className="text-2xl font-bold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0 w-full"
          />
          <input
            value={company.role}
            onChange={(e) => update({ role: e.target.value })}
            placeholder="Role title"
            className="mt-1 text-sm text-gray-500 bg-transparent border-none focus:outline-none focus:ring-0 p-0 w-full"
          />
        </div>
        <Button variant="danger" size="sm" onClick={handleDelete}>
          Delete
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Interview Date
            </label>
            <input
              type="date"
              value={company.interviewDate}
              onChange={(e) => update({ interviewDate: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Why this company?
            </label>
            <textarea
              value={company.whyCompany}
              onChange={(e) => update({ whyCompany: e.target.value })}
              rows={4}
              placeholder="What excites you about this company?"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Why this role?
            </label>
            <textarea
              value={company.whyRole}
              onChange={(e) => update({ whyRole: e.target.value })}
              rows={4}
              placeholder="Why is this role a fit for you?"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              value={company.notes}
              onChange={(e) => update({ notes: e.target.value })}
              rows={4}
              placeholder="General notes, recruiter info, etc."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Questions Asked */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Questions They Asked
            </label>
            <div className="space-y-2">
              {company.questionsAsked.map((q, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                >
                  <span className="flex-1 text-sm text-gray-700">{q}</span>
                  <button
                    onClick={() => removeQuestionAsked(i)}
                    className="text-gray-300 hover:text-red-500"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={addQuestionAsked} className="mt-2 flex gap-2">
              <input
                type="text"
                value={newQuestionAsked}
                onChange={(e) => setNewQuestionAsked(e.target.value)}
                placeholder="Add a question they asked..."
                className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <Button size="sm" type="submit" disabled={!newQuestionAsked.trim()}>
                Add
              </Button>
            </form>
          </div>

          {/* Questions to Ask */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Questions to Ask Them
            </label>
            <div className="space-y-2">
              {company.questionsToAsk.map((q, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                >
                  <span className="flex-1 text-sm text-gray-700">{q}</span>
                  <button
                    onClick={() => removeQuestionToAsk(i)}
                    className="text-gray-300 hover:text-red-500"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={addQuestionToAsk} className="mt-2 flex gap-2">
              <input
                type="text"
                value={newQuestionToAsk}
                onChange={(e) => setNewQuestionToAsk(e.target.value)}
                placeholder="Add a question to ask..."
                className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <Button size="sm" type="submit" disabled={!newQuestionToAsk.trim()}>
                Add
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
