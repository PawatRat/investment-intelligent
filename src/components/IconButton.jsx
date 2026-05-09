export default function IconButton({ active, children, label, onClick }) {
  return (
    <button
      aria-label={label}
      className={`grid h-10 w-11 place-items-center transition-colors ${
        active ? "bg-white text-neutral-900 shadow-sm" : "bg-transparent text-neutral-500 hover:text-neutral-900"
      }`}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}
