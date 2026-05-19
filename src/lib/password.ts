const ITERATIONS = 100_000;
const KEY_LENGTH = 32;

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuf(hex: string): Uint8Array {
  return new Uint8Array((hex.match(/.{2}/g) ?? []).map((b) => parseInt(b, 16)));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16) as Uint8Array<ArrayBuffer>);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS },
    key,
    KEY_LENGTH * 8
  );
  return `${bufToHex(salt.buffer)}:${bufToHex(bits)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const saltBuf = hexToBuf(saltHex).buffer as ArrayBuffer;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: saltBuf, iterations: ITERATIONS },
    key,
    KEY_LENGTH * 8
  );
  return bufToHex(bits) === hashHex;
}
