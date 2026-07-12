import { NextResponse } from "next/server";
import { listAnalyses } from "@/lib/analyses-store";

export const runtime = "nodejs";

export async function GET() {
  const analyses = await listAnalyses();
  return NextResponse.json({ analyses });
}
