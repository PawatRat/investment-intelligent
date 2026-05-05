export default function TagFilter({ activeTag, onChange, tags }) {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <button
          className={`border border-black px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] ${
            activeTag === tag ? "bg-black text-white" : "bg-white text-black"
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
