export async function fetchInvestmentStyle() {
  const response = await fetch("/api/investment-style");
  if (!response.ok) throw new Error("Unable to load investment style");
  return response.json();
}
