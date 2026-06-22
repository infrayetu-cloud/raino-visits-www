// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getToken(): string {
  // Read using the same key as STORAGE_KEYS.token
  try {
    const raw = localStorage.getItem("visitor_app_token");
    return raw ? JSON.parse(raw) : "";
  } catch {
    return "";
  }
}

export async function searchHosts(query: string) {
  try {
    const params = new URLSearchParams({
      names: query,
      limit: "10",
      offset: "0",
      active: "true",
    });

    const response = await fetch(`${API_BASE_URL}user?${params}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    if (response.status === 401) {
      window.location.href = "/login";
      return [];
    }

    if (!response.ok) throw new Error("Search failed");

    const data = await response.json();
    return data.returned_resultset || [];
  } catch (error) {
    console.error("Error searching hosts:", error);
    return [];
  }
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
  hostName: string;
  hostPhone: string;
  visitorName: string;
  visitorPhone: string;
  scheduledDateTime: string;
}) {
  try {
    const visitorCode = generateVisitorCode(payload.scheduledDateTime);

    const formData = new FormData();
    formData.append("action", "request_visitor_code");
    formData.append("host_id", payload.hostId);
    formData.append("host_phone", payload.hostPhone);
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
  hostPhone: string;
  visitorName: string;
  visitorPhone: string;
  visitReason: string;
  scheduledDateTime: string;
  visitorCode: string;
  photoFile?: File;
}) {
  try {
    const formData = new FormData();
    formData.append("action", "submit_visitor_log");
    formData.append("host_id", payload.hostId); // ✅ fixed
    formData.append("host_phone", payload.hostPhone);
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
