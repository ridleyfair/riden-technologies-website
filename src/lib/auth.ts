import { SignJWT, jwtVerify } from "jose";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

function getSecret(): Uint8Array {
  let secret: string | undefined;
  try {
    secret = getCloudflareContext().env.AUTH_SECRET;
  } catch {
    // local dev
  }
  secret ??= process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET environment variable is not set");
  return new TextEncoder().encode(secret);
}

export async function createToken(user: AuthUser) {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as AuthUser;
  } catch {
    return null;
  }
}
