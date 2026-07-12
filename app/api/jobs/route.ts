import { NextResponse } from "next/server";
import { createJob, listJobs } from "@/lib/jobs-store";

export function GET() {
  return NextResponse.json({ jobs: listJobs() });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    source?: string;
    sessionCode?: string;
  };
  if (!body.source || !body.sessionCode) {
    return NextResponse.json(
      { error: "source and sessionCode are required" },
      { status: 400 },
    );
  }
  const job = createJob({ source: body.source, sessionCode: body.sessionCode });
  return NextResponse.json({ job }, { status: 201 });
}
