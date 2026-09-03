import rateLimit from "express-rate-limit";

/**
 * Applied to the public, unauthenticated report-submission endpoint.
 * Generous enough for genuine repeated use from a shared community
 * device, but bounds automated/abusive flooding of the triage queue.
 */
export const reportSubmissionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Too many reports submitted from this network. Please try again later." } },
});

/** Looser general-purpose limiter for the rest of the public API surface. */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

/** Applied to the public attachment-upload endpoint — file writes are costlier than a JSON POST. */
export const attachmentUploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Too many uploads from this network. Please try again later." } },
});

/** Stricter limiter for the login endpoint to slow credential-stuffing attempts. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Too many login attempts. Please try again later." } },
});

/**
 * Applied to the public report-status-by-token lookup. The token space is
 * large (32^10), but this endpoint is still an unauthenticated enumeration
 * target, so it's throttled like every other public route rather than left
 * open.
 */
export const reportStatusLookupLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Too many status checks from this network. Please try again later." } },
});
