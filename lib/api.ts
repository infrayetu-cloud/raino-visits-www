// lib/api.ts
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.markiti.co.ke/api/v1/";
import { StaffUser } from "@/components/StaffAttendanceForm";
import { Host } from "@/components/VisitorEntryForm";
import { STORAGE_KEYS } from "@/lib/constants";

function getToken(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.token);
    return raw ? JSON.parse(raw) : "";
  } catch {
    return "";
  }
}

async function searchOrganisationStaff(
  query: string,
  organisationType: "rider" | "handler" | "casual",
): Promise<StaffUser[]> {
  try {
    const params = new URLSearchParams({
      display_name: query,
      organisation_type: organisationType,
      limit: "10",
      offset: "0",
    });
    const response = await fetch(`${API_BASE_URL}organisation?${params}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!response.ok) return [];
    const data = await response.json();
    const raw = data.returned_resultset || [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return raw.map((item: any) => {
      const [, extractedPhone] =
        typeof item.display_name === "string"
          ? item.display_name.split(" - ")
          : [];

      return {
        id: item.id,
        names: item.name ?? item.display_name ?? "",
        phonenumber:
          item.contact_phonenumber || item.phonenumber || extractedPhone || "",
        source: "organisation" as const,
      };
    });
  } catch (error) {
    console.error(`Error searching ${organisationType}:`, error);
    return [];
  }
}

export async function searchHosts(query: string) {
  const params = new URLSearchParams({
    names: query,
    limit: "10",
    offset: "0",
    active: "true",
  });

  const [userResult, ridersResult, handlersResult, casualResult] =
    await Promise.allSettled([
      (async () => {
        const response = await fetch(`${API_BASE_URL}user?${params}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (response.status === 401) {
          window.location.href = "/login";
          return [];
        }
        if (!response.ok) return [];
        const data = await response.json();
        const raw = data.returned_resultset || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return raw.map((item: any) => ({
          id: item.id,
          names: item.names,
          phonenumber: item.phonenumber,
          source: "user" as const,
        })) as StaffUser[];
      })(),
      searchOrganisationStaff(query, "rider"),
      searchOrganisationStaff(query, "handler"),
      searchOrganisationStaff(query, "casual"),
    ]);

  const users = userResult.status === "fulfilled" ? userResult.value : [];
  const riders = ridersResult.status === "fulfilled" ? ridersResult.value : [];
  const handlers =
    handlersResult.status === "fulfilled" ? handlersResult.value : [];
  const casuals = casualResult.status === "fulfilled" ? casualResult.value : [];

  if (userResult.status === "rejected") {
    console.error("Error searching users:", userResult.reason);
  }

  return [...users, ...riders, ...handlers, ...casuals];
}

export function generateVisitorCode(dateTime: string): string {
  const date = new Date(dateTime);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `V${year}${month}${day}${hours}${minutes}`;
}

export async function requestVisitorCode(payload: {
  hostId: string;
  visitorName: string;
  visitorPhone: string;
  visitorEmail?: string;
  scheduledDateTime: string;
}) {
  try {
    const visitorCode = generateVisitorCode(payload.scheduledDateTime);

    const formData = new FormData();
    formData.append("action", "request_visitor_code");
    formData.append("host_id", payload.hostId);
    formData.append("visitor_name", payload.visitorName);
    formData.append("visitor_phone", payload.visitorPhone);
    formData.append("scheduled_date_time", payload.scheduledDateTime);
    formData.append("visitor_code", visitorCode);

    const response = await fetch(`${API_BASE_URL}visitor-logs`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    });

    const result = await response.json();
    return { success: response.ok, data: result, visitorCode };
  } catch (error) {
    console.error("Error requesting visitor code:", error);
    return { success: false, error: String(error) };
  }
}

export async function submitVisitorLog(payload: {
  hostId: string;
  visitorName: string;
  visitorPhone: string;
  visitorEmail: string;
  visitReason: string;
  scheduledDateTime: string;
  visitorCode: string;
  photoFile?: File;
}) {
  try {
    const formData = new FormData();
    formData.append("action", "submit_visitor_log");
    formData.append("host_id", payload.hostId);
    formData.append("visitor_name", payload.visitorName);
    formData.append("visitor_phone", payload.visitorPhone);
    formData.append("visit_reason", payload.visitReason);
    formData.append("scheduled_date_time", payload.scheduledDateTime);
    formData.append("visitor_code", payload.visitorCode);

    if (payload.photoFile) {
      formData.append("photo_evidence_url", payload.photoFile);
    }

    const response = await fetch(`${API_BASE_URL}visitor-logs`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    });

    const result = await response.json();
    return { success: response.ok, data: result };
  } catch (error) {
    console.error("Error submitting visitor log:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * checkInStaff / checkOutStaff now require the active guard's actor token
 * (obtained via startGuardSession after PIN entry) and attach it as
 * X-Guard-Token. The backend uses this — not the caller's main JWT — to
 * decide who gets stamped as recorded_by_id / checked_out_by_id.
 */
export async function checkInStaff(
  staffId: string,
  guardToken: string,
  source: "user" | "organisation",
  vehicleRegistration?: string,
) {
  try {
    const formData = new FormData();
    formData.append("action", "check_in");
    if (source === "user") {
      formData.append("staff_id", staffId);
    } else {
      formData.append("organisation_staff_id", staffId);
    }
    if (vehicleRegistration) {
      formData.append("vehicle_registration", vehicleRegistration);
    }
    const response = await fetch(`${API_BASE_URL}staff-attendance`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "X-Guard-Token": guardToken,
      },
      body: formData,
    });
    const result = await response.json();
    return { success: response.ok, data: result };
  } catch (error) {
    console.error("Error checking in staff:", error);
    return { success: false, error: String(error) };
  }
}

export async function checkOutStaff(
  staffId: string,
  guardToken: string,
  source: "user" | "organisation",
  vehicleRegistration?: string,
) {
  try {
    const formData = new FormData();
    formData.append("action", "check_out");
    if (source === "user") {
      formData.append("staff_id", staffId);
    } else {
      formData.append("organisation_staff_id", staffId);
    }
    if (vehicleRegistration) {
      formData.append("vehicle_registration", vehicleRegistration);
    }
    const response = await fetch(`${API_BASE_URL}staff-attendance`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "X-Guard-Token": guardToken,
      },
      body: formData,
    });
    const result = await response.json();
    return { success: response.ok, data: result };
  } catch (error) {
    console.error("Error checking out staff:", error);
    return { success: false, error: String(error) };
  }
}

export async function listCheckedInStaff(nameFilter = "") {
  try {
    const params = new URLSearchParams({
      status: "open",
      limit: "50",
      offset: "0",
    });
    if (nameFilter) params.append("name", nameFilter);
    const response = await fetch(`${API_BASE_URL}staff-attendance?${params}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data = await response.json();
    return data.returned_resultset || [];
  } catch (error) {
    console.error("Error listing checked-in staff:", error);
    return [];
  }
}

export async function startGuardSession(guardId: string, pin: string) {
  try {
    const formData = new FormData();
    formData.append("guard_id", guardId);
    formData.append("pin", pin);
    const response = await fetch(`${API_BASE_URL}guard-session`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    });
    const result = await response.json();
    return { success: response.ok, data: result };
  } catch (error) {
    console.error("Error starting guard session:", error);
    return { success: false, error: String(error) };
  }
}

export async function listGuards() {
  try {
    const params = new URLSearchParams({ limit: "50", offset: "0" });
    const response = await fetch(`${API_BASE_URL}guard-profiles?${params}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data = await response.json();
    return data.returned_resultset || [];
  } catch (error) {
    console.error("Error listing guards:", error);
    return [];
  }
}

export async function fetchVisitorLogs(params: {
  offset?: number;
  limit?: number;
  names?: string;
}) {
  try {
    const query = new URLSearchParams({
      limit: String(params.limit ?? 50),
      offset: String(params.offset ?? 0),
    });
    if (params.names) query.append("names", params.names);

    const response = await fetch(`${API_BASE_URL}visitor-logs?${query}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    if (response.status === 401) {
      window.location.href = "/login";
      return [];
    }

    const data = await response.json();
    return data.returned_resultset || [];
  } catch (error) {
    console.error("Error fetching visitor logs:", error);
    return [];
  }
}

export async function fetchStaffAttendance(params: {
  offset?: number;
  limit?: number;
  name?: string;
  status?: "open" | "closed";
}) {
  try {
    const query = new URLSearchParams({
      limit: String(params.limit ?? 50),
      offset: String(params.offset ?? 0),
    });
    if (params.name) query.append("name", params.name);
    if (params.status) query.append("status", params.status);

    const response = await fetch(`${API_BASE_URL}staff-attendance?${query}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    if (response.status === 401) {
      window.location.href = "/login";
      return [];
    }

    const data = await response.json();
    return data.returned_resultset || [];
  } catch (error) {
    console.error("Error fetching staff attendance:", error);
    return [];
  }
}

export async function checkOutVisitor(id: string) {
  try {
    const formData = new URLSearchParams({ id });
    const response = await fetch(`${API_BASE_URL}visitor-logs`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });
    const result = await response.json();
    return { success: response.ok, data: result };
  } catch (error) {
    console.error("Error checking out visitor:", error);
    return { success: false, error: String(error) };
  }
}
