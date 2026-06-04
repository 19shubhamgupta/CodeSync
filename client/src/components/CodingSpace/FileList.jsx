import { Play } from "lucide-react";

const FileList = ({ files, status, selectedFileId, onSelectFile, onRun }) => {
  return (
    <section className="w-72 border-r border-slate-800 bg-slate-950/70 p-4">
      <div className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-400">
        Files
      </div>
      <div className="space-y-2">
        {status === "loading" && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-xs text-slate-400">
            Loading files...
          </div>
        )}
        {status !== "loading" && files.length === 0 && (
          <div className="text-xs text-slate-500">No files</div>
        )}
        {files.map((file) => (
          <button
            key={file._id}
            className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm transition ${
              selectedFileId === file._id
                ? "bg-slate-800 text-slate-50"
                : "text-slate-300 hover:bg-slate-800/60"
            }`}
            onClick={() => onSelectFile(file)}
          >
            <span className="truncate">{file.name}</span>
            <span className="flex items-center gap-2 text-xs text-slate-500">
              {file.isRunnable && (
                <button
                  type="button"
                  className="rounded border border-emerald-400/30 p-1 text-emerald-300 hover:border-emerald-400"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRun?.(file);
                  }}
                  title="Run"
                >
                  <Play size={12} />
                </button>
              )}
              {file.language || "txt"}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default FileList;
