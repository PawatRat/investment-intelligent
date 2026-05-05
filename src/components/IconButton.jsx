export default function IconButton({ active, children, label, onClick }) {
  return (
    <button
      aria-label={label}
      className={`grid h-11 w-12 place-items-center border-l border-black first:border-l-0 ${
        active ? "bg-black text-white" : "bg-white text-black hover:bg-neutral-100"
      }`}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}
