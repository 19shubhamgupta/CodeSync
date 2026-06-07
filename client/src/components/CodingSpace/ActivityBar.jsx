import { Files, GitMerge, LayoutTemplate, Settings } from "lucide-react";

const ActivityBar = ({ activePane, onSelectPane }) => {
  const items = [
    { id: "explorer", icon: Files, label: "Explorer" },
    { id: "github", icon: GitMerge, label: "Source Control" },
    { id: "templates", icon: LayoutTemplate, label: "Templates" },
  ];

  return (
    <div className="w-12 shrink-0 bg-[#1f1e1e] flex flex-col items-center py-2 border-r border-[#2d2d2d] z-10">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activePane === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectPane(item.id)}
            title={item.label}
            className={`relative flex h-12 w-12 items-center justify-center transition-colors hover:text-white ${
              isActive ? "text-white" : "text-[#858585]"
            }`}
          >
            {isActive && (
              <div className="absolute left-0 h-full w-[2px] bg-[#007acc]" />
            )}
            <Icon size={24} strokeWidth={1.5} />
          </button>
        );
      })}
      <div className="mt-auto">
        <button
          className="relative flex h-12 w-12 items-center justify-center text-[#858585] transition-colors hover:text-white"
          title="Settings"
        >
          <Settings size={24} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
};

export default ActivityBar;
