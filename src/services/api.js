
const DEFAULT_PRODUCTION_API =
  "https://aismartcookingassistant-backend--kh666428.replit.app";

const configuredApiBase = String(
  import.meta.env.VITE_API_BASE_URL || ""
).trim();

export const API_BASE = import.meta.env.DEV
  ? ""
  : (configuredApiBase || DEFAULT_PRODUCTION_API).replace(/\/$/, "");

export async function apiFetch(path, options = {}) {
  // Send JSON or multipart requests to the Flask API and return either JSON or text.
  // Input: Flask path and fetch options. Processing: applies credentials/CORS headers,
  // parses the response, and converts HTTP errors into readable JavaScript errors.
  // Output: response payload. Used by login, logout, detection, and backend API pages.
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
  });

  const type = response.headers.get("content-type") || "";
  const payload = type.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(
      payload?.message ||
      payload?.error ||
      payload ||
      `Request failed (${response.status})`
    );
  }

  return payload;
}
