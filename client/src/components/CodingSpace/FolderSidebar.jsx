import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  Play,
} from "lucide-react";

const FolderSidebar = ({
  nodesByParentId,
  nodeById,
  statusByParentId,
  errorByParentId,
  expandedFolderIds,
  selectedFileId,
  onToggleFolder,
  onSelectFile,
  onRunNode,
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
              className="flex w-full items-center justify-between py-1 text-left hover:bg-[#2a2d2e]"
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
              onClick={() => onToggleFolder(node._id)}
            >
              <span className="flex items-center gap-1.5">
                {isExpanded ? (
                  <ChevronDown size={14} className="text-[#cccccc]" />
                ) : (
                  <ChevronRight size={14} className="text-[#cccccc]" />
                )}
                <Folder size={14} className="text-[#dcb67a]" />
                <span className="truncate text-sm text-[#cccccc]">{node.name}</span>
              </span>
              <span className="flex items-center gap-2 px-2 text-[10px] uppercase tracking-wide text-[#858585]">
                {node.isRunnable && (
                  <button
                    type="button"
                    className="p-1 text-[#4ec9b0] hover:text-[#5ce0c4]"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRunNode?.(node);
                    }}
                    title="Run"
                  >
                    <Play size={12} fill="currentColor" />
                  </button>
                )}
              </span>
            </button>
            {isExpanded && renderNodes(node._id, depth + 1)}
          </div>
        );
      }

      return (
        <button
          key={node._id}
          className={`group flex w-full items-center justify-between py-1 text-left transition ${
            selectedFileId === node._id
              ? "bg-[#37373d] text-white"
              : "text-[#cccccc] hover:bg-[#2a2d2e]"
          }`}
          style={{ paddingLeft: `${depth * 12 + 28}px` }}
          onClick={() => onSelectFile(node._id)}
        >
          <span className="flex items-center gap-1.5">
            <FileText size={14} className="text-[#519aba]" />
            <span className={`truncate text-sm ${selectedFileId === node._id ? "text-white" : "text-[#cccccc]"}`}>
              {node.name}
            </span>
          </span>
          <span className="flex items-center gap-2 px-2 text-xs text-[#858585]">
            {node.isRunnable && (
              <button
                type="button"
                className="opacity-0 group-hover:opacity-100 p-1 text-[#4ec9b0] hover:text-[#5ce0c4] transition-opacity"
                onClick={(event) => {
                  event.stopPropagation();
                  onRunNode?.(node);
                }}
                title="Run"
              >
                <Play size={12} fill="currentColor" />
              </button>
            )}
          </span>
        </button>
      );
    });
  };

  const rootStatus = statusByParentId[null];
  const rootError = errorByParentId[null];
  const hasRootNodes = (nodesByParentId[null] || []).length > 0;
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#cccccc]">
        Explorer
      </div>
      <div className="flex-1 overflow-y-auto pb-4">
        {rootStatus === "loading" && (
          <div className="px-4 py-2 text-xs text-[#858585]">
            Loading folders...
          </div>
        )}

        {rootStatus === "failed" && (
          <div className="mx-2 rounded bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {rootError}
          </div>
        )}
        <div className="mt-1">
          {renderNodes(null)}
          {rootStatus === "succeeded" && !hasRootNodes && (
            <div className="px-4 py-2 text-xs text-[#858585]">
              No files or folders
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FolderSidebar;
