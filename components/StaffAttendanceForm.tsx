"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Loader2, X, LogOut, Plus } from "lucide-react";
import {
  searchHosts,
  checkInStaff,
  checkOutStaff,
  listCheckedInStaff,
} from "@/lib/api";

import { useGuardSession } from "@/lib/context/guard-session-context";
import { Host } from "./VisitorEntryForm";

interface StaffUser {
  id: string;
  names: string; // ✅ Plural 'names' to match User.names
  phonenumber: string; // ✅ Matches User.phonenumber
}

interface AttendanceRecord {
  id: string;
  staff_id: string;
  staff?: StaffUser;
  check_in_time: string;
}

export function StaffAttendanceForm() {
  const { activeGuard, clearActiveGuard } = useGuardSession();
  const [view, setView] = useState<"list" | "new">("list");

  // --- list view ---
  const [rows, setRows] = useState<AttendanceRecord[]>([]);
  const [listSearch, setListSearch] = useState("");
  const [listLoading, setListLoading] = useState(false);
  const [confirmOutStaffId, setConfirmOutStaffId] = useState<string | null>(
    null,
  );
  const [checkingOutStaffId, setCheckingOutStaffId] = useState<string | null>(
    null,
  );

  const refreshList = useCallback(async () => {
    setListLoading(true);
    try {
      const results = await listCheckedInStaff(listSearch);
      setRows(results);
    } catch {
      toast.error("Could not load checked-in staff");
    } finally {
      setListLoading(false);
    }
  }, [listSearch]);

  useEffect(() => {
    if (view !== "list") return;
    const timer = setTimeout(refreshList, 300);
    return () => clearTimeout(timer);
  }, [view, refreshList]);

  async function handleCheckOut(staffId: string) {
    if (!activeGuard) return;
    setCheckingOutStaffId(staffId);
    try {
      const result = await checkOutStaff(staffId, activeGuard.token);
      if (result.success) {
        toast.success("Checked out");
        setConfirmOutStaffId(null);
        // Optimistically drop it from the list rather than waiting on a full refetch
        setRows((prev) => prev.filter((r) => r.staff_id !== staffId));
      } else if (result.data?.code === "GUARD_SESSION_REQUIRED") {
        toast.error("Session expired", {
          description: "Please sign in again with your PIN",
        });
        clearActiveGuard();
      } else {
        toast.error("Check-out failed", { description: result.data?.error });
      }
    } catch {
      toast.error("Network error", {
        description: "Could not connect to server",
      });
    } finally {
      setCheckingOutStaffId(null);
    }
  }

  // --- new check-in view ---
  const [searchInput, setSearchInput] = useState("");
  const [agents, setAgents] = useState<StaffUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<StaffUser | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      !searchInput.trim() ||
      (selectedAgent && selectedAgent.names === searchInput)
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAgents([]);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(async () => {
      const results = await searchHosts(searchInput);
      setAgents(results);
      setIsSearching(false);
      setShowDropdown(true);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput, selectedAgent]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleConfirmCheckIn() {
    if (!selectedAgent || !activeGuard) return;
    setSubmitting(true);
    try {
      const result = await checkInStaff(selectedAgent.id, activeGuard.token);
      if (result.success) {
        toast.success(`${selectedAgent.names} checked in`);
        setSelectedAgent(null);
        setSearchInput("");
        setView("list");
      } else if (result.data?.code === "GUARD_SESSION_REQUIRED") {
        toast.error("Session expired", {
          description: "Please sign in again with your PIN",
        });
        clearActiveGuard();
      } else {
        toast.error("Check-in failed", { description: result.data?.error });
      }
    } catch {
      toast.error("Network error", {
        description: "Could not connect to server",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (view === "new") {
    return (
      <main className="min-h-screen bg-white p-4">
        <div className="mx-auto max-w-xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            New Check-In
          </h1>

          <div className="relative mb-4" ref={wrapperRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search staff name or phone…"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setSelectedAgent(null);
                }}
                onFocus={() => searchInput.trim() && setShowDropdown(true)}
                className="pl-9 pr-9 h-11"
                autoComplete="off"
              />
              {selectedAgent && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAgent(null);
                    setSearchInput("");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear selected staff"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {isSearching && !selectedAgent && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
              )}
            </div>

            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {isSearching ? (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    Searching…
                  </div>
                ) : agents.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    No staff found.
                  </div>
                ) : (
                  agents.map((agent) => (
                    <button
                      key={agent.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSelectedAgent(agent);
                        setSearchInput(agent.names);
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <div className="font-medium text-sm text-gray-900">
                        {agent.names}
                      </div>
                      <div className="text-xs text-gray-500">
                        {agent.phonenumber || agent.phonenumber}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="w-1/3 h-11"
              onClick={() => setView("list")}
            >
              Cancel
            </Button>
            <Button
              className="w-2/3 h-11 bg-gray-900 hover:bg-gray-800 text-white"
              disabled={!selectedAgent || submitting}
              onClick={handleConfirmCheckIn}
            >
              {submitting ? "Checking in…" : "Confirm Check-In"}
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white p-4">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Checked-In Staff</h1>
          <Button
            onClick={() => setView("new")}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            <Plus className="h-4 w-4 mr-1" /> New Check-In
          </Button>
        </div>
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            Signed in as {activeGuard?.name}
          </p>
          <button
            type="button"
            onClick={clearActiveGuard}
            className="text-xs font-medium text-gray-500 underline hover:text-gray-900"
          >
            Switch guard
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search checked-in staff…"
            value={listSearch}
            onChange={(e) => setListSearch(e.target.value)}
            className="pl-9 h-11"
          />
        </div>

        {listLoading ? (
          <div className="text-center py-10 text-gray-500">
            <Loader2 className="h-5 w-5 mx-auto animate-spin mb-2" />
            Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No staff currently checked in.
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {row.staff?.names ?? "Unknown"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {row.staff?.phonenumber || row.staff?.phonenumber} · in
                    since {new Date(row.check_in_time).toLocaleTimeString()}
                  </p>
                </div>
                {confirmOutStaffId === row.staff_id ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmOutStaffId(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleCheckOut(row.staff_id)}
                      disabled={checkingOutStaffId === row.staff_id}
                      className="bg-gray-900 text-white"
                    >
                      {checkingOutStaffId === row.staff_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Confirm"
                      )}
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmOutStaffId(row.staff_id)}
                  >
                    <LogOut className="h-4 w-4 mr-1" /> Check Out
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
