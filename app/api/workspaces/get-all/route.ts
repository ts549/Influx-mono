import { NextResponse } from "next/server";
import { listWorkspaces } from "@/lib/workspaces-store";

export const runtime = "nodejs";

export async function GET() {
  const workspaces = await listWorkspaces();
  return NextResponse.json({ workspaces });
}
