import { randomBytes } from "crypto";
import { env } from "../config/env";

// Deliberately excludes ambiguous characters (0/O, 1/I/l) so tokens are
// easy to read back over the phone or copy from a low-end device.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/**
 * Generates a short, unguessable, human-shareable token that lets an
 * anonymous or non-account-holding reporter check their report's status
 * without authenticating.
 */
export function generateReportToken(length: number = env.REPORT_TOKEN_LENGTH): string {
  const bytes = randomBytes(length);
  let token = "";
  for (let i = 0; i < length; i++) {
    token += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return token;
}
