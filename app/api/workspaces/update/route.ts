import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getWorkspaceByName,
  renameWorkspace,
  validateWorkspaceName,
} from "@/lib/workspaces-store";
import { renameWorkspaceContext, saveWorkspaceContext } from "@/lib/workspace-context-store";
import { WORKSPACE_COOKIE, WORKSPACE_COOKIE_MAX_AGE } from "@/lib/workspace";

export const runtime = "nodejs";

const MAX_CONTEXT_BYTES = 20 * 1024 * 1024;

function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) return badRequest("Body must be multipart/form-data.");

  const oldName = form.get("oldName");
  if (typeof oldName !== "string" || !oldName) {
    return badRequest("'oldName' is required.");
  }
  const existing = await getWorkspaceByName(oldName);
  if (!existing) return badRequest(`Workspace "${oldName}" does not exist.`, 404);

  const newNameRaw = form.get("newName");
  const requestedNewName =
    typeof newNameRaw === "string" && newNameRaw.length > 0 ? newNameRaw : null;

  const contextRaw = form.get("context");
  const contextFile = contextRaw instanceof File ? contextRaw : null;
  if (contextFile) {
    if (contextFile.size > MAX_CONTEXT_BYTES) {
      return badRequest("Context file exceeds 20 MB limit.");
    }
    if (!contextFile.name.toLowerCase().endsWith(".txt")) {
      return badRequest("Only .txt files are supported for workspace context.");
    }
  }

  let effectiveName = existing.name;

  if (requestedNewName && requestedNewName !== existing.name) {
    const invalid = validateWorkspaceName(requestedNewName);
    if (invalid) return badRequest(invalid);

    const collision = await getWorkspaceByName(requestedNewName);
    if (collision) {
      return NextResponse.json(
        { error: `A workspace named "${requestedNewName}" already exists.` },
        { status: 409 },
      );
    }

    try {
      await renameWorkspace(existing.name, requestedNewName);
    } catch (e) {
      return badRequest((e as Error).message);
    }
    await renameWorkspaceContext(existing.name, requestedNewName);
    effectiveName = requestedNewName;

    const store = await cookies();
    store.set(WORKSPACE_COOKIE, effectiveName, {
      path: "/",
      maxAge: WORKSPACE_COOKIE_MAX_AGE,
      sameSite: "lax",
    });
  }

  if (contextFile) {
    await saveWorkspaceContext(effectiveName, contextFile);
  }

  return NextResponse.json({ workspaceName: effectiveName });
}
