const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1";
const TOKEN_STORAGE_KEY = "carelink_token";

export function getToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

class ApiError extends Error {
  constructor(message, status, details, retryAfterSeconds) {
    super(message);
    this.status = status;
    this.details = details;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function parseRetryAfterSeconds(response) {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter && !Number.isNaN(Number(retryAfter))) return Number(retryAfter);

  // express-rate-limit's standard (draft-7) header, seconds until the window resets.
  const rateLimitReset = response.headers.get("ratelimit-reset");
  if (rateLimitReset && !Number.isNaN(Number(rateLimitReset))) return Number(rateLimitReset);

  return undefined;
}

async function request(path, { method = "GET", body, auth = false, query } = {}) {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const headers = isFormData ? {} : { "Content-Type": "application/json" };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let url = `${API_BASE_URL}${path}`;
  if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") params.set(key, value);
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    if (response.status === 429) {
      const retryAfterSeconds = parseRetryAfterSeconds(response);
      const message =
        payload?.error?.message ||
        (retryAfterSeconds
          ? `Too many attempts. Please try again in ${Math.ceil(retryAfterSeconds / 60)} minute${Math.ceil(retryAfterSeconds / 60) === 1 ? "" : "s"}.`
          : "Too many attempts. Please try again shortly.");
      throw new ApiError(message, response.status, payload?.error?.details, retryAfterSeconds);
    }

    const message = payload?.error?.message || "Something went wrong. Please try again.";
    throw new ApiError(message, response.status, payload?.error?.details);
  }

  return payload;
}

/**
 * Fetches a protected binary file (e.g. a report attachment) with the auth
 * header attached, and returns an object URL. Deliberately not a plain
 * <img src="...?token=..."> link — that would put the JWT in the URL bar,
 * browser history, and server access logs. Caller is responsible for
 * revoking the returned URL (URL.revokeObjectURL) when done with it.
 */
async function getBlobUrl(path) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, { headers });
  if (!response.ok) {
    let message = "Could not load the file.";
    try {
      const payload = await response.json();
      message = payload?.error?.message || message;
    } catch {
      // Non-JSON error body — keep the default message.
    }
    throw new ApiError(message, response.status);
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export const apiClient = {
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) => request(path, { ...options, method: "POST", body }),
  patch: (path, body, options) => request(path, { ...options, method: "PATCH", body }),
  postForm: (path, formData, options) => request(path, { ...options, method: "POST", body: formData }),
  getBlobUrl,
};

export { ApiError, API_BASE_URL };