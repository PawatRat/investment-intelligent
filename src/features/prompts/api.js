export async function fetchPrompts() {
  const response = await fetch("/api/prompts");
  if (!response.ok) throw new Error("Unable to load prompts");
  return response.json();
}

export async function fetchPrompt(filename) {
  const response = await fetch(`/api/prompts/${filename}`);
  if (!response.ok) throw new Error("Prompt not found");
  return response.json();
}
