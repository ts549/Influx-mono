import { access, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const CONTEXT_DIR = path.join(process.cwd(), "app", "data", "workspace-context");
const SUFFIX = "-context.txt";

function filenameFor(workspaceName: string): string {
  return `${encodeURIComponent(workspaceName)}${SUFFIX}`;
}

function pathFor(workspaceName: string): string {
  return path.join(CONTEXT_DIR, filenameFor(workspaceName));
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

export async function getWorkspaceContextFilename(
  workspaceName: string,
): Promise<string | null> {
  return (await exists(pathFor(workspaceName))) ? filenameFor(workspaceName) : null;
}

export async function getWorkspaceContext(
  workspaceName: string,
): Promise<string | null> {
  const p = pathFor(workspaceName);
  if (!(await exists(p))) return null;
  return readFile(p, "utf8");
}

export async function saveWorkspaceContext(
  workspaceName: string,
  file: File | Blob,
): Promise<void> {
  await mkdir(CONTEXT_DIR, { recursive: true });
  const text = await file.text();
  await writeFile(pathFor(workspaceName), text, "utf8");
}

export async function renameWorkspaceContext(
  oldName: string,
  newName: string,
): Promise<void> {
  if (oldName === newName) return;
  const oldPath = pathFor(oldName);
  if (!(await exists(oldPath))) return;
  await mkdir(CONTEXT_DIR, { recursive: true });
  await rename(oldPath, pathFor(newName));
}
