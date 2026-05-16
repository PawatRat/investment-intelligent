import investmentStyleMarkdown from "../../../content/investment-style.md?raw";

export async function fetchInvestmentStyle() {
  try {
    const response = await fetch("/api/investment-style");
    if (!response.ok) throw new Error("Unable to load investment style");
    return response.json();
  } catch {
    return parseInvestmentStyleMarkdown(investmentStyleMarkdown);
  }
}

function parseInvestmentStyleMarkdown(markdown) {
  const title = markdown.split("\n").find((line) => line.startsWith("# "))?.replace(/^#\s+/, "") || "Investment Style";
  const updated = markdown.match(/^Updated:\s*(.+)$/m)?.[1] || "";

  return { title, updated, markdown };
}
