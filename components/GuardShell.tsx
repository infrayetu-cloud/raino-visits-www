"use client";

import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useGuardSession } from "@/lib/context/guard-session-context";

interface GuardShellProps {
  children: React.ReactNode;
  onBackToMenu?: () => void;
}

export function GuardShell({ children, onBackToMenu }: GuardShellProps) {
  const { activeGuard, clearActiveGuard } = useGuardSession();

  function handleSwitch() {
    if (
      window.confirm(
        "Switch to a different guard? Any unsaved entry will be lost.",
      )
    ) {
      clearActiveGuard();
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F6FB]">
      <div className="bg-[#494395] border-b-4 border-[#2EC4B6] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {onBackToMenu && (
            <button
              type="button"
              onClick={onBackToMenu}
              className="rounded-full p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Back to menu"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
            <ShieldCheck className="h-4 w-4 text-[#2EC4B6]" />
            <span className="text-sm font-semibold text-white">
              {activeGuard?.name}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSwitch}
          className="text-xs font-semibold text-white/70 hover:text-white transition-colors"
        >
          Switch Guard
        </button>
      </div>
      {children}
    </div>
  );
}
