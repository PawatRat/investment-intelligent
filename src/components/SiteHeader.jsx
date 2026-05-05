import { siteConfig } from "../config/site.js";

export default function SiteHeader({ navigate }) {
  return (
    <header className="relative z-10 border-b border-black bg-white/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <button
          className="group flex items-center gap-3 text-left"
          onClick={() => navigate("/")}
          type="button"
        >
          <span className="grid h-9 w-9 place-items-center border border-black bg-black text-white">
            {siteConfig.initials}
          </span>
          <span>
            <span className="block text-sm font-semibold uppercase tracking-[0.18em]">
              {siteConfig.name}
            </span>
            <span className="block text-xs text-neutral-600">{siteConfig.tagline}</span>
          </span>
        </button>
        <span className="hidden border border-black px-3 py-2 text-xs uppercase tracking-[0.16em] sm:block">
          White / Black / Dots
        </span>
      </div>
    </header>
  );
}
