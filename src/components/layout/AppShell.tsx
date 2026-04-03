"use client";

import { ReactNode } from "react";
import { AppProvider } from "@/context/AppContext";
import Navbar from "./Navbar";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {children}
      </main>
    </AppProvider>
  );
}
