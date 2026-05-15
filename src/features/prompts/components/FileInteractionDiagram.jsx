import { FileInput, FileOutput, Globe } from "lucide-react";

export default function FileInteractionDiagram({ interactions }) {
  if (!interactions || (!interactions.reads?.length && !interactions.writes?.length && !interactions.external?.length)) {
    return null;
  }

  const { reads = [], writes = [], external = [] } = interactions;

  return (
    <div className="mt-6 border border-neutral-200 bg-white p-4">
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-3 text-[11px] font-medium uppercase tracking-widest text-neutral-500">
        <FileInput className="h-3.5 w-3.5" />
        Knowledge Base Interactions
      </div>

      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        {/* INPUTS */}
        {reads.length > 0 && (
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Reads
            </p>
            <div className="space-y-2">
              {reads.map((file, i) => (
                <FileNode key={`read-${i}`} path={file.path} description={file.description} type="read" />
              ))}
            </div>
          </div>
        )}

        {/* ARROW */}
        {(reads.length > 0 || external.length > 0) && (writes.length > 0) && (
          <div className="hidden lg:flex items-center justify-center pt-6">
            <div className="flex flex-col items-center">
              <div className="h-px w-8 bg-neutral-300" />
              <span className="text-[10px] text-neutral-400 mt-1">Agent</span>
            </div>
          </div>
        )}

        {/* OUTPUTS */}
        {writes.length > 0 && (
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Writes
            </p>
            <div className="space-y-2">
              {writes.map((file, i) => (
                <FileNode key={`write-${i}`} path={file.path} description={file.description} type="write" />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* EXTERNAL */}
      {external.length > 0 && (
        <div className="mt-4 border-t border-neutral-200 pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
            External Sources
          </p>
          <div className="flex flex-wrap gap-2">
            {external.map((source, i) => (
              <span
                key={`ext-${i}`}
                className="inline-flex items-center gap-1.5 border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-600"
              >
                <Globe className="h-3 w-3 text-neutral-400" />
                {source}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FileNode({ path, description, type }) {
  const isRead = type === "read";
  return (
    <div className="flex items-start gap-2 border border-neutral-200 bg-neutral-50 px-3 py-2">
      {isRead ? (
        <FileInput className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-500" />
      ) : (
        <FileOutput className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-500" />
      )}
      <div className="min-w-0">
        <p className="font-mono text-[11px] leading-4 text-neutral-700 break-all">{path}</p>
        {description && (
          <p className="mt-0.5 text-[11px] leading-4 text-neutral-500">{description}</p>
        )}
      </div>
    </div>
  );
}
