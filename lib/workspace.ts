import { cookies } from "next/headers";

export const DEFAULT_WORKSPACE = "Fake Site";
export const WORKSPACE_COOKIE = "influx_workspace";
export const WORKSPACE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Resolve the active workspace for the current request from its cookie. */
export async function getCurrentWorkspace(): Promise<string> {
  const store = await cookies();
  return store.get(WORKSPACE_COOKIE)?.value || DEFAULT_WORKSPACE;
}
