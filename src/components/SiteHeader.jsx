import { Terminal } from "lucide-react";
import { siteConfig } from "../config/site.js";

export default function SiteHeader({ navigate }) {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <button
          className="group flex items-center gap-3 text-left transition-opacity hover:opacity-80"
          onClick={() => navigate("/")}
          type="button"
        >
          <span className="grid h-10 w-10 place-items-center bg-neutral-900 text-white shadow-sm">
            {siteConfig.initials}
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-wide text-neutral-900">
              {siteConfig.name}
            </span>
            <span className="block text-xs text-neutral-500">{siteConfig.tagline}</span>
          </span>
        </button>

        <div className="flex items-center gap-3">
          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-neutral-500 transition-colors hover:text-neutral-900"
            onClick={() => navigate("/prompts")}
            type="button"
          >
            <Terminal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Prompts</span>
          </button>
          <span className="hidden border border-neutral-200 bg-neutral-50/50 px-4 py-1.5 text-[11px] font-medium tracking-widest text-neutral-500 uppercase sm:block">
            Minimal Edition
          </span>
        </div>
      </div>
    </header>
  );
}
