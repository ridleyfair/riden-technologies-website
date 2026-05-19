import { SignJWT, jwtVerify } from "jose";

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-secret-change-in-production");

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export async function createToken(user: AuthUser) {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as AuthUser;
  } catch {
    return null;
  }
}
