import { useEffect, useState } from "react";
import { ArrowLeft, Check, ClipboardCheck, Clock, Compass, Search, TrendingUp } from "lucide-react";
import StateMessage from "../../components/StateMessage.jsx";
import { useScreener } from "./hooks.js";
import { applyScreenerSuggestions, createDiscoveryRequest, fetchDiscoveryResults } from "./api.js";

const FOCUS_OPTIONS = ["All", "AI infrastructure", "Software", "Consumer", "Macro risks", "custom"];
const HORIZON_OPTIONS = ["near-term", "6-12 months", "multi-year"];
const OUTPUT_OPTIONS = ["all", "new themes", "new candidates", "risk flags"];

export default function ScreenerIndex({ navigate }) {
  const { screener, loading, error, refetch } = useScreener();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showLastDiscovery, setShowLastDiscovery] = useState(false);
  const [discoveryResults, setDiscoveryResults] = useState(null);
  const [discoveryLoading, setDiscoveryLoading] = useState(true);
  const [discoveryError, setDiscoveryError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [savingRequest, setSavingRequest] = useState(false);
  const [applyingSuggestions, setApplyingSuggestions] = useState(false);
  const [requestForm, setRequestForm] = useState({
    focusArea: "All",
    customFocus: "",
    horizon: "6-12 months",
    output: "all",
    notes: ""
  });

  useEffect(() => {
    return loadDiscoveryResults();
  }, []);

  function loadDiscoveryResults() {
    const controller = new AbortController();
    setDiscoveryLoading(true);
    setDiscoveryError("");
    fetchDiscoveryResults(controller.signal)
      .then(setDiscoveryResults)
      .catch((e) => { if (e.name !== "AbortError") setDiscoveryError(e.message); })
      .finally(() => setDiscoveryLoading(false));
    return () => controller.abort();
  }

  async function submitDiscoveryRequest(event) {
    event.preventDefault();
    setSavingRequest(true);
    setFeedback("");
    try {
      await createDiscoveryRequest(requestForm);
      setFeedback("Discovery request saved.");
      setShowRequestForm(false);
      refetch();
    } catch (e) {
      setFeedback(e.message);
    } finally {
      setSavingRequest(false);
    }
  }

  async function applySuggestions() {
    setApplyingSuggestions(true);
    setFeedback("");
    try {
      await applyScreenerSuggestions();
      setFeedback("Suggestions applied to screener.");
      refetch();
      loadDiscoveryResults();
    } catch (e) {
      setFeedback(e.message);
    } finally {
      setApplyingSuggestions(false);
    }
  }

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

      <DiscoveryActionBar
        applyingSuggestions={applyingSuggestions}
        discoveryResults={discoveryResults}
        feedback={feedback}
        onApplySuggestions={applySuggestions}
        onFindThemes={() => setShowRequestForm((value) => !value)}
        onReviewSuggestions={() => setShowSuggestions((value) => !value)}
        onShowLastDiscovery={() => setShowLastDiscovery((value) => !value)}
        savingRequest={savingRequest}
      />

      {showRequestForm && (
        <DiscoveryRequestForm
          form={requestForm}
          onChange={setRequestForm}
          onSubmit={submitDiscoveryRequest}
          saving={savingRequest}
        />
      )}

      {showLastDiscovery && <LastDiscoveryPanel request={screener.discoveryRequest} />}

      {showSuggestions && (
        <DiscoverySuggestions
          applying={applyingSuggestions}
          error={discoveryError}
          loading={discoveryLoading}
          onApply={applySuggestions}
          results={discoveryResults}
        />
      )}

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

function DiscoveryActionBar({ applyingSuggestions, discoveryResults, feedback, onApplySuggestions, onFindThemes, onReviewSuggestions, onShowLastDiscovery, savingRequest }) {
  const hasResults = Boolean(discoveryResults?.hasResults);
  return (
    <section className="mt-6 border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <ActionButton disabled={savingRequest} icon={Search} onClick={onFindThemes}>Find More Themes</ActionButton>
          <ActionButton icon={ClipboardCheck} onClick={onReviewSuggestions}>Review Suggestions</ActionButton>
          <ActionButton icon={Clock} onClick={onShowLastDiscovery}>Last Discovery</ActionButton>
          {hasResults && (
            <ActionButton disabled={applyingSuggestions} icon={Check} onClick={onApplySuggestions}>
              {applyingSuggestions ? "Applying" : "Apply Suggestions"}
            </ActionButton>
          )}
        </div>
        {feedback && <p className="text-sm font-medium text-slate-600">{feedback}</p>}
      </div>
    </section>
  );
}

function DiscoveryRequestForm({ form, onChange, onSubmit, saving }) {
  function update(field, value) {
    onChange({ ...form, [field]: value });
  }

  return (
    <form className="mt-4 border border-slate-200 bg-white p-5" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Focus">
          <select className="w-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400" onChange={(event) => update("focusArea", event.target.value)} value={form.focusArea}>
            {FOCUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </Field>
        <Field label="Horizon">
          <select className="w-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400" onChange={(event) => update("horizon", event.target.value)} value={form.horizon}>
            {HORIZON_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </Field>
        <Field label="Output">
          <select className="w-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400" onChange={(event) => update("output", event.target.value)} value={form.output}>
            {OUTPUT_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </Field>
      </div>
      {form.focusArea === "custom" && (
        <div className="mt-4">
          <Field label="Custom Focus">
            <input className="w-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400" onChange={(event) => update("customFocus", event.target.value)} value={form.customFocus} />
          </Field>
        </div>
      )}
      <div className="mt-4">
        <Field label="Notes">
          <textarea className="min-h-24 w-full border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-700 outline-none focus:border-slate-400" onChange={(event) => update("notes", event.target.value)} value={form.notes} />
        </Field>
      </div>
      <div className="mt-4 flex justify-end">
        <button className="inline-flex items-center gap-2 border border-slate-200 bg-slate-900 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400" disabled={saving} type="submit">
          <Search className="h-4 w-4" />
          {saving ? "Saving" : "Save Discovery Request"}
        </button>
      </div>
    </form>
  );
}

function LastDiscoveryPanel({ request }) {
  if (!request?.hasRequest) {
    return (
      <div className="mt-4">
        <StateMessage message="No discovery request saved yet." />
      </div>
    );
  }

  return (
    <section className="mt-4 border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        <Clock className="h-3.5 w-3.5" />
        Last Discovery
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <MetricBlock label="Scope" value={request.scope || "-"} />
        <MetricBlock label="Horizon" value={request.horizon || "-"} />
        <MetricBlock label="Output" value={request.output || "-"} />
        <MetricBlock label="Status" value={request.status || "-"} />
      </div>
      {request.notes && <p className="mt-4 text-sm leading-6 text-slate-600">{request.notes}</p>}
      {request.requestedAt && <p className="mt-4 font-mono text-xs text-slate-500">{request.requestedAt}</p>}
    </section>
  );
}

function DiscoverySuggestions({ applying, error, loading, onApply, results }) {
  if (loading) return <div className="mt-4"><StateMessage message="Loading discovery suggestions..." /></div>;
  if (error) return <div className="mt-4"><StateMessage message={error} /></div>;
  if (!results?.hasResults) return <div className="mt-4"><StateMessage message="No discovery suggestions found yet." /></div>;

  return (
    <section className="mt-8 border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            <ClipboardCheck className="h-3.5 w-3.5" />
            Discovery Suggestions
          </div>
          <h2 className="mt-2 font-serif text-3xl font-normal text-slate-900">{results.scope || "Latest Discovery"}</h2>
          {results.summary && <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-700">{results.summary}</p>}
        </div>
        <button className="inline-flex items-center gap-2 border border-slate-200 bg-slate-900 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400" disabled={applying} onClick={onApply} type="button">
          <Check className="h-4 w-4" />
          {applying ? "Applying" : "Apply Suggestions"}
        </button>
      </div>
      <SuggestionGroup items={results.newThemes} label="New Themes" renderItem={(item) => <ThemeSuggestion item={item} />} />
      <SuggestionGroup items={results.changedThemes} label="Changed Themes" renderItem={(item) => <ThemeSuggestion item={item} />} />
      <SuggestionGroup items={results.newCandidates} label="New Candidates" renderItem={(item) => <CandidateSuggestion item={item} />} />
      <SuggestionGroup items={results.riskFlags} label="Risk Flags" renderItem={(item) => <RiskSuggestion item={item} />} />
      <EvidenceList evidence={results.evidence} />
      {results.updated && <p className="mt-5 font-mono text-xs text-slate-500">Updated {results.updated}</p>}
    </section>
  );
}

function SuggestionGroup({ items, label, renderItem }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mt-6 border-t border-slate-200 pt-5">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {items.map((item, index) => (
          <article className="border border-slate-200 bg-white p-4" key={item.id || item.ticker || item.name || item.summary || index}>
            {renderItem(item)}
          </article>
        ))}
      </div>
    </div>
  );
}

function ThemeSuggestion({ item }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-serif text-xl font-normal text-slate-900">{item.name || item.theme || item.id}</h4>
        <Score label="Score" value={item.score} />
      </div>
      <KeyValue label="Drivers" value={<ChipList items={item.macroDrivers} />} />
      <KeyValue label="Beneficiaries" value={<ChipList items={item.beneficiaries} />} />
      <KeyValue label="Risks" value={<ChipList items={item.risks} />} />
    </>
  );
}

