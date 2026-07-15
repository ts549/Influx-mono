import { access, appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { validateWorkspaceName } from "./validate-workspace-name";

export { validateWorkspaceName };

const WORKSPACES_FILE = path.join(process.cwd(), "app", "data", "workspaces.csv");
const HEADER = "name,type,createdAt\n";

export type WorkspaceType = "personal" | "organization";

export interface Workspace {
  name: string;
  type: WorkspaceType;
  createdAt: string;
}

/** Names must fit safely on a CSV line without needing quoting. */
export function isValidWorkspaceName(name: string): boolean {
  return validateWorkspaceName(name) === null;
}

async function ensureFile(): Promise<void> {
  try {
    await access(WORKSPACES_FILE);
  } catch {
    await mkdir(path.dirname(WORKSPACES_FILE), { recursive: true });
    await writeFile(WORKSPACES_FILE, HEADER, "utf8");
  }
}

function parseRow(row: string): Workspace | null {
  const parts = row.split(",");
  if (parts.length < 3) return null;
  const [name, type, createdAt] = parts;
  if (!name || !type || !createdAt) return null;
  if (type !== "personal" && type !== "organization") return null;
  return { name, type, createdAt };
}

export async function listWorkspaces(): Promise<Workspace[]> {
  await ensureFile();
  const text = await readFile(WORKSPACES_FILE, "utf8");
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return [];
  // Skip header row.
  return lines.slice(1).map(parseRow).filter((w): w is Workspace => w !== null);
}

export async function getWorkspaceByName(name: string): Promise<Workspace | null> {
  const workspaces = await listWorkspaces();
  return workspaces.find((w) => w.name.toLowerCase() === name.toLowerCase()) ?? null;
}

export async function createWorkspace(input: {
  name: string;
  type: WorkspaceType;
}): Promise<Workspace> {
  if (!isValidWorkspaceName(input.name)) {
    throw new Error(
      "Workspace name is invalid — non-empty, no commas or quotes, and up to 60 characters.",
    );
  }
  const existing = await getWorkspaceByName(input.name);
  if (existing) {
    throw new Error(`Workspace "${input.name}" already exists.`);
  }
  const workspace: Workspace = {
    name: input.name,
    type: input.type,
    createdAt: new Date().toISOString(),
  };
  await appendFile(
    WORKSPACES_FILE,
    `${workspace.name},${workspace.type},${workspace.createdAt}\n`,
    "utf8",
  );
  return workspace;
}

export async function renameWorkspace(oldName: string, newName: string): Promise<void> {
  const invalid = validateWorkspaceName(newName);
  if (invalid) throw new Error(invalid);
  if (oldName === newName) return;
  const workspaces = await listWorkspaces();
  const idx = workspaces.findIndex((w) => w.name === oldName);
  if (idx === -1) throw new Error(`Workspace "${oldName}" does not exist.`);
  const collision = workspaces.some(
    (w, i) => i !== idx && w.name.toLowerCase() === newName.toLowerCase(),
  );
  if (collision) throw new Error(`Workspace "${newName}" already exists.`);
  workspaces[idx] = { ...workspaces[idx], name: newName };
  const body = workspaces
    .map((w) => `${w.name},${w.type},${w.createdAt}\n`)
    .join("");
  await writeFile(WORKSPACES_FILE, `${HEADER}${body}`, "utf8");
}
