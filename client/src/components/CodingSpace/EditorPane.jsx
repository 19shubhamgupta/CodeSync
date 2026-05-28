import Editor from "@monaco-editor/react";

const EditorPane = ({ file }) => {
    console.log("Rendering EditorPane with file:", file);
  if (!file || file.type !== "file") {
    return (
      <section className="flex flex-1 items-center justify-center bg-slate-950">
        <div className="text-sm text-slate-400">
          Select a file to start editing.
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col bg-slate-950">
      <div className="border-b border-slate-800 px-4 py-3 text-sm text-slate-300">
        {file.name}
      </div>
      <Editor
        height="100%"
        theme="vs-dark"
        language={file.language || "plaintext"}
        value={file.content || ""}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
        }}
      />
    </section>
  );
};

export default EditorPane;
