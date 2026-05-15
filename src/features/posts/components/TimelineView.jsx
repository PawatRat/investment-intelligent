import { formatPostDate } from "../../../lib/date.js";
import TagList from "./TagList.jsx";

export default function TimelineView({ items, navigate }) {
  return (
    <div className="mt-10 border-l-2 border-neutral-200">
      {items.map((item) => (
        <article className="relative pb-10 pl-8" key={item.path}>
          <span className="absolute -left-[5px] top-1.5 h-2 w-2 bg-neutral-300 ring-4 ring-white" />
          <time className="text-[13px] font-medium text-neutral-500">
            {formatPostDate(item.date)}
          </time>
          <button
            className="mt-2 block text-left font-serif text-3xl font-normal tracking-tight leading-tight text-neutral-900 transition-colors hover:text-neutral-600"
            onClick={() => {
              if (item.type === "post") {
                navigate(`/posts/${item.slug}`);
              } else if (item.type === "stock") {
                if (item.kind === "Thesis") {
                  navigate(`/stocks/${item.ticker}`);
                } else {
                  navigate(`/stocks/${item.ticker}/${item.slug}`);
                }
              }
            }}
            type="button"
          >
            {item.title}
          </button>
          <p className="mt-3 max-w-2xl font-serif text-sm leading-6 text-neutral-700">{item.description}</p>
          <TagList tags={item.tags} />
        </article>
      ))}
    </div>
  );
}
