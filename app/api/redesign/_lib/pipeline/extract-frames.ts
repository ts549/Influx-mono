import { spawn } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import ffmpegPathImport from "ffmpeg-static";
import type { CondensedEvent, Frame, Logger } from "../types";

const ffmpegPath = ffmpegPathImport as unknown as string;

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) {
      reject(new Error("ffmpeg-static did not resolve a binary path."));
      return;
    }
    const proc = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr?.on("data", (d: Buffer) => {
      stderr += d.toString();
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-500)}`));
    });
  });
}

interface Args {
  videoBuffer: Buffer;
  condensedEvents: CondensedEvent[];
  logger: Logger;
}

export async function extractEventFrames({
  videoBuffer,
  condensedEvents,
  logger,
}: Args): Promise<Frame[]> {
  if (condensedEvents.length === 0) return [];

  const workDir = await mkdtemp(path.join(tmpdir(), "itera-frames-"));
  const frames: Frame[] = [];

  try {
    const videoPath = path.join(workDir, "session-replay.mp4");
    await writeFile(videoPath, videoBuffer);

    for (let i = 0; i < condensedEvents.length; i++) {
      const e = condensedEvents[i];
      const outPath = path.join(workDir, `frame-${i}.jpg`);
      await runFfmpeg([
        "-ss",
        String(e.tSeconds),
        "-i",
        videoPath,
        "-frames:v",
        "1",
        "-q:v",
        "3",
        "-y",
        outPath,
      ]);
      try {
        await access(outPath);
      } catch {
        logger.warn(
          `  ffmpeg produced no frame for t=${e.tSeconds}s (likely past video end) — skipping.`,
        );
        continue;
      }
      const buf = await readFile(outPath);
      frames.push({
        base64: buf.toString("base64"),
        mediaType: "image/jpeg",
        tSeconds: e.tSeconds,
        description: e.description,
      });
    }
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }

  return frames;
}
