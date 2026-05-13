export default function DashboardSectionHeader({ title, description, updatedLabel, cadenceLabel }) {
  return (
    <div className="grid gap-3 border-b border-slate-200 bg-slate-50/70 px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {(updatedLabel || cadenceLabel) && (
        <div className="text-left md:min-w-44 md:text-right">
          {updatedLabel && (
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">Updated {updatedLabel}</p>
          )}
          {cadenceLabel && (
            <p className="mt-1 text-[11px] font-normal uppercase tracking-[0.12em] text-slate-400">{cadenceLabel}</p>
          )}
        </div>
      )}
    </div>
  );
}
