import { useEffect, useState } from "react";
import { ArrowLeft, Compass } from "lucide-react";
import ArticleNav from "../../components/ArticleNav.jsx";
import StateMessage from "../../components/StateMessage.jsx";
import { extractMarkdownHeadings } from "../../lib/markdownHeadings.js";
import MarkdownBody from "../posts/components/MarkdownBody.jsx";
import { fetchInvestmentStyle } from "./api.js";

export default function InvestmentStylePage({ navigate }) {
  const [style, setStyle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchInvestmentStyle()
      .then(setStyle)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="relative z-10 mx-auto max-w-4xl px-5 py-12">
        <StateMessage message="Loading investment style..." />
      </section>
    );
  }

  if (error || !style) {
    return (
      <section className="relative z-10 mx-auto max-w-4xl px-5 py-12">
        <BackButton navigate={navigate} />
        <StateMessage message={error || "Investment style not found"} />
      </section>
    );
  }

  const headings = extractMarkdownHeadings(style.markdown, "investment-style");

  return (
    <>
      <ArticleNav headings={headings} />
      <article className="relative z-10 mx-auto max-w-4xl px-5 py-12 min-[720px]:ml-56 min-[720px]:mr-5 xl:mx-auto">
        <BackButton navigate={navigate} />
        <header className="border-b border-slate-200 pb-12">
          <div className="mb-4 inline-flex items-center gap-2 border border-slate-200 px-3 py-1.5 text-[11px] font-medium uppercase tracking-widest text-slate-500">
            <Compass className="h-3 w-3" />
            Investor Profile
          </div>
          <h1 className="font-serif text-4xl font-normal tracking-tight text-slate-900 md:text-5xl md:leading-tight">
            {style.title}
          </h1>
          {style.updated && (
            <p className="mt-5 text-base leading-7 text-slate-600">
              Updated: <span className="font-mono text-sm text-slate-900">{style.updated}</span>
            </p>
          )}
        </header>
        <MarkdownBody markdown={style.markdown.replace(/^# .+\n+/, "")} slug="investment-style" />
      </article>
    </>
  );
}

function BackButton({ navigate }) {
  return (
    <button
      className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-900"
      onClick={() => navigate("/")}
      type="button"
    >
      <ArrowLeft className="h-4 w-4" /> Back to index
    </button>
  );
}
