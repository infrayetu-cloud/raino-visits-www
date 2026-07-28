"use client";

import { useState, useEffect } from "react";

import { GuardPinPad } from "@/components/GuardPinPad";
import { GuardShell } from "@/components/GuardShell";
import { StaffAttendanceForm } from "@/components/StaffAttendanceForm";
import { VisitorEntryForm } from "@/components/VisitorEntryForm";
import { useAuth } from "@/lib/context/auth-context";
import { useGuardSession } from "@/lib/context/guard-session-context";
import { GuardMenu } from "@/components/GuardMenu";
import { StaffSelfRegisterForm } from "@/components/StaffSelfRegisterForm";
import { HistoryView } from "@/components/HistoryView";

type GuardView = "menu" | "attendance" | "visitor" | "history";

export default function Home() {
  const { user, hydrated } = useAuth();
  const { activeGuard } = useGuardSession();
  const [guardView, setGuardView] = useState<GuardView>("menu");

  useEffect(() => {
    if (hydrated && user === null) {
      window.location.href = "/login";
    }
  }, [hydrated, user]);

  if (!hydrated || !user) return null;

  const isGuard = user.role?.name?.toUpperCase() === "GUARD";

  if (!isGuard) {
    return <StaffSelfRegisterForm currentUser={user} />;
  }

  if (!activeGuard) {
    return <GuardPinPad />;
  }

  return (
    <GuardShell
      onBackToMenu={
        guardView !== "menu" ? () => setGuardView("menu") : undefined
      }
    >
      {guardView === "menu" && <GuardMenu onSelect={setGuardView} />}
      {guardView === "attendance" && <StaffAttendanceForm />}
      {guardView === "visitor" && (
        <VisitorEntryForm onComplete={() => setGuardView("menu")} />
      )}
      {guardView === "history" && <HistoryView />}
    </GuardShell>
  );
}
