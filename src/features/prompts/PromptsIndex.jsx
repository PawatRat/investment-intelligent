import { useEffect, useState } from "react";
import { ArrowLeft, FileText } from "lucide-react";
import StateMessage from "../../components/StateMessage.jsx";
import { fetchPrompts } from "./api.js";

export default function PromptsIndex({ navigate }) {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPrompts()
      .then(setPrompts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="relative z-10 mx-auto max-w-4xl px-5 py-12">
        <StateMessage message="Loading prompts..." />
      </section>
    );
  }

  if (error) {
    return (
      <section className="relative z-10 mx-auto max-w-4xl px-5 py-12">
        <button
          className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-neutral-500 transition-colors hover:text-neutral-900"
          onClick={() => navigate("/")}
          type="button"
        >
          <ArrowLeft className="h-4 w-4" /> Back to index
        </button>
        <StateMessage message={error} />
      </section>
    );
  }

  return (
    <section className="relative z-10 mx-auto max-w-4xl px-5 py-12">
      <button
        className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-neutral-500 transition-colors hover:text-neutral-900"
        onClick={() => navigate("/")}
        type="button"
      >
        <ArrowLeft className="h-4 w-4" /> Back to index
      </button>

      <header className="border-b border-neutral-200 pb-12">
        <h1 className="font-serif text-4xl font-normal tracking-tight text-neutral-900 md:text-5xl">
          Prompts
        </h1>
        <p className="mt-5 text-lg leading-8 text-neutral-700">
          Reusable agent command templates. Each prompt is a recipe — an agent reads it, gathers real data, and publishes the result as a post.
        </p>
      </header>

      {prompts.length === 0 && (
        <StateMessage message="No prompts available." />
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {prompts.map((prompt) => (
          <article
            className="flex min-h-[200px] flex-col border border-neutral-200 bg-white p-6 transition-colors hover:bg-neutral-50/80"
            key={prompt.filename}
          >
            <div className="flex items-center gap-2 text-[13px] font-medium text-neutral-500">
              <FileText className="h-4 w-4" />
              Command Prompt
            </div>
            <h2 className="mt-4 font-serif text-xl font-normal leading-tight text-neutral-900">
              {prompt.title}
            </h2>
            <p className="mt-3 flex-1 text-sm leading-6 text-neutral-600">
              {prompt.purpose}
            </p>
            <button
              className="mt-5 border border-neutral-200 bg-white px-4 py-2.5 text-left text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-900 hover:text-white"
              onClick={() => navigate(`/prompts/${prompt.filename}`)}
              type="button"
            >
              Open /prompts/{prompt.filename}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
