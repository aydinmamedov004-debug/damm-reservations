import { cookies } from "next/headers";
import { isValidSession } from "./db";

export const SESSION_COOKIE = "damm_admin_session";

export async function isAdminAuthed(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return isValidSession(token);
}
