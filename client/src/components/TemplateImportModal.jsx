const TemplateImportModal = ({
  isOpen,
  templates,
  loading,
  error,
  selectedTemplateId,
  rootName,
  onSelectTemplate,
  onRootNameChange,
  onClose,
  onImport,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-semibold">Import Template</h2>
            <p className="text-xs text-slate-400">
              Choose a template and name the root folder.
            </p>
          </div>
          <button
            className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-slate-500"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {loading && (
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
            Loading templates...
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        )}

        {!loading && templates.length > 0 && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {templates.map((template) => (
              <button
                key={template.id}
                className={`rounded-xl border px-4 py-4 text-left transition ${
                  selectedTemplateId === template.id
                    ? "border-cyan-400 bg-slate-800/60"
                    : "border-slate-800 bg-slate-950/60 hover:border-slate-600"
                }`}
                onClick={() => onSelectTemplate(template.id)}
              >
                <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                  {template.icon || "template"}
                </div>
                <div className="mt-2 text-base font-semibold">
                  {template.name}
                </div>
                <p className="mt-1 text-sm text-slate-400">
                  {template.description}
                </p>
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Root Folder Name
          </label>
          <input
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
            placeholder="e.g. api-server"
            value={rootName}
            onChange={(event) => onRootNameChange(event.target.value)}
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-full border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:border-slate-500"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="rounded-full bg-cyan-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400"
            onClick={onImport}
            disabled={!selectedTemplateId}
          >
            Import Template
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateImportModal;
