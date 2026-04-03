"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";

export default function CompanyList() {
  const { state, dispatch } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    dispatch({
      type: "ADD_COMPANY",
      payload: {
        name: name.trim(),
        role: role.trim(),
        interviewDate: "",
        status: "saved",
        whyCompany: "",
        whyRole: "",
        notes: "",
        questionsAsked: [],
        questionsToAsk: [],
      },
    });
    setName("");
    setRole("");
    setShowAdd(false);
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="mt-1 text-sm text-gray-500">
            {state.companies.length} {state.companies.length === 1 ? "company" : "companies"} tracked
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>Add Company</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {state.companies.map((c) => (
          <Link key={c.id} href={`/companies/${c.id}`}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <h3 className="font-semibold text-gray-900">{c.name}</h3>
              {c.role && (
                <p className="mt-1 text-sm text-gray-500">{c.role}</p>
              )}
              {c.interviewDate && (
                <p className="mt-2 text-xs text-indigo-500">
                  Interview: {new Date(c.interviewDate).toLocaleDateString()}
                </p>
              )}
              <div className="mt-3 flex gap-3 text-xs text-gray-400">
                <span>{c.questionsToAsk.length} Qs to ask</span>
                <span>{c.questionsAsked.length} Qs asked</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {state.companies.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-400">
          No companies yet. Add one to start your research.
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Company">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Company Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. Google"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Role
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. Software Engineer"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Company</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
