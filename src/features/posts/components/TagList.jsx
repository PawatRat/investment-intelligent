import { Tags } from "lucide-react";

export default function TagList({ tags }) {
  if (!tags?.length) return null;

  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          className="inline-flex items-center gap-1.5 bg-neutral-100 px-3 py-1 text-[12px] font-medium text-neutral-600 transition-colors hover:bg-neutral-200"
          key={tag}
        >
          <Tags className="h-3 w-3" />
          {tag}
        </span>
      ))}
    </div>
  );
}
