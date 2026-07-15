export function withWorkspaceContext(
  systemPrompt: string,
  workspaceContext: string | null | undefined,
): string {
  if (!workspaceContext || workspaceContext.trim().length === 0) return systemPrompt;
  return `${systemPrompt}

## Workspace context

Here is the background of the current site and company. These are the features,
their intended actions, and the aesthetic of the website:

${workspaceContext.trim()}
`;
}
