import { Tags } from "lucide-react";

export default function TagList({ tags }) {
  if (!tags?.length) return null;

  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          className="inline-flex items-center gap-1 border border-black bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
          key={tag}
        >
          <Tags className="h-3 w-3" />
          {tag}
        </span>
      ))}
    </div>
  );
}
