/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { requestVisitorCode, submitVisitorLog, searchHosts } from "@/lib/api";
import {
  Clock,
  User,
  Phone,
  IdCard,
  AlertCircle,
  Search,
  Loader2,
  X,
  Ticket,
  Mail,
} from "lucide-react";

export const VISIT_REASON_LABELS: Record<string, string> = {
  customer: "Customer/Sales",
  jobs: "Jobs & Opportunities",
  procurement: "Procurement/Service Provider",
  compliance_regulation: "Compliance & Regulation",
  partners_stakeholders: "Partners & Stakeholders",
  other: "Other",
};

export function formatVisitReason(reason?: string, other?: string | null) {
  if (!reason) return "—";
  if (reason === "other") return other ? `Other: ${other}` : "Other (not specified)";
  return VISIT_REASON_LABELS[reason] ?? reason;
}

export interface Host {
  id: string;
  names: string;
  contact_phonenumber?: string;
  phonenumber?: string;
  county?: string;
  organisation_id?: string;
}

interface VisitorEntryFormProps {
  heading?: string;
  subheading?: string;
  onComplete?: () => void;
}

// Small consistent "section header" used throughout — a turquoise dot,
// an icon, a title. Repeating this exact pattern (rather than inventing a
// new header treatment per section) is what makes the form read as one
// designed system instead of three stitched-together fragments.
function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="h-1.5 w-1.5 rounded-full bg-[#2EC4B6]" />
      <Icon className="h-4 w-4 text-[#494395]" />
      <h2 className="font-semibold text-[#2E2A5E]">{title}</h2>
    </div>
  );
}