function CandidateSuggestion({ item }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-mono text-lg font-semibold text-slate-900">{item.ticker || "-"}</h4>
          <p className="mt-1 text-sm text-slate-600">{item.company || item.theme || "-"}</p>
        </div>
        <Badge>{item.action || "research"}</Badge>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{item.portfolioRole || item.summary || "No role configured."}</p>
    </>
  );
}

function RiskSuggestion({ item }) {
  return (
    <>
      <h4 className="font-serif text-xl font-normal text-slate-900">{item.name || item.theme || "Risk flag"}</h4>
      <p className="mt-3 text-sm leading-6 text-slate-600">{item.summary || item.commentary || "-"}</p>
      <div className="mt-3"><ChipList items={item.tickers} /></div>
    </>
  );
}

function EvidenceList({ evidence }) {
  if (!evidence || evidence.length === 0) return null;
  return (
    <div className="mt-6 border-t border-slate-200 pt-5">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Evidence Links</h3>
      <div className="mt-3 space-y-3">
        {evidence.map((item, index) => (
          <article className="border border-slate-200 bg-white p-4" key={`${item.signalType || "signal"}-${item.theme || index}-${index}`}>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{item.signalType || "signal"}</Badge>
              <span className="text-sm font-medium text-slate-900">{item.theme || "-"}</span>
              <ChipList items={item.tickers} />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.summary || "-"}</p>
            {item.sources?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {item.sources.map((source, sourceIndex) => {
                  const href = typeof source === "string" ? source : source.url;
                  const label = typeof source === "string" ? `Source ${sourceIndex + 1}` : (source.title || source.url || `Source ${sourceIndex + 1}`);
                  return href ? (
                    <a className="text-[12px] font-medium text-slate-900 underline decoration-slate-300 underline-offset-4" href={href} key={href} rel="noreferrer" target="_blank">
                      {label}
                    </a>
                  ) : null;
                })}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function ActionButton({ children, disabled = false, icon: Icon, onClick }) {
  return (
    <button className="inline-flex items-center gap-2 border border-slate-200 px-3 py-2 text-[13px] font-semibold text-slate-900 transition-colors hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-white disabled:hover:text-slate-400" disabled={disabled} onClick={onClick} type="button">
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function Field({ children, label }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function MetricBlock({ label, value }) {
  return (
    <div className="border border-slate-200 bg-white p-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-medium text-slate-900">{value}</div>
    </div>
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
