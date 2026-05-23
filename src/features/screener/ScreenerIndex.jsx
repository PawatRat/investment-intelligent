import { ArrowLeft, Compass, Target, TrendingUp } from "lucide-react";
import StateMessage from "../../components/StateMessage.jsx";
import { useScreener } from "./hooks.js";

export default function ScreenerIndex({ navigate }) {
  const { screener, loading, error } = useScreener();

  if (loading) {
    return (
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-12">
        <StateMessage message="Loading macro screener..." />
      </section>
    );
  }

  if (error || !screener) {
    return (
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-12">
        <BackButton navigate={navigate} />
        <StateMessage message={error || "Macro screener not found"} />
      </section>
    );
  }

  const hasContent = screener.macroFactors.length > 0 || screener.themes.length > 0 || screener.candidates.length > 0 || screener.portfolioExposure.length > 0;

  return (
    <section className="relative z-10 mx-auto max-w-6xl px-5 py-12">
      <BackButton navigate={navigate} />

      <header className="grid gap-8 border-b border-slate-200 pb-10 lg:grid-cols-[1fr_300px]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Macro Screener</p>
          <h1 className="mt-3 font-serif text-4xl font-normal tracking-tight text-slate-900 md:text-5xl">
            Top-down investment map
          </h1>
          <p className="mt-4 max-w-3xl font-serif text-lg leading-8 text-slate-700">
            A structured macro layer for regimes, factor trends, theme exposure, candidate stocks, and portfolio concentration. News and article digests stay in posts and stock notes.
          </p>
        </div>
        <aside className="border border-slate-200 bg-white p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Current Regime</div>
          <p className="mt-3 font-serif text-2xl font-normal leading-8 text-slate-900">{screener.regime.name}</p>
          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Risk</span>
            <Badge>{screener.regime.riskLevel}</Badge>
          </div>
          {screener.updated && (
            <p className="mt-3 font-mono text-xs text-slate-500">Updated {screener.updated}</p>
          )}
        </aside>
      </header>

      {!hasContent && (
        <div className="mt-8">
          <StateMessage message="No screener configuration yet. Create content/screener/config.json to populate this page." />
        </div>
      )}

      {hasContent && (
        <>
          <section className="mt-8 border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              <Compass className="h-3.5 w-3.5" />
              Macro Regime
            </div>
            <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-700">{screener.regime.summary || "No regime summary configured."}</p>
          </section>

          <MacroFactors factors={screener.macroFactors} />
          <ThemeMatrix knownTickers={screener.knownTickers} themes={screener.themes} navigate={navigate} />
          <CandidateTable candidates={screener.candidates} navigate={navigate} />
          <PortfolioExposure exposures={screener.portfolioExposure} knownTickers={screener.knownTickers} navigate={navigate} />
        </>
      )}
    </section>
  );
}

