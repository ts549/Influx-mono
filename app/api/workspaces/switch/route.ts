import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWorkspaceByName } from "@/lib/workspaces-store";
import { WORKSPACE_COOKIE, WORKSPACE_COOKIE_MAX_AGE } from "@/lib/workspace";

export const runtime = "nodejs";

interface Body {
  name?: string;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json(
      { error: "name (string) is required in the request body" },
      { status: 400 },
    );
  }
  const workspace = await getWorkspaceByName(body.name);
  if (!workspace) {
    return NextResponse.json({ error: "workspace not found" }, { status: 404 });
  }

  const store = await cookies();
  store.set(WORKSPACE_COOKIE, workspace.name, {
    path: "/",
    maxAge: WORKSPACE_COOKIE_MAX_AGE,
    sameSite: "lax",
  });

  return NextResponse.json({ workspace });
}
