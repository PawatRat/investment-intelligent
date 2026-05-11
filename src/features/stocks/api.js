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

export async function fetchStockNote(ticker, noteSlug) {
  const response = await fetch(`/api/stocks/${ticker}/notes/${noteSlug}`);
  if (!response.ok) throw new Error("Stock note not found");
  return response.json();
}
