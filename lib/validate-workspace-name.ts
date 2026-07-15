/** Names must fit safely on a CSV line without needing quoting. */
export function validateWorkspaceName(name: string): string | null {
  if (!name || name.trim() !== name) {
    return "Workspace name cannot be empty or have leading/trailing spaces.";
  }
  if (name.length > 60) return "Workspace name must be 60 characters or fewer.";
  if (/[,"\n\r]/.test(name)) return "Workspace name cannot contain commas, quotes, or newlines.";
  return null;
}
