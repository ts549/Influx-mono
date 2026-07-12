import type { Logger } from "../../_lib/types";

export function silentLogger(): Logger {
  return {
    log: () => undefined,
    warn: () => undefined,
    flush: async () => undefined,
  };
}

export function consoleLogger(): Logger {
  return {
    log: (msg) => console.log(msg),
    warn: (msg) => console.warn(msg),
    flush: async () => undefined,
  };
}
