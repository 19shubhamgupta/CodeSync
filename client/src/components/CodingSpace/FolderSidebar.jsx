import { ChevronDown, ChevronRight, FileText, Folder } from "lucide-react";

const FolderSidebar = ({
  nodesByParentId,
  nodeById,
  statusByParentId,
  errorByParentId,
  expandedFolderIds,
  selectedFileId,
  onToggleFolder,
  onSelectFile,
}) => {
  const renderNodes = (parentId, depth = 0) => {
    const children = nodesByParentId[parentId] || [];

    return children.map((childId) => {
      const node = nodeById[childId];
      if (!node) {
        return null;
      }

      if (node.type === "folder") {
        const isExpanded = !!expandedFolderIds[node._id];
        return (
          <div key={node._id}>
            <button
              className="flex w-full items-center justify-between border-b border-slate-800 px-4 py-2 text-left hover:bg-slate-800"
              style={{ paddingLeft: `${depth * 16 + 16}px` }}
              onClick={() => onToggleFolder(node._id)}
            >
              <span className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown size={14} className="text-cyan-300" />
                ) : (
                  <ChevronRight size={14} className="text-cyan-300" />
                )}
                <Folder size={16} className="text-blue-400" />
                <span className="truncate text-slate-200">{node.name}</span>
              </span>
              <span className="text-[10px] uppercase tracking-wide text-slate-500">
                folder
              </span>
            </button>
            {isExpanded && renderNodes(node._id, depth + 1)}
          </div>
        );
      }

      return (
        <button
          key={node._id}
          className={`flex w-full items-center justify-between border-b border-slate-800 px-4 py-2 text-left transition ${
            selectedFileId === node._id
              ? "bg-slate-800 text-slate-50"
              : "text-slate-300 hover:bg-slate-800/60"
          }`}
          style={{ paddingLeft: `${depth * 16 + 16}px` }}
          onClick={() => onSelectFile(node._id)}
        >
          <span className="flex items-center gap-2">
            <FileText size={16} className="text-emerald-300" />
            <span className="truncate">{node.name}</span>
          </span>
          <span className="text-xs text-slate-500">
            {node.language || "txt"}
          </span>
        </button>
      );
    });
  };

  const rootStatus = statusByParentId[null];
  const rootError = errorByParentId[null];
  const hasRootNodes = (nodesByParentId[null] || []).length > 0;
  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/70">
      <div className="border-b border-slate-800 px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-400">
        Explorer
      </div>
      {rootStatus === "loading" && (
        <div className="border-b border-slate-800 px-4 py-3 text-xs text-slate-400">
          Loading folders...
        </div>
      )}

      {rootStatus === "failed" && (
        <div className="border-b border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
          {rootError}
        </div>
      )}
      <div className="text-sm text-slate-200">
        {renderNodes(null)}
        {rootStatus === "succeeded" && !hasRootNodes && (
          <div className="px-4 py-3 text-xs text-slate-500">
            No files or folders
          </div>
        )}
      </div>
    </aside>
  );
};

export default FolderSidebar;
