// app/page.tsx - Visitor Entry Form

"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
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
import { HostSearch } from "@/components/HostSearch";
import {
  requestVisitorCode,
  submitVisitorLog,
  generateVisitorCode,
} from "@/lib/api";
import { Clock, User, Phone, MapPin, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";
import { useRouter } from "next/navigation";

export default function VisitorFormPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [step, setStep] = React.useState<"details" | "code">("details");
  const [loading, setLoading] = React.useState(false);

  // Form state
  const [reason, setReason] = React.useState("customer");
  const [hostName, setHostName] = React.useState("");
  const [hostPhone, setHostPhone] = React.useState("");
  const [visitorName, setVisitorName] = React.useState("");
  const [visitorPhone, setVisitorPhone] = React.useState("");
  const [visitDateTime, setVisitDateTime] = React.useState("");
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [visitorCode, setVisitorCode] = React.useState("");
  const [generatedCode, setGeneratedCode] = React.useState("");
  const [hostId, setHostId] = React.useState("");
  React.useEffect(() => {
    if (!token) router.push("/login");
  }, [token, router]);

  if (!token) return null;

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await requestVisitorCode({
        hostId,
        hostName,
        hostPhone,
        visitorName,
        visitorPhone,
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
    } catch (err) {
      toast.error("Network Error", {
        description: "Could not connect to server",
      });
    } finally {
      setLoading(false);
    }
  }

  // STEP 2: Submit visitor log
  async function handleFinalSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await submitVisitorLog({
        hostId,

        hostPhone,
        visitorName,
        visitorPhone,
        visitReason: reason,
        scheduledDateTime: visitDateTime,
        visitorCode,
        photoFile: uploadedFile || undefined,
      });

      if (result.success) {
        toast.success("Visit Entry Complete!", {
          description: "Welcome to the premises",
        });

        // Reset form
        setStep("details");
        setHostId("");
        setVisitorCode("");
        setGeneratedCode("");
        setVisitorName("");
        setVisitorPhone("");
        setVisitDateTime("");
        setHostName("");
        setHostPhone("");
        setUploadedFile(null);
        setReason("customer");
      } else {
        toast.error("Failed to Submit", {
          description: result.data?.error || result.error,
        });
      }
    } catch (err) {
      toast.error("Error", {
        description: "Failed to complete entry",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white p-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center justify-center rounded-lg bg-gray-100 p-3">
            <MapPin className="h-6 w-6 text-gray-700" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Visitor Entry Pass
          </h1>
          <p className="mt-2 text-gray-500">
            {step === "details"
              ? "Register your visit and receive your entry code"
              : "Confirm your visitor code"}
          </p>
        </div>

        {/* Main Form Card */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Progress indicator */}
          <div className="flex h-1 bg-gray-200">
            <div
              className={`${
                step === "code" ? "w-full" : "w-1/2"
              } bg-gray-900 transition-all duration-300`}
            />
          </div>

          <div className="p-8 md:p-10">
            {step === "details" ? (
              <form onSubmit={handleRequestCode} className="space-y-8">
                {/* Host Section */}

                <div className="space-y-5 rounded-lg bg-gray-50 p-6 border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="h-5 w-5 text-gray-700" />
                    <h2 className="font-semibold text-gray-900">
                      Host Information
                    </h2>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700">
                      Select Name of the Host
                    </Label>
                    <div className="mt-2">
                      <HostSearch
                        onSelectHost={(id, name, phone) => {
                          setHostId(id);
                          setHostName(name);
                          setHostPhone(phone);
                        }}
                      />
                    </div>
                  </div>

                  {hostName && (
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">
                        Host Phone Number
                      </Label>
                      <div className="relative mt-2">
                        <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <Input
                          value={hostPhone}
                          onChange={(e) => setHostPhone(e.target.value)}
                          placeholder="No registered number — enter manually"
                          className="pl-10 border-gray-300"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Visitor Section */}
                <div className="space-y-5 rounded-lg bg-gray-50 p-6 border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="h-5 w-5 text-gray-700" />
                    <h2 className="font-semibold text-gray-900">
                      Visitor Information
                    </h2>
                  </div>

                  <div>
                    <Label
                      htmlFor="visitorName"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Name of the visitor
                    </Label>
                    <Input
                      id="visitorName"
                      required
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      placeholder="Enter your name"
                      className="mt-2 border-gray-300"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="visitorPhone"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Visitors Phonenumber
                    </Label>
                    <div className="relative mt-2">
                      <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        id="visitorPhone"
                        type="tel"
                        required
                        value={visitorPhone}
                        onChange={(e) => setVisitorPhone(e.target.value)}
                        placeholder="+254712345678"
                        className="pl-10 border-gray-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Visit Details Section */}
                <div className="space-y-5 rounded-lg bg-gray-50 p-6 border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-5 w-5 text-gray-700" />
                    <h2 className="font-semibold text-gray-900">
                      Visit Details
                    </h2>
                  </div>

                  <div>
                    <Label
                      htmlFor="visitDateTime"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Scheduled Date & Time
                    </Label>
                    <Input
                      id="visitDateTime"
                      type="datetime-local"
                      required
                      value={visitDateTime}
                      onChange={(e) => setVisitDateTime(e.target.value)}
                      className="mt-2 border-gray-300"
                    />
                    {generatedCode && (
                      <div className="mt-3 rounded-lg bg-gray-200 p-3 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-gray-700" />
                        <span className="text-sm font-semibold text-gray-700">
                          Your code will be:{" "}
                          <span className="font-mono text-lg">
                            {generatedCode}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor="reason"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Reason for Visit
                    </Label>
                    <Select
                      onValueChange={(val) => setReason(val)}
                      defaultValue="customer"
                    >
                      <SelectTrigger
                        id="reason"
                        className="mt-2 border-gray-300"
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
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* File Upload */}
                {reason !== "customer" && (
                  <div className="rounded-lg border border-gray-300 bg-gray-50 p-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-gray-700 mt-0.5" />
                      <div className="flex-1">
                        <Label
                          htmlFor="document"
                          className="text-sm font-semibold text-gray-900"
                        >
                          Upload ID / Passport (Required)
                        </Label>
                        <Input
                          id="document"
                          type="file"
                          required
                          className="mt-3 border-gray-300"
                          onChange={(e) =>
                            setUploadedFile(e.target.files?.[0] || null)
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={
                    loading ||
                    !hostId ||
                    !hostPhone ||
                    !visitorName ||
                    !visitorPhone ||
                    !visitDateTime
                  }
                  className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-all duration-200"
                >
                  {loading ? "Generating Code..." : "Generate Entry Code"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleFinalSubmit} className="space-y-8">
                {/* Code Display */}
                <div className="rounded-lg bg-gray-900 p-8 text-white text-center">
                  <p className="text-sm font-medium opacity-90 mb-2">
                    Your Visitor Code
                  </p>
                  <p className="text-5xl font-bold font-mono mb-2 tracking-widest">
                    {visitorCode}
                  </p>
                  <p className="text-sm opacity-80">
                    Share this code with the host for entry
                  </p>
                </div>

                {/* Code Confirmation Input */}
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="codeConfirm"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Confirm the Code (Enter to proceed)
                    </Label>
                    <Input
                      id="codeConfirm"
                      type="text"
                      value={visitorCode}
                      disabled
                      className="mt-2 text-center text-xl font-mono font-bold border-gray-300 bg-gray-50"
                    />
                  </div>

                  {/* Visitor Info Summary */}
                  <div className="rounded-lg bg-gray-50 p-6 space-y-3 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Visit Summary
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500">
                          HOST
                        </p>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {hostName}
                        </p>
                        <p className="text-xs text-gray-600">{hostPhone}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500">
                          VISITOR
                        </p>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {visitorName}
                        </p>
                        <p className="text-xs text-gray-600">{visitorPhone}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs font-semibold text-gray-500">
                          SCHEDULED TIME
                        </p>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {new Date(visitDateTime).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("details")}
                    className="w-1/3 h-12 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 h-12 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-all duration-200"
                  >
                    {loading ? "Confirming..." : "Confirm & Complete Entry"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Your visitor code and details are secure</p>
        </div>
      </div>
    </main>
  );
}
