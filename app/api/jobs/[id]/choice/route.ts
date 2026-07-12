import { NextResponse } from "next/server";
import { applyChoice } from "@/lib/jobs-store";
import type { ChoiceAction } from "@/lib/types";

interface Body {
  findingId?: string;
  action?: ChoiceAction;
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Body;
  if (!body.findingId || !body.action) {
    return NextResponse.json({ error: "findingId and action required" }, { status: 400 });
  }
  const job = applyChoice(id, body.findingId, body.action);
  if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ state: job.state[body.findingId] });
}
