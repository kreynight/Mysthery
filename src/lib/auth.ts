import { cookies } from "next/headers";
import { createHash } from "crypto";

const SESSION_COOKIE = "mysthery_admin";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export function getExpectedHash(): string {
  return hashPassword(process.env.ADMIN_PASSWORD || "admin");
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (!session) return false;
  return session.value === getExpectedHash();
}

export async function setAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, getExpectedHash(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
