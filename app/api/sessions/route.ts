import { NextResponse } from "next/server";
import { listAnalyses } from "@/lib/analyses-store";

export const runtime = "nodejs";

interface Body {
  workspace?: string;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  if (!body.workspace || typeof body.workspace !== "string") {
    return NextResponse.json(
      { error: "workspace (string) is required in the request body" },
      { status: 400 },
    );
  }
  const analyses = await listAnalyses(body.workspace);
  return NextResponse.json({ analyses });
}