export function VisitorEntryForm({
  heading = "Visitor Entry Pass",
  subheading,
  onComplete,
}: VisitorEntryFormProps) {
  const [step, setStep] = useState<"details" | "code">("details");
  const [loading, setLoading] = useState(false);
  const [idNumber, setIdNumber] = useState("");

  const [agents, setAgents] = useState<Host[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Host | null>(null);
  const [hostPhoneInput, setHostPhoneInput] = useState("");
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const [reason, setReason] = useState("customer");
  const [reasonOther, setReasonOther] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [visitDateTime, setVisitDateTime] = useState("");
  const [visitorCode, setVisitorCode] = useState("");

  const hostId = selectedAgent?.id || "";
  const hostName = selectedAgent?.names || "";
  const hostPhone = hostPhoneInput;
  useEffect(() => {
    if (
      !searchInput.trim() ||
      (selectedAgent && selectedAgent.names === searchInput)
    ) {
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
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchInput(e.target.value);
    setSelectedAgent(null);
    setHostPhoneInput("");
  }

  function handleSelectAgent(agent: Host) {
    console.log("selected agent object:", agent);
    setSelectedAgent(agent);
    setSearchInput(agent.names ?? "");
    setHostPhoneInput(agent.contact_phonenumber || agent.phonenumber || "");

    setShowDropdown(false);
  }

  function handleClearAgent() {
    setSelectedAgent(null);
    setSearchInput("");
    setHostPhoneInput("");
  }

  function resetForm() {
    setStep("details");
    setSelectedAgent(null);

    setSearchInput("");
    setVisitorName("");
    setVisitorPhone("");
    setVisitorEmail("");
    setHostPhoneInput("");
    setVisitDateTime("");

    setVisitorCode("");
    setReason("customer");
    setReasonOther("");
    setIdNumber("");
  }

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await requestVisitorCode({
        hostId,
        visitorName,
        visitorPhone,
        visitorEmail: visitorEmail || undefined,
        scheduledDateTime: visitDateTime,
      });

      if (result.success) {
        setVisitorCode(result.visitorCode || "");
        setStep("code");
        toast.success("Visitor Code Generated!", {
          description: `Code: ${result.visitorCode} sent to host and visitor`,
        });
      } else {
        toast.error("Failed to Generate Code", {
          description: result.data?.error || result.error,
        });
      }
    } catch {
      toast.error("Network Error", {
        description: "Could not connect to server",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleFinalSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await submitVisitorLog({
        hostId,
        visitorName,
        visitorPhone,
        visitorEmail,
        visitReason: reason,
        visitReasonOther: reason === "other" ? reasonOther : undefined,
        scheduledDateTime: visitDateTime,
        visitorCode,
      });

      if (result.success) {
        toast.success("Visit Entry Complete!", {
          description: "Welcome to the premises",
        });
        resetForm();
        onComplete?.();
      } else {
        toast.error("Failed to Submit", {
          description: result.data?.error || result.error,
        });
      }
    } catch {
      toast.error("Error", { description: "Failed to complete entry" });
    } finally {
      setLoading(false);
    }
  }


  return (
    <main className="min-h-screen bg-[#F7F6FB] p-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[#2EC4B6] mb-2">
            {step === "details" ? "Step 1 of 2" : "Step 2 of 2"}
          </p>
          <h1 className="text-3xl font-bold text-[#2E2A5E]">{heading}</h1>
          <p className="mt-2 text-[#7A759A]">
            {subheading ||
              (step === "details"
                ? "Register your visit and receive your entry code"
                : "Confirm your visitor code")}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E4E1F0] bg-white shadow-sm overflow-hidden">
          <div className="flex h-1.5 bg-[#E4E1F0]">
            <div
              className={`${
                step === "code" ? "w-full" : "w-1/2"
              } bg-gradient-to-r from-[#494395] to-[#2EC4B6] transition-all duration-300`}
            />
          </div>

          <div className="p-8 md:p-10">
            {step === "details" ? (
              <form onSubmit={handleRequestCode} className="space-y-8">
                {/* Host Section */}
                <div className="space-y-5 rounded-xl bg-[#F7F6FB] p-6 border border-[#E4E1F0]">
                  <SectionHeader icon={User} title="Host Information" />

                  <div className="space-y-2">
                    <Label
                      htmlFor="agent-search"
                      className="text-sm sm:text-base font-semibold text-[#2E2A5E]"
                    >
                      Host Name or Phone Number
                    </Label>
                    <p className="text-xs sm:text-sm text-[#7A759A]">
                      Search by name or phone number
                    </p>

                    <div className="relative" ref={searchWrapperRef}>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7A759A] pointer-events-none" />
                        <Input
                          id="agent-search"
                          placeholder="Type staff name or phone number…"
                          value={searchInput}
                          onChange={handleSearchChange}
                          onFocus={() => {
                            if (searchInput.trim()) setShowDropdown(true);
                          }}
                          className="pl-9 pr-9 h-11 text-sm sm:text-base border-[#E4E1F0] focus:border-[#494395]"
                          autoComplete="off"
                        />
                        {selectedAgent && (
                          <button
                            type="button"
                            onClick={handleClearAgent}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A759A] hover:text-[#2E2A5E]"
                            aria-label="Clear selected host"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                        {isSearching && !selectedAgent && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7A759A] animate-spin" />
                        )}
                      </div>

                      {showDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E4E1F0] rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                          {isSearching ? (
                            <div className="px-4 py-3 text-sm text-[#7A759A] flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />{" "}
                              Searching…
                            </div>
                          ) : agents.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-[#7A759A]">
                              No staff found. Try a different name or number.
                            </div>
                          ) : (
                            agents.map((agent) => (
                              <button
                                key={agent.id}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleSelectAgent(agent);
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-[#EAF7F5] transition-colors border-b border-[#E4E1F0] last:border-b-0"
                              >
                                <div className="font-medium text-sm text-[#2E2A5E]">
                                  {agent.names}
                                </div>
                                <div className="text-xs text-[#7A759A] mt-0.5">
                                  {agent.contact_phonenumber ||
                                    agent.phonenumber}
                                  {agent.county ? ` · ${agent.county}` : ""}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    {selectedAgent && (
                      <div>
                        <Label
                          htmlFor="hostPhone"
                          className="text-sm font-semibold text-[#2E2A5E]"
                        >
                          Host Phone Number
                        </Label>
                        <div className="relative mt-2">
                          <Phone className="absolute left-3 top-3 h-5 w-5 text-[#7A759A]" />
                          <Input
                            id="hostPhone"
                            type="tel"
                            value={hostPhoneInput}
                            onChange={(e) => setHostPhoneInput(e.target.value)}
                            placeholder="254712345678"
                            className="pl-10 border-[#E4E1F0] focus:border-[#494395]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Visitor Section */}
                <div className="space-y-5 rounded-xl bg-[#F7F6FB] p-6 border border-[#E4E1F0]">
                  <SectionHeader icon={User} title="Visitor Information" />

                  <div>
                    <Label
                      htmlFor="visitorName"
                      className="text-sm font-semibold text-[#2E2A5E]"
                    >
                      Name of the visitor
                    </Label>
                    <Input
                      id="visitorName"
                      required
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      placeholder="Enter visitor's name"
                      className="mt-2 border-[#E4E1F0] focus:border-[#494395]"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="visitorPhone"
                      className="text-sm font-semibold text-[#2E2A5E]"
                    >
                      Visitor&apos;s Phone Number
                    </Label>
                    <div className="relative mt-2">
                      <Phone className="absolute left-3 top-3 h-5 w-5 text-[#7A759A]" />
                      <Input
                        id="visitorPhone"
                        type="tel"
                        required
                        value={visitorPhone}
                        onChange={(e) => setVisitorPhone(e.target.value)}
                        placeholder="+254712345678"
                        className="pl-10 border-[#E4E1F0] focus:border-[#494395]"
                      />
                    </div>
                  </div>
                  <div>
                    <Label
                      htmlFor="visitorEmail"
                      className="text-sm font-semibold text-[#2E2A5E]"
                    >
                      Visitor&apos;s Email (optional)
                    </Label>
                    <div className="relative mt-2">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-[#7A759A]" />
                      <Input
                        id="visitorEmail"
                        type="email"
                        value={visitorEmail}
                        onChange={(e) => setVisitorEmail(e.target.value)}
                        placeholder="visitor@example.com"
                        className="pl-10 border-[#E4E1F0] focus:border-[#494395]"
                      />
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="idNumber"
                      className="text-sm font-semibold text-[#2E2A5E]"
                    >
                      ID / Passport Number
                    </Label>
                    <div className="relative mt-2">
                      <IdCard className="absolute left-3 top-3 h-5 w-5 text-[#7A759A]" />
                      <Input
                        id="idNumber"
                        required
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                        placeholder="e.g. 12345678"
                        className="pl-10 border-[#E4E1F0] focus:border-[#494395]"
                      />
                    </div>
                  </div>
                </div>

                {/* Visit Details Section */}
                <div className="space-y-5 rounded-xl bg-[#F7F6FB] p-6 border border-[#E4E1F0]">
                  <SectionHeader icon={Clock} title="Visit Details" />

                  <div>
                    <Label
                      htmlFor="visitDateTime"
                      className="text-sm font-semibold text-[#2E2A5E]"
                    >
                      Scheduled Date & Time
                    </Label>
                    <Input
                      id="visitDateTime"
                      type="datetime-local"
                      required
                      value={visitDateTime}
                      onChange={(e) => setVisitDateTime(e.target.value)}
                      className="mt-2 border-[#E4E1F0] focus:border-[#494395]"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="reason"
                      className="text-sm font-semibold text-[#2E2A5E]"
                    >
                      Reason for Visit
                    </Label>
                    <Select
                      onValueChange={(val) => setReason(val)}
                      value={reason}
                    >
                      <SelectTrigger
                        id="reason"
                        className="mt-2 border-[#E4E1F0] focus:border-[#494395]"
                      >
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Customer/Sales</SelectItem>
                        <SelectItem value="jobs">
                          Jobs & Opportunities
                        </SelectItem>
                        <SelectItem value="procurement">
                          Procurement/Service Provider
                        </SelectItem>
                        <SelectItem value="compliance_regulation">
                          Compliance & Regulation
                        </SelectItem>
                        <SelectItem value="partners_stakeholders">
                          Partners & Stakeholders
                        </SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {reason === "other" && (
                      <div className="mt-3">
                        <Label
                          htmlFor="reasonOther"
                          className="text-sm font-semibold text-[#2E2A5E]"
                        >
                          Please specify the reason
                        </Label>
                        <Input
                          id="reasonOther"
                          required
                          maxLength={255}
                          value={reasonOther}
                          onChange={(e) => setReasonOther(e.target.value)}
                          placeholder="e.g. Delivering documents, Interview follow-up"
                          className="mt-2 border-[#E4E1F0] focus:border-[#494395]"
                        />
                      </div>
                    )}
                  </div>
                </div>

              

                <button
                  type="submit"
                  disabled={
                    loading ||
                    !hostId ||
                    !visitorName ||
                    !visitorPhone ||
                    !idNumber ||
                    !visitDateTime ||
                    (reason === "other" && !reasonOther.trim())
                  }
                  className="w-full h-12 rounded-xl bg-[#494395] hover:bg-[#3A3578] text-white font-semibold transition-colors disabled:opacity-40 disabled:hover:bg-[#494395]"
                >
                  {loading ? "Generating Code..." : "Generate Entry Code"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleFinalSubmit} className="space-y-8">
                {/* Signature element: the code screen is a torn gate pass,
                    not a plain dark box. Perforation is a repeating radial
                    gradient; the turquoise stub carries a rotated "PASS"
                    label like a physical ticket. */}
                <div className="relative flex rounded-2xl overflow-hidden shadow-lg shadow-[#494395]/10">
                  <div className="flex-1 bg-[#494395] p-8 text-center">
                    <div className="inline-flex items-center gap-1.5 text-white/60 text-xs font-semibold uppercase tracking-widest mb-3">
                      <Ticket className="h-3.5 w-3.5" />
                      Entry Code
                    </div>
                    <p
                      className="text-5xl font-bold text-white tracking-widest"
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                    >
                      {visitorCode}
                    </p>
                    <p className="text-sm text-white/70 mt-3">
                      Share this code with the host for entry
                    </p>
                  </div>

                  {/* Perforated tear line */}
                  <div
                    className="w-0 border-l-2 border-dashed border-white/30"
                    style={{
                      backgroundImage:
                        "repeating-radial-gradient(circle, transparent 0 3px, #F7F6FB 3px 4px)",
                    }}
                  />

                  {/* Ticket stub */}
                  <div className="w-16 bg-[#2EC4B6] flex items-center justify-center">
                    <span
                      className="text-white text-xs font-bold uppercase tracking-widest"
                      style={{ writingMode: "vertical-rl" }}
                    >
                      Pass
                    </span>
                  </div>
                </div>

                <div className="rounded-xl bg-[#F7F6FB] p-6 space-y-3 border border-[#E4E1F0]">
                  <h3 className="font-semibold text-[#2E2A5E] mb-2">
                    Visit Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-[#7A759A]">
                        HOST
                      </p>
                      <p className="text-sm font-medium text-[#2E2A5E] mt-1">
                        {hostName}
                      </p>
                      <p className="text-xs text-[#7A759A]">{hostPhone}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#7A759A]">
                        VISITOR
                      </p>
                      <p className="text-sm font-medium text-[#2E2A5E] mt-1">
                        {visitorName}
                      </p>
                      <p className="text-xs text-[#7A759A]">{visitorPhone}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-semibold text-[#7A759A]">
                        REASON FOR VISIT
                      </p>
                      <p className="text-sm font-medium text-[#2E2A5E] mt-1">
                        {reason === "other"
                          ? `Other: ${reasonOther}`
                          : VISIT_REASON_LABELS[reason] ?? reason}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-semibold text-[#7A759A]">
                        SCHEDULED TIME
                      </p>
                      <p className="text-sm font-medium text-[#2E2A5E] mt-1">
                        {visitDateTime
                          ? new Date(visitDateTime).toLocaleString()
                          : ""}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep("details")}
                    className="w-1/3 h-12 rounded-xl border border-[#E4E1F0] text-[#2E2A5E] font-semibold hover:bg-[#F7F6FB] transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 h-12 rounded-xl bg-[#494395] hover:bg-[#3A3578] text-white font-semibold transition-colors disabled:opacity-40"
                  >
                    {loading ? "Confirming..." : "Confirm & Complete Entry"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-[#7A759A]">
          <p>Your visitor code and details are secure</p>
        </div>
      </div>
    </main>
  );
}
