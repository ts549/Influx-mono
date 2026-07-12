import { NextResponse } from "next/server";
import { getAnalysis } from "@/lib/analyses-store";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const analysis = await getAnalysis(id);
  if (!analysis) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(analysis);
}
