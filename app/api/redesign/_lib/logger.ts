import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { Logger } from "./types";

const LOGS_DIR = path.join(process.cwd(), "app", "api", "redesign", "logs");

export function createLogger(requestId: string): Logger {
  const lines: string[] = [];
  const record = (level: "log" | "warn", msg: string) => {
    const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${msg}`;
    lines.push(line);
  };

  return {
    log: (msg) => record("log", msg),
    warn: (msg) => record("warn", msg),
    flush: async () => {
      if (lines.length === 0) return;
      await mkdir(LOGS_DIR, { recursive: true });
      const filePath = path.join(LOGS_DIR, `${requestId}.log`);
      await appendFile(filePath, lines.join("\n") + "\n", "utf8");
    },
  };
}
