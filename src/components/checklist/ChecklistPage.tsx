"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import Button from "@/components/ui/Button";

export default function ChecklistPage() {
  const { state, dispatch } = useApp();
  const [newItem, setNewItem] = useState("");
  const { checklist } = state;

  const completedCount = checklist.filter((i) => i.completed).length;
  const totalCount = checklist.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const text = newItem.trim();
    if (!text) return;
    dispatch({ type: "ADD_CHECKLIST_ITEM", payload: { text } });
    setNewItem("");
  }

  const incomplete = checklist.filter((i) => !i.completed);
  const completed = checklist.filter((i) => i.completed);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Prep Checklist</h1>
        <p className="mt-1 text-sm text-gray-500">
          {completedCount} of {totalCount} complete ({pct}%)
        </p>
      </div>

      <form onSubmit={handleAdd} className="mb-6 flex gap-3">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add a new item..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <Button type="submit" disabled={!newItem.trim()}>
          Add
        </Button>
      </form>

      <div className="space-y-2">
        {incomplete.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3"
          >
            <input
              type="checkbox"
              checked={false}
              onChange={() =>
                dispatch({ type: "TOGGLE_CHECKLIST_ITEM", payload: { id: item.id } })
              }
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="flex-1 text-sm text-gray-900">{item.text}</span>
            <button
              onClick={() =>
                dispatch({ type: "DELETE_CHECKLIST_ITEM", payload: { id: item.id } })
              }
              className="text-gray-400 hover:text-red-500"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}

        {completed.length > 0 && (
          <>
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Completed
              </span>
              <button
                onClick={() => dispatch({ type: "CLEAR_COMPLETED" })}
                className="text-xs text-gray-400 hover:text-red-500"
              >
                Clear completed
              </button>
            </div>
            {completed.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
              >
                <input
                  type="checkbox"
                  checked={true}
                  onChange={() =>
                    dispatch({
                      type: "TOGGLE_CHECKLIST_ITEM",
                      payload: { id: item.id },
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="flex-1 text-sm text-gray-400 line-through">
                  {item.text}
                </span>
                <button
                  onClick={() =>
                    dispatch({
                      type: "DELETE_CHECKLIST_ITEM",
                      payload: { id: item.id },
                    })
                  }
                  className="text-gray-300 hover:text-red-500"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </>
        )}

        {totalCount === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">
            No items yet. Add your first prep task above.
          </div>
        )}
      </div>
    </div>
  );
}
