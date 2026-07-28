"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Loader2, Download, Users, UserCheck } from "lucide-react";
import { fetchStaffAttendance, fetchVisitorLogs } from "@/lib/api";

interface VisitorLogRow {
  id: string;
  visitor_name: string;
  visitor_phone: string;
  visitor_email?: string;
  host?: { names?: string };
  visit_reason: string;
  scheduled_date_time: string;

  created_at: string;
}

interface StaffAttendanceRow {
  id: string;
  staff?: { names?: string };
  check_in_time: string;
  check_out_time?: string | null;
}

type Tab = "visitors" | "staff";

export function HistoryView() {
  const [tab, setTab] = useState<Tab>("visitors");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [visitorRows, setVisitorRows] = useState<VisitorLogRow[]>([]);
  const [staffRows, setStaffRows] = useState<StaffAttendanceRow[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "visitors") {
        const result = await fetchVisitorLogs({
          limit: 50,
          names: search || undefined,
        });
        setVisitorRows(result || []);
      } else {
        const result = await fetchStaffAttendance({
          limit: 50,
          names: search || undefined,
        });
        setStaffRows(result || []);
      }
    } catch {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [tab, search]);
  useEffect(() => {
    const timer = setTimeout(loadData, 300);
    return () => clearTimeout(timer);
  }, [loadData]);

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2E2A5E]">History</h1>
          <p className="text-sm text-[#7A759A]">Last 2 days of activity</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 border-b border-[#E4E1F0]">
        <button
          onClick={() => setTab("visitors")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            tab === "visitors"
              ? "border-[#494395] text-[#2E2A5E]"
              : "border-transparent text-[#7A759A]"
          }`}
        >
          <Users className="h-4 w-4" />
          Visitors
        </button>
        <button
          onClick={() => setTab("staff")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            tab === "staff"
              ? "border-[#494395] text-[#2E2A5E]"
              : "border-transparent text-[#7A759A]"
          }`}
        >
          <UserCheck className="h-4 w-4" />
          Staff
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7A759A]" />
        <Input
          placeholder={
            tab === "visitors" ? "Search visitor name…" : "Search staff name…"
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 border-[#E4E1F0] focus:border-[#494395]"
        />
      </div>

      <div className="rounded-xl border border-[#E4E1F0] bg-white overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[#7A759A]">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
            Loading…
          </div>
        ) : tab === "visitors" ? (
          visitorRows.length === 0 ? (
            <div className="p-8 text-center text-[#7A759A]">
              No visitor records in the last 2 days
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#F7F6FB] text-left text-xs uppercase text-[#7A759A]">
                <tr>
                  <th className="px-4 py-3">Visitor</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Host</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Scheduled</th>
                </tr>
              </thead>
              <tbody>
                {visitorRows.map((row) => (
                  <tr key={row.id} className="border-t border-[#E4E1F0]">
                    <td className="px-4 py-3 font-medium text-[#2E2A5E]">
                      {row.visitor_name}
                    </td>
                    <td className="px-4 py-3 text-[#7A759A]">
                      {row.visitor_phone}
                    </td>
                    <td className="px-4 py-3 text-[#7A759A]">
                      {row.host?.names || ""}
                    </td>
                    <td className="px-4 py-3 text-[#7A759A]">
                      {row.visit_reason}
                    </td>
                    <td className="px-4 py-3 text-[#7A759A]">
                      {new Date(row.scheduled_date_time).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : staffRows.length === 0 ? (
          <div className="p-8 text-center text-[#7A759A]">
            No staff attendance records in the last 2 days
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#F7F6FB] text-left text-xs uppercase text-[#7A759A]">
              <tr>
                <th className="px-4 py-3">Staff</th>
                <th className="px-4 py-3">Check In</th>
                <th className="px-4 py-3">Check Out</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {staffRows.map((row) => (
                <tr key={row.id} className="border-t border-[#E4E1F0]">
                  <td className="px-4 py-3 font-medium text-[#2E2A5E]">
                    {row.staff?.names || ""}
                  </td>
                  <td className="px-4 py-3 text-[#7A759A]">
                    {new Date(row.check_in_time).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-[#7A759A]">
                    {row.check_out_time
                      ? new Date(row.check_out_time).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        row.check_out_time
                          ? "bg-[#F7F6FB] text-[#7A759A]"
                          : "bg-[#EAF7F5] text-[#2EC4B6]"
                      }`}
                    >
                      {row.check_out_time ? "Closed" : "Open"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
