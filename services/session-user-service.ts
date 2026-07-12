import { cookies } from "next/headers";
import {
  AUTH_SESSION_COOKIE_NAME,
  getSessionUserIdFromCookieHeader,
  readSessionToken,
} from "@/lib/auth/session";
import { getUserById } from "@/services/auth-service";

export async function getSessionUserIdFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie");
  return getSessionUserIdFromCookieHeader(cookieHeader);
}

export async function getSessionUserIdFromCookieStore() {
  const store = await cookies();
  const token = store.get(AUTH_SESSION_COOKIE_NAME)?.value;
  return readSessionToken(token)?.userId ?? null;
}

export async function getSessionUserFromCookieStore() {
  const userId = await getSessionUserIdFromCookieStore();
  if (!userId) {
    return null;
  }

  return getUserById(userId);
}
