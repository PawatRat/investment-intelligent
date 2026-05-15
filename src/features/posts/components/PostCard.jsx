import { CalendarDays } from "lucide-react";
import { formatPostDate } from "../../../lib/date.js";
import TagList from "./TagList.jsx";

export default function PostCard({ item, navigate }) {
  function handleClick() {
    if (item.type === "post") {
      navigate(`/posts/${item.slug}`);
    } else if (item.type === "stock") {
      if (item.kind === "Thesis") {
        navigate(`/stocks/${item.ticker}`);
      } else {
        navigate(`/stocks/${item.ticker}/${item.slug}`);
      }
    }
  }

  return (
    <article className="group flex min-h-[280px] flex-col border border-neutral-200 bg-white p-6 shadow-sm transition-colors duration-300 hover:bg-neutral-50/80">
      <div className="flex items-center gap-2 text-[13px] font-medium text-neutral-500">
        <CalendarDays className="h-4 w-4" />
        {formatPostDate(item.date)}
      </div>
      <button
        className="mt-5 block text-left font-serif text-2xl font-normal tracking-tight leading-tight transition-colors hover:text-neutral-600"
        onClick={handleClick}
        type="button"
      >
        {item.title}
      </button>
      {item.path && (
        <p className="mt-1.5 font-mono text-[11px] leading-4 text-neutral-400">{item.path}</p>
      )}
      <p className="mt-3 flex-1 font-serif text-sm leading-6 text-neutral-700">{item.description}</p>
      <TagList tags={item.tags} />
    </article>
  );
}
