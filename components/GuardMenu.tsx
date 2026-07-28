"use client";

import { Users, UserPlus, History } from "lucide-react";

export function GuardMenu({
  onSelect,
}: {
  onSelect: (view: "attendance" | "visitor" | "history") => void;
}) {
  return (
    <main className="min-h-screen bg-[#F7F6FB] p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[#2EC4B6] mb-1">
            Gate Station
          </p>
          <h1 className="text-2xl font-bold text-[#2E2A5E]">
            What are you logging?
          </h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <button
            onClick={() => onSelect("attendance")}
            className="group rounded-2xl border border-[#E4E1F0] bg-white p-8 text-center hover:border-[#494395] hover:shadow-lg hover:shadow-[#494395]/10 transition-all"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#EAF7F5] group-hover:bg-[#2EC4B6] transition-colors">
              <Users className="h-6 w-6 text-[#2EC4B6] group-hover:text-white transition-colors" />
            </div>
            <p className="font-semibold text-[#2E2A5E]">Staff Check-In/Out</p>
            <p className="mt-1 text-xs text-[#7A759A]">
              Log arrivals and departures
            </p>
          </button>
          <button
            onClick={() => onSelect("visitor")}
            className="group rounded-2xl border border-[#E4E1F0] bg-white p-8 text-center hover:border-[#494395] hover:shadow-lg hover:shadow-[#494395]/10 transition-all"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#EDEBFA] group-hover:bg-[#494395] transition-colors">
              <UserPlus className="h-6 w-6 text-[#494395] group-hover:text-white transition-colors" />
            </div>
            <p className="font-semibold text-[#2E2A5E]">Visitor Entry</p>
            <p className="mt-1 text-xs text-[#7A759A]">Issue a gate pass</p>
          </button>
          <button
            onClick={() => onSelect("history")}
            className="group rounded-2xl border border-[#E4E1F0] bg-white p-8 text-center hover:border-[#494395] hover:shadow-lg hover:shadow-[#494395]/10 transition-all sm:col-span-2"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#F7F6FB] group-hover:bg-[#7A759A] transition-colors">
              <History className="h-6 w-6 text-[#7A759A] group-hover:text-white transition-colors" />
            </div>
            <p className="font-semibold text-[#2E2A5E]">History</p>
            <p className="mt-1 text-xs text-[#7A759A]">
              View recent visitor and staff logs
            </p>
          </button>
        </div>
      </div>
    </main>
  );
}