function MacroFactors({ factors }) {
  return (
    <section className="mt-8">
      <SectionHeading eyebrow="Factors" title="Macro factor dashboard" />
      {factors.length === 0 ? (
        <StateMessage message="No macro factors configured." />
      ) : (
        <div className="overflow-x-auto border border-slate-200 bg-white">
          <table className="w-full border-collapse text-left">
            <thead className="border-b-2 border-slate-200">
              <tr>
                <HeaderCell>Factor</HeaderCell>
                <HeaderCell>State</HeaderCell>
                <HeaderCell>Trend</HeaderCell>
                <HeaderCell>Impact</HeaderCell>
                <HeaderCell>Themes</HeaderCell>
              </tr>
            </thead>
            <tbody>
              {factors.map((factor) => (
                <tr className="border-b border-slate-100" key={factor.name}>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">{factor.name}</td>
                  <td className="px-4 py-3"><Badge>{factor.state || "-"}</Badge></td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-700">{factor.trend || "-"}</td>
                  <td className="min-w-[18rem] px-4 py-3 text-sm leading-6 text-slate-600">{factor.impact || "-"}</td>
                  <td className="px-4 py-3"><ChipList items={factor.themes} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ThemeMatrix({ knownTickers, themes, navigate }) {
  return (
    <section className="mt-10">
      <SectionHeading eyebrow="Themes" title="Theme exposure matrix" />
      {themes.length === 0 ? (
        <StateMessage message="No themes configured." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {themes.map((theme) => (
            <article className="border border-slate-200 bg-white p-5" key={theme.id || theme.name}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Theme</p>
                  <h2 className="mt-2 font-serif text-2xl font-normal text-slate-900">{theme.name}</h2>
                </div>
                <Score label="Score" value={theme.score} />
              </div>
              <KeyValue label="Macro Drivers" value={<ChipList items={theme.macroDrivers} />} />
              <KeyValue label="Beneficiaries" value={<TickerList knownTickers={knownTickers} navigate={navigate} tickers={theme.beneficiaries} />} />
              <KeyValue label="Risks" value={<ChipList items={theme.risks} />} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function CandidateTable({ candidates, navigate }) {
  return (
    <section className="mt-10">
      <SectionHeading eyebrow="Candidates" title="Macro-fit candidate table" />
      {candidates.length === 0 ? (
        <StateMessage message="No candidates configured." />
      ) : (
        <div className="overflow-x-auto border border-slate-200 bg-white">
          <table className="w-full border-collapse text-left">
            <thead className="border-b-2 border-slate-200">
              <tr>
                <HeaderCell>Ticker</HeaderCell>
                <HeaderCell>Company</HeaderCell>
                <HeaderCell>Status</HeaderCell>
                <HeaderCell>Theme</HeaderCell>
                <HeaderCell className="text-right">Macro</HeaderCell>
                <HeaderCell className="text-right">Theme</HeaderCell>
                <HeaderCell className="text-right">Quality</HeaderCell>
                <HeaderCell className="text-right">Valuation Risk</HeaderCell>
                <HeaderCell>Portfolio Role</HeaderCell>
                <HeaderCell>Action</HeaderCell>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr className="border-b border-slate-100 transition-colors hover:bg-slate-50/50" key={candidate.ticker}>
                  <td className="px-4 py-3">
                    {candidate.existingStock ? (
                      <button className="text-sm font-semibold text-slate-900 transition-colors hover:text-slate-600" onClick={() => navigate(`/stocks/${candidate.ticker}`)} type="button">
                        {candidate.ticker}
                      </button>
                    ) : (
                      <span className="text-sm font-semibold text-slate-900">{candidate.ticker}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{candidate.company || "-"}</td>
                  <td className="px-4 py-3"><Badge>{candidate.status || "new"}</Badge></td>
                  <td className="min-w-[12rem] px-4 py-3 text-sm text-slate-600">{candidate.theme || "-"}</td>
                  <ScoreCell value={candidate.macroFit} />
                  <ScoreCell value={candidate.themeFit} />
                  <ScoreCell value={candidate.quality} />
                  <ScoreCell value={candidate.valuationRisk} />
                  <td className="min-w-[16rem] px-4 py-3 text-sm leading-6 text-slate-600">{candidate.portfolioRole || "-"}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{candidate.action || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function PortfolioExposure({ exposures, knownTickers, navigate }) {
  return (
    <section className="mt-10">
      <SectionHeading eyebrow="Portfolio" title="Macro exposure overview" />
      {exposures.length === 0 ? (
        <StateMessage message="No portfolio exposure configured." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exposures.map((exposure) => (
            <article className="border border-slate-200 bg-white p-5" key={exposure.name}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Exposure</p>
                  <h2 className="mt-2 font-serif text-2xl font-normal text-slate-900">{exposure.name}</h2>
                </div>
                <Badge>{exposure.level || "-"}</Badge>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">{exposure.commentary || "No commentary configured."}</p>
              <div className="mt-4 border-t border-slate-200 pt-4">
                <TickerList knownTickers={knownTickers} navigate={navigate} tickers={exposure.tickers} />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function SectionHeading({ eyebrow, title }) {
  return (
    <header className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
      <div>
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          <TrendingUp className="h-3.5 w-3.5" />
          {eyebrow}
        </div>
        <h2 className="mt-2 font-serif text-3xl font-normal text-slate-900">{title}</h2>
      </div>
    </header>
  );
}

function HeaderCell({ children, className = "" }) {
  return <th className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 ${className}`}>{children}</th>;
}

function Badge({ children }) {
  return <span className="inline-block bg-slate-900 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-white">{children}</span>;
}

function ChipList({ items }) {
  if (!items || items.length === 0) return <span className="text-sm text-slate-400">-</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => (
        <span className="inline-block bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-slate-500" key={item}>{item}</span>
      ))}
    </div>
  );
}

function TickerList({ knownTickers = [], navigate, tickers }) {
  if (!tickers || tickers.length === 0) return <span className="text-sm text-slate-400">-</span>;
  const known = new Set(knownTickers);
  return (
    <div className="flex flex-wrap gap-1.5">
      {tickers.map((ticker) => (
        known.has(ticker) ? (
          <button className="bg-slate-100 px-2 py-1 font-mono text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-900 hover:text-white" key={ticker} onClick={() => navigate(`/stocks/${ticker}`)} type="button">
            {ticker}
          </button>
        ) : (
          <span className="bg-slate-50 px-2 py-1 font-mono text-[11px] font-medium text-slate-400" key={ticker}>{ticker}</span>
        )
      ))}
    </div>
  );
}

function Score({ label, value }) {
  return (
    <div className="min-w-16 border border-slate-200 px-3 py-2 text-center">
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className="mt-1 font-mono text-xl text-slate-900">{Number.isFinite(value) ? value : "-"}</div>
    </div>
  );
}

function ScoreCell({ value }) {
  const numeric = Number(value);
  const safeValue = Number.isFinite(numeric) ? Math.max(0, Math.min(5, numeric)) : 0;
  return (
    <td className="px-4 py-3 text-right">
      <div className="ml-auto w-20">
        <div className="font-mono text-sm tabular-nums text-slate-700">{Number.isFinite(numeric) ? numeric : "-"}</div>
        <div className="mt-1 h-1.5 bg-slate-100">
          <div className="h-1.5 bg-slate-900" style={{ width: `${safeValue * 20}%` }} />
        </div>
      </div>
    </td>
  );
}

function KeyValue({ label, value }) {
  return (
    <div className="mt-4 border-t border-slate-200 pt-4">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</div>
      {value}
    </div>
  );
}

function BackButton({ navigate }) {
  return (
    <button className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-900" onClick={() => navigate("/")} type="button">
      <ArrowLeft className="h-4 w-4" /> Back to index
    </button>
  );
}
