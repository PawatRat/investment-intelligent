import { lazy, Suspense } from "react";
import { ArrowLeft, GitGraph } from "lucide-react";
import StateMessage from "../../components/StateMessage.jsx";
import { usePosts } from "../posts/hooks.js";
import { useStocks } from "./hooks.js";

const StockGraphView = lazy(() => import("./components/StockGraphView.jsx"));

export default function StockGraphPage({ navigate }) {
  const { stocks, loading: stocksLoading, error: stocksError } = useStocks();
  const { posts, loading: postsLoading, error: postsError } = usePosts();

  const loading = stocksLoading || postsLoading;
  const error = stocksError || postsError;

  if (loading) {
    return (
      <section className="relative z-10 mx-auto max-w-7xl px-5 py-12">
        <BackButton navigate={navigate} />
        <StateMessage message="Loading knowledge graph..." />
      </section>
    );
  }

  if (error) {
    return (
      <section className="relative z-10 mx-auto max-w-7xl px-5 py-12">
        <BackButton navigate={navigate} />
        <StateMessage message={error} />
      </section>
    );
  }

  return (
    <section className="relative z-10 mx-auto max-w-7xl px-5 py-12">
      <BackButton navigate={navigate} />

      <header className="border-b border-slate-200 pb-8">
        <div className="flex items-center gap-3">
          <GitGraph className="h-5 w-5 text-slate-500" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Knowledge Graph
          </p>
        </div>
        <h1 className="mt-3 font-serif text-4xl font-normal tracking-tight text-slate-900 md:text-5xl">
          Cross-Reference Graph
        </h1>
        <p className="mt-4 max-w-3xl font-serif text-lg leading-8 text-slate-700">
          Stocks, timeline notes, and posts — all connected by shared labels and ticker references.
          Click any node to open it. Hover to isolate its relationships.
        </p>
      </header>

      <div className="mt-8">
        <Suspense
          fallback={
            <div className="flex h-[75vh] items-center justify-center border border-slate-200 bg-white">
              <p className="text-sm text-slate-600">Loading graph...</p>
            </div>
          }
        >
          <StockGraphView height="75vh" navigate={navigate} posts={posts} stocks={stocks} />
        </Suspense>
      </div>
    </section>
  );
}

function BackButton({ navigate }) {
  return (
    <button
      className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-900"
      onClick={() => navigate("/stocks")}
      type="button"
    >
      <ArrowLeft className="h-4 w-4" /> Back to stock library
    </button>
  );
}
