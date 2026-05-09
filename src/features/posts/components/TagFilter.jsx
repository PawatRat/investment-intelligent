export default function TagFilter({ activeTag, onChange, tags }) {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <button
          className={`px-4 py-2 text-[13px] font-medium transition-colors ${
            activeTag === tag ? "bg-neutral-900 text-white shadow-sm" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
          key={tag}
          onClick={() => onChange(tag)}
          type="button"
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
