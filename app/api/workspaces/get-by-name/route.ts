import { NextResponse } from "next/server";
import { getWorkspaceByName } from "@/lib/workspaces-store";

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
  return NextResponse.json({ exists: workspace !== null, workspace });
}
