import type { ReactElement } from "react";

export function UndoIcon({ className = "h-4 w-4" }: { className?: string }): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      style={{ transform: "translateY(-2px)" }}
      strokeWidth="1.8"
    >
      <path d="M9 7 5 11l4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 11h7a6 6 0 1 1 0 12h-1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
