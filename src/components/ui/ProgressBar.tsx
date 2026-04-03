"use client";

import { useEffect, useState } from "react";

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
}

export default function ProgressBar({ value, className = "" }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(clamped), 50);
    return () => clearTimeout(timer);
  }, [clamped]);

  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-gray-200 ${className}`}>
      <div
        className="h-full rounded-full bg-indigo-500 transition-all duration-700 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
