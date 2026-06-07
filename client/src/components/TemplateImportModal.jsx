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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl border border-[#3c3c3c] bg-[#1e1e1e] p-6 text-[#cccccc] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#3c3c3c] pb-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Import Template</h2>
            <p className="text-xs text-[#969696] mt-1">
              Choose a template and name the root folder.
            </p>
          </div>
          <button
            className="rounded-lg p-2 text-[#858585] hover:bg-[#252526] hover:text-white transition-colors"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {loading && (
          <div className="mt-6 rounded-lg border border-[#3c3c3c] bg-[#252526] p-4 text-sm text-[#cccccc]">
            Loading templates...
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-lg border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-300">
            {error}
          </div>
        )}

        {!loading && templates.length > 0 && (
          <div className="mt-6 grid gap-4 md:grid-cols-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {templates.map((template) => (
              <button
                key={template.id}
                className={`rounded-lg border p-4 text-left transition-all ${
                  selectedTemplateId === template.id
                    ? "border-[#007acc] bg-[#007acc]/10"
                    : "border-[#3c3c3c] bg-[#252526] hover:border-[#858585] hover:bg-[#2d2d2d]"
                }`}
                onClick={() => onSelectTemplate(template.id)}
              >
                <div className="text-xs font-bold uppercase tracking-wider text-[#007acc]">
                  {template.icon || "template"}
                </div>
                <div className="mt-2 text-base font-semibold text-white">
                  {template.name}
                </div>
                <p className="mt-1 text-sm text-[#969696] line-clamp-2">
                  {template.description}
                </p>
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#969696]">
            Root Folder Name
          </label>
          <input
            className="w-full rounded-lg border border-[#3c3c3c] bg-[#252526] px-4 py-2.5 text-sm text-[#cccccc] focus:border-[#007acc] focus:outline-none focus:ring-1 focus:ring-[#007acc] transition-shadow"
            placeholder="e.g. api-server"
            value={rootName}
            onChange={(event) => onRootNameChange(event.target.value)}
          />
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            className="rounded-lg border border-[#3c3c3c] px-5 py-2 text-sm font-medium text-[#cccccc] hover:bg-[#2a2d2e] transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="rounded-lg bg-[#0e639c] px-5 py-2 text-sm font-medium text-white hover:bg-[#1177bb] disabled:opacity-50 transition-colors"
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
