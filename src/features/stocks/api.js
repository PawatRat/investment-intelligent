export async function fetchStocks() {
  const response = await fetch("/api/stocks");
  if (!response.ok) throw new Error("Unable to load stocks");
  return response.json();
}

export async function fetchStock(ticker) {
  const response = await fetch(`/api/stocks/${ticker}`);
  if (!response.ok) throw new Error("Stock not found");
  return response.json();
}

export async function fetchActivities() {
  const response = await fetch("/api/activities");
  if (!response.ok) throw new Error("Unable to load activity");
  return response.json();
}

export async function fetchStockActivity(ticker) {
  const response = await fetch(`/api/stocks/${ticker}/activity`);
  if (!response.ok) throw new Error("Unable to load stock activity");
  return response.json();
}

export async function fetchPortfolioPerformance() {
  const response = await fetch("/api/portfolio/performance");
  if (!response.ok) throw new Error("Unable to load portfolio performance");
  return response.json();
}

export async function fetchStockPerformance(ticker) {
  const response = await fetch(`/api/stocks/${ticker}/performance`);
  if (!response.ok) throw new Error("Unable to load stock performance");
  return response.json();
}

export async function fetchStockNote(ticker, noteSlug) {
  const response = await fetch(`/api/stocks/${ticker}/notes/${noteSlug}`);
  if (!response.ok) throw new Error("Stock note not found");
  return response.json();
}
