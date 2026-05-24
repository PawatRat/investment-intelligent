export async function fetchScreener(signal) {
  const response = await fetch("/api/screener", { signal });
  if (!response.ok) throw new Error("Unable to load macro screener");
  return response.json();
}

export async function createDiscoveryRequest(payload) {
  const response = await fetch("/api/screener/discovery-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error("Unable to save discovery request");
  return response.json();
}

export async function fetchDiscoveryResults(signal) {
  const response = await fetch("/api/screener/discovery-results", { signal });
  if (!response.ok) throw new Error("Unable to load discovery suggestions");
  return response.json();
}

export async function applyScreenerSuggestions() {
  const response = await fetch("/api/screener/apply-suggestions", { method: "POST" });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Unable to apply discovery suggestions");
  }
  return response.json();
}
