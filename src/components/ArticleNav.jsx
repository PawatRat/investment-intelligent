import { useEffect, useState } from "react";

export default function ArticleNav({ headings }) {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    if (!headings.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

        if (visible) {
          setActiveId(visible.target.id);
        }
      },
      {
        rootMargin: "-88px 0px -72% 0px",
        threshold: [0, 1]
      }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (!headings.length) return null;

  const handleClick = (id) => {
    const element = document.getElementById(id);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
    setActiveId(id);
  };

  return (
    <aside className="fixed left-5 top-28 z-10 hidden w-44 min-[720px]:block xl:left-[max(1.25rem,calc((100vw-64rem)/2-14rem))] xl:w-48">
      <nav className="border-l border-slate-200 pl-4" aria-label="Article sections">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          On This Page
        </p>
        <div className="grid gap-1">
          {headings.map((heading) => (
            <button
              className={`block border-l px-3 py-1.5 text-left text-[12px] leading-5 transition-colors ${
                activeId === heading.id
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900"
              } ${heading.depth === 3 ? "ml-3" : ""}`}
              key={heading.id}
              onClick={() => handleClick(heading.id)}
              type="button"
            >
              {heading.text}
            </button>
          ))}
        </div>
      </nav>
    </aside>
  );
}
