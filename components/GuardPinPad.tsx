/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { Delete, ShieldCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { listGuards, startGuardSession } from "@/lib/api";
import { useGuardSession } from "@/lib/context/guard-session-context";

interface Guard {
  id: string;
  name: string;
}

export function GuardPinPad() {
  const { setActiveGuard } = useGuardSession();
  const [guards, setGuards] = useState<Guard[]>([]);
  const [selectedGuardId, setSelectedGuardId] = useState("");
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchGuards() {
    setLoading(true);
    const data = await listGuards();
    setGuards(data);
    setLoading(false);

    if (data.length === 0) {
      toast.error("Connection Failed", {
        description:
          "Could not load guard profiles. Check backend server connection.",
      });
    }
  }

  useEffect(() => {
    fetchGuards();
  }, []);

  function press(digit: string) {
    if (pin.length >= 6) return;
    setPin((p) => p + digit);
  }

  function backspace() {
    setPin((p) => p.slice(0, -1));
  }

  async function submit() {
    if (!selectedGuardId || pin.length < 4) return;
    setSubmitting(true);
    try {
      const result = await startGuardSession(selectedGuardId, pin);
      if (result.success) {
        setActiveGuard({
          id: result.data.guard_id,
          name: result.data.guard_name,
          token: result.data.guard_token,
          expiresAt: Date.now() + result.data.expires_in * 1000,
        });
        toast.success(`Welcome, ${result.data.guard_name}`);
      } else {
        toast.error("Sign-In Failed", {
          description: result.data?.error || "Invalid PIN",
        });
        setPin("");
      }
    } catch {
      toast.error("Network Error", {
        description: "Could not connect to server",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen p-4 flex items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center space-y-6 shadow-2xl shadow-black/20">
        <div>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#494395]">
            <ShieldCheck className="h-7 w-7 text-[#2EC4B6]" />
          </div>
          <h1 className="text-xl font-bold text-[#2E2A5E]">Guard Sign-In</h1>
          <p className="text-sm text-[#7A759A]">
            Select your name and enter your PIN
          </p>
        </div>

        <div className="space-y-2">
          <select
            value={selectedGuardId}
            onChange={(e) => setSelectedGuardId(e.target.value)}
            disabled={loading || guards.length === 0}
            className="w-full h-11 rounded-lg border border-[#E4E1F0] px-3 text-sm text-[#2E2A5E] focus:border-[#494395] focus:outline-none focus:ring-2 focus:ring-[#494395]/20"
          >
            <option value="">Select your name…</option>
            {guards.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          {guards.length === 0 && !loading && (
            <button
              type="button"
              onClick={fetchGuards}
              className="text-xs font-semibold text-[#494395] hover:text-[#2E2A5E] flex items-center justify-center gap-1 mx-auto pt-1"
            >
              <RefreshCw className="h-3 w-3" /> Retry Connection
            </button>
          )}
        </div>

        <div className="flex justify-center gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`h-3 w-3 rounded-full transition-colors ${
                i < pin.length ? "bg-[#2EC4B6]" : "bg-[#E4E1F0]"
              }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => press(d)}
              disabled={loading || guards.length === 0}
              style={{ fontFamily: "var(--font-geist-mono)" }}
              className="h-14 rounded-xl border border-[#E4E1F0] text-lg font-medium text-[#2E2A5E] hover:border-[#494395] hover:bg-[#EDEBFA] active:bg-[#494395] active:text-white transition-colors disabled:opacity-40"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            onClick={backspace}
            disabled={loading || guards.length === 0}
            className="h-14 rounded-xl border border-[#E4E1F0] flex items-center justify-center text-[#7A759A] hover:border-[#494395] hover:bg-[#EDEBFA] transition-colors disabled:opacity-40"
            aria-label="Backspace"
          >
            <Delete className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => press("0")}
            disabled={loading || guards.length === 0}
            style={{ fontFamily: "var(--font-geist-mono)" }}
            className="h-14 rounded-xl border border-[#E4E1F0] text-lg font-medium text-[#2E2A5E] hover:border-[#494395] hover:bg-[#EDEBFA] active:bg-[#494395] active:text-white transition-colors disabled:opacity-40"
          >
            0
          </button>
          <div />
        </div>

        <button
          onClick={submit}
          disabled={!selectedGuardId || pin.length < 4 || submitting || loading}
          className="w-full h-12 rounded-xl bg-[#494395] hover:bg-[#3A3578] text-white font-semibold transition-colors disabled:opacity-40 disabled:hover:bg-[#494395]"
        >
          {submitting ? "Verifying…" : "Sign In"}
        </button>
      </div>
    </main>
  );
}
