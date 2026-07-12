import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createWorkspace,
  isValidWorkspaceName,
  type WorkspaceType,
} from "@/lib/workspaces-store";
import { WORKSPACE_COOKIE, WORKSPACE_COOKIE_MAX_AGE } from "@/lib/workspace";

export const runtime = "nodejs";

interface Body {
  name?: string;
  type?: string;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json(
      { error: "name (string) is required in the request body" },
      { status: 400 },
    );
  }
  if (!isValidWorkspaceName(body.name)) {
    return NextResponse.json(
      { error: "Workspace name may not contain commas, quotes, or newlines." },
      { status: 400 },
    );
  }
  const type: WorkspaceType = body.type === "organization" ? "organization" : "personal";

  try {
    const workspace = await createWorkspace({ name: body.name, type });

    // "Switch to" the new workspace by setting the active-workspace cookie.
    const store = await cookies();
    store.set(WORKSPACE_COOKIE, workspace.name, {
      path: "/",
      maxAge: WORKSPACE_COOKIE_MAX_AGE,
      sameSite: "lax",
    });

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // If the name already exists, treat as a client error (409 Conflict).
    if (/already exists/i.test(message)) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
