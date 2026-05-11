# Prompts Library

This folder stores reusable AI agent prompt templates. Each `.md` file is a recipe that an agent can read, execute, and publish the result as a post to Knowledge Core.

## How It Works

```
You → Agent: "Run prompts/growth-scanner.md"
Agent → Reads prompt template
Agent → Gathers data, runs analysis
Agent → Formats output with front matter
Agent → POSTs to /api/posts
Result → New post live on the site
```

## Prompt File Format

Each prompt file follows this structure:

```markdown
# Prompt Name

**Purpose:** What this prompt gathers and produces

---

## Instructions

Step-by-step what the agent should do.

## Output Format

The exact front matter + markdown structure expected.
```

## Using a Prompt

```
# From the project root:
"Run prompts/stock-report.md for ticker AAPL"

# Or multiple tickers:
"Run prompts/growth-scanner.md across semiconductors"

# Or with a custom topic:
"Run prompts/weekly-brief.md focus on AI hardware"
```

## Writing New Prompts

1. Create a new `.md` file in this folder
2. Follow the format above — clear instructions, explicit output format
3. Include the `tags:` that make sense for filtering
4. Test by asking an agent to run it
