import Editor from "@monaco-editor/react";
import { FileText } from "lucide-react";

const EditorPane = ({ file, onChange, onSave }) => {
  if (!file || file.type !== "file") {
    return (
      <section className="flex flex-1 items-center justify-center bg-[#181818]">
        <div className="text-sm text-[#858585]">
          Select a file to start editing.
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col bg-[#1f1e1e]">
      <div className="flex bg-[#181818]">
        <div className="flex items-center gap-2 border-t-[1px] border-t-[#007acc] bg-[#1e1e1e] px-4 py-2 text-sm text-[#cccccc]">
          <FileText size={14} className="text-[#519aba]" />
          {file.name}
        </div>
      </div>
      <Editor
        height="100%"
        theme="custom-dark"
        beforeMount={(monaco) => {
          monaco.editor.defineTheme("custom-dark", {
            base: "vs-dark",
            inherit: true,
            rules: [],
            colors: {
              "editor.background": "#181818",
            },
          });
        }}
        language={file.language || "plaintext"}
        value={file.content || ""}
        onChange={onChange}
        onMount={(editor, monaco) => {
          if (!onSave) return;

          editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            onSave();
          });
        }}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          fontFamily: "'Consolas', 'Courier New', monospace",
        }}
      />
    </section>
  );
};

export default EditorPane;
