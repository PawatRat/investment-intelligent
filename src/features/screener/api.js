export async function fetchScreener(signal) {
  const response = await fetch("/api/screener", { signal });
  if (!response.ok) throw new Error("Unable to load macro screener");
  return response.json();
}
