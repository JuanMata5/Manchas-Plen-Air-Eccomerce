import crypto from "crypto";

const TICKET_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TICKET_CODE_LENGTH = 8;
const TICKET_PREFIX = "PA-";

function getHmacSecret(): string {
  const secret =
    process.env.TICKET_HMAC_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error(
      "Missing TICKET_HMAC_SECRET or SUPABASE_SERVICE_ROLE_KEY environment variable"
    );
  }
  return secret;
}

function hmacSign(code: string): string {
  const secret = getHmacSecret();
  return crypto.createHmac("sha256", secret).update(code).digest("hex");
}

/**
 * Generates a random ticket code with the format 'PA-XXXXXXXX'
 * and an HMAC-SHA256 signature of that code.
 */
export function generateSecureTicketCode(): { code: string; signature: string } {
  const bytes = crypto.randomBytes(TICKET_CODE_LENGTH);
  let randomPart = "";
  for (let i = 0; i < TICKET_CODE_LENGTH; i++) {
    randomPart += TICKET_CHARS[bytes[i] % TICKET_CHARS.length];
  }

  const code = `${TICKET_PREFIX}${randomPart}`;
  const signature = hmacSign(code);

  return { code, signature };
}

/**
 * Verifies that the HMAC signature is valid for the given ticket code.
 */
export function verifyTicketSignature(
  code: string,
  signature: string
): boolean {
  const expected = hmacSign(code);
  // Use timingSafeEqual to prevent timing attacks
  try {
    const expectedBuf = Buffer.from(expected, "hex");
    const signatureBuf = Buffer.from(signature, "hex");
    if (expectedBuf.length !== signatureBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  } catch {
    return false;
  }
}

/**
 * Generates a base64url-encoded JSON payload containing the ticket code
 * and its signature, suitable for embedding in QR codes.
 *
 * Format (before encoding): {"c":"<code>","s":"<signature>"}
 */
export function generateSignedQRPayload(
  code: string,
  signature: string
): string {
  const json = JSON.stringify({ c: code, s: signature });
  return Buffer.from(json, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Parses a base64url-encoded QR payload back into the ticket code
 * and signature. Returns null if the payload is invalid.
 */
export function parseSignedQRPayload(
  payload: string
): { code: string; signature: string } | null {
  try {
    // Restore standard base64 from base64url
    let base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    // Add padding if needed
    const remainder = base64.length % 4;
    if (remainder === 2) {
      base64 += "==";
    } else if (remainder === 3) {
      base64 += "=";
    }

    const json = Buffer.from(base64, "base64").toString("utf-8");
    const parsed = JSON.parse(json);

    if (
      typeof parsed.c !== "string" ||
      typeof parsed.s !== "string" ||
      !parsed.c ||
      !parsed.s
    ) {
      return null;
    }

    return { code: parsed.c, signature: parsed.s };
  } catch {
    return null;
  }
}
