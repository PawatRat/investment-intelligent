export async function fetchStocks(signal) {
  const response = await fetch("/api/stocks", { signal });
  if (!response.ok) throw new Error("Unable to load stocks");
  return response.json();
}

export async function fetchStock(ticker, signal) {
  const response = await fetch(`/api/stocks/${ticker}`, { signal });
  if (!response.ok) throw new Error("Stock not found");
  return response.json();
}

export async function fetchActivities(signal) {
  const response = await fetch("/api/activities", { signal });
  if (!response.ok) throw new Error("Unable to load activity");
  return response.json();
}

export async function fetchStockActivity(ticker, signal) {
  const response = await fetch(`/api/stocks/${ticker}/activity`, { signal });
  if (!response.ok) throw new Error("Unable to load stock activity");
  return response.json();
}

export async function fetchPortfolioPerformance(signal) {
  const response = await fetch("/api/portfolio/performance", { signal });
  if (!response.ok) throw new Error("Unable to load portfolio performance");
  return response.json();
}

export async function fetchStockPerformance(ticker, signal) {
  const response = await fetch(`/api/stocks/${ticker}/performance`, { signal });
  if (!response.ok) throw new Error("Unable to load stock performance");
  return response.json();
}

export async function fetchStockNote(ticker, noteSlug, signal) {
  const response = await fetch(`/api/stocks/${ticker}/notes/${noteSlug}`, { signal });
  if (!response.ok) throw new Error("Stock note not found");
  return response.json();
}
