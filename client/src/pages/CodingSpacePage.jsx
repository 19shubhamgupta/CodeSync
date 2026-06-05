import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useDispatch, useSelector } from "react-redux";
import FolderSidebar from "../components/CodingSpace/FolderSidebar";
import EditorPane from "../components/CodingSpace/EditorPane";
import TemplateImportModal from "../components/TemplateImportModal";
import {
  clearTree,
  fetchNodes,
  setSelectedFile,
  toggleFolder,
  updateNodeContent,
} from "../store/fileTreeSlice";
import {
  connectWorkspaceSocket,
  disconnectWorkspaceSocket,
  saveFile,
  listenToFileChanges,
  listenToFileState,
  listenToOpAck,
  emitFileEdit,
  initializeFileState,
} from "../store/workspaceSlice";
import { applyOperation, calculateOperations, transform } from "../utils/ot";

const CodingSpacePage = () => {
  const { workspaceId } = useParams();
  const { getToken, isSignedIn, userId } = useAuth();
  const dispatch = useDispatch();
  const {
    nodesByParentId,
    nodeById,
    statusByParentId,
    errorByParentId,
    expandedFolderIds,
    selectedFileId,
  } = useSelector((state) => state.fileTree);
  const latestContentRef = useRef("");
  const lastSavedContentRef = useRef("");
  const previousFileIdRef = useRef(null);
  const previousContentRef = useRef("");
  const lastSentContentRef = useRef("");
  const revisionRef = useRef(0);
  const pendingOpsRef = useRef([]);
  const suppressEmitRef = useRef(false);
  const typingTimerRef = useRef(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateError, setTemplateError] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateRootName, setTemplateRootName] = useState("");
  const [runLogs, setRunLogs] = useState([]);
  const [runStatus, setRunStatus] = useState("idle");
  const [runError, setRunError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const logCursorRef = useRef(0);

  const apiBaseUrl = useMemo(
    () => import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
    [],
  );

  const saveCurrentFile = useCallback(
    async ({ fileId, force } = {}) => {
      const targetFileId = fileId || selectedFileId;
      if (!targetFileId) {
        console.log("Save skipped: no file selected");
        return;
      }

      const content = latestContentRef.current || "";
      const hasChanges = content !== lastSavedContentRef.current;
      if (!hasChanges && !force) {
        console.log("Save skipped: no changes", {
          fileId: targetFileId,
        });
        return;
      }

      const token = await getToken();
      if (!token) {
        console.log("Save skipped: missing auth token", {
          fileId: targetFileId,
        });
        return;
      }

      try {
        console.log("Saving file", {
          fileId: targetFileId,
          length: content.length,
          forced: !!force,
        });
        await dispatch(
          saveFile({ fileId: targetFileId, content, token }),
        ).unwrap();
        lastSavedContentRef.current = content;
        console.log("Save success", { fileId: targetFileId });
      } catch (error) {
        console.error("Save failed", error);
      }
    },
    [dispatch, getToken, selectedFileId],
  );

  const handleFolderToggle = async (folderId) => {
    dispatch(toggleFolder(folderId));
    const hasLoaded = nodesByParentId[folderId];
    if (!hasLoaded) {
      const token = await getToken();
      if (token) {
        dispatch(fetchNodes({ workspaceId, parentId: folderId, token }));
      }
    }
  };

  const handleFileSelect = (fileId) => {
    dispatch(setSelectedFile(fileId));
  };

  const selectedFile = selectedFileId ? nodeById[selectedFileId] : null;

  const handleOpenTemplateModal = () => {
    setIsTemplateModalOpen(true);
  };

  const handleCloseTemplateModal = () => {
    setIsTemplateModalOpen(false);
    setSelectedTemplateId("");
    setTemplateRootName("");
    setTemplateError(null);
  };

  const loadTemplates = useCallback(async () => {
    if (!isSignedIn) {
      return;
    }

    setTemplateLoading(true);
    setTemplateError(null);

    try {
      const token = await getToken();
      const response = await fetch(`${apiBaseUrl}/api/workspace/templates`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to load templates");
      }

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      setTemplateError(error.message || "Failed to load templates");
    } finally {
      setTemplateLoading(false);
    }
  }, [apiBaseUrl, getToken, isSignedIn]);

  useEffect(() => {
    if (isTemplateModalOpen) {
      loadTemplates();
    }
  }, [isTemplateModalOpen, loadTemplates]);

  const handleImportTemplate = async () => {
    if (!workspaceId || !selectedTemplateId) {
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch(
        `${apiBaseUrl}/api/workspace/${workspaceId}/import-template`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            templateId: selectedTemplateId,
            rootName: templateRootName.trim() || undefined,
          }),
        },
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to import template");
      }

      handleCloseTemplateModal();
      dispatch(clearTree());
      const refreshToken = await getToken();
      if (refreshToken) {
        dispatch(
          fetchNodes({ workspaceId, parentId: null, token: refreshToken }),
        );
      }
    } catch (error) {
      setTemplateError(error.message || "Failed to import template");
    }
  };

  //for loading root folders
  useEffect(() => {
    if (!isSignedIn || !workspaceId) {
      return;
    }
    const loadRoot = async () => {
      dispatch(clearTree());
      const token = await getToken();
      if (token) {
        dispatch(fetchNodes({ workspaceId, parentId: null, token }));
      }
    };

    loadRoot();
  }, [dispatch, getToken, isSignedIn, workspaceId]);

  //for establishing socket connection
  useEffect(() => {
    if (!isSignedIn || !workspaceId || !userId) {
      return;
    }

    dispatch(connectWorkspaceSocket({ workspaceId, userId }));

    return () => {
      dispatch(disconnectWorkspaceSocket({ workspaceId }));
    };
  }, [dispatch, isSignedIn, userId, workspaceId]);

  //for saving when switching b/w files
  useEffect(() => {
    const previousFileId = previousFileIdRef.current;
    if (previousFileId && previousFileId !== selectedFileId) {
      saveCurrentFile({ fileId: previousFileId });
    }

    if (previousFileId !== selectedFileId) {
      previousFileIdRef.current = selectedFileId;
      const initialContent = selectedFile?.content || "";
      latestContentRef.current = initialContent;
      lastSavedContentRef.current = initialContent;
      previousContentRef.current = initialContent;
      lastSentContentRef.current = initialContent;
      revisionRef.current = 0;
      pendingOpsRef.current = [];
    }
  }, [saveCurrentFile, selectedFileId]);

  //calls saveCurrentFile after every 3s
  useEffect(() => {
    if (!isSignedIn || !workspaceId || !selectedFileId) {
      return;
    }

    const intervalId = setInterval(() => {
      saveCurrentFile();
    }, 3000);
    return () => clearInterval(intervalId);
  }, [isSignedIn, selectedFileId, workspaceId, saveCurrentFile]);

  useEffect(() => {
    if (!selectedFileId) {
      return;
    }

    initializeFileState({
      fileId: selectedFileId,
      initialContent: selectedFile?.content || "",
    });
  }, [selectedFileId]);

  useEffect(() => {
    if (!selectedFileId) {
      return undefined;
    }

    const unsubscribeEdits = listenToFileChanges(
      ({ fileId, operation, userId: editorUserId, revision }) => {
        if (fileId !== selectedFileId) {
          return;
        }
        if (editorUserId === userId) {
          console.log("Received own edit, ignoring", { fileId });
          return;
        }

        let transformedOp = { ...operation };
        pendingOpsRef.current.forEach((pendingOp) => {
          transformedOp = transform(pendingOp, transformedOp);
        });

        const currentContent = latestContentRef.current || "";
        const newContent = applyOperation(currentContent, transformedOp);

        console.log("Received external edit", { fileId, editorUserId });
        suppressEmitRef.current = true;
        latestContentRef.current = newContent;
        lastSavedContentRef.current = newContent;
        previousContentRef.current = newContent;
        lastSentContentRef.current = newContent;
        if (typeof revision === "number") {
          revisionRef.current = revision;
        }
        dispatch(updateNodeContent({ fileId, content: newContent }));
      },
    );

    const unsubscribeState = listenToFileState(
      ({ fileId, content, revision }) => {
        if (fileId !== selectedFileId) {
          return;
        }
        const nextContent = content || "";
        latestContentRef.current = nextContent;
        lastSavedContentRef.current = nextContent;
        previousContentRef.current = nextContent;
        lastSentContentRef.current = nextContent;
        revisionRef.current = typeof revision === "number" ? revision : 0;
        pendingOpsRef.current = [];
        suppressEmitRef.current = true;
        dispatch(updateNodeContent({ fileId, content: nextContent }));
      },
    );

    const unsubscribeAck = listenToOpAck(({ fileId, revision }) => {
      if (fileId !== selectedFileId) {
        return;
      }
      if (pendingOpsRef.current.length > 0) {
        pendingOpsRef.current.shift();
      }
      if (typeof revision === "number") {
        revisionRef.current = revision;
      }
    });

    return () => {
      unsubscribeEdits();
      unsubscribeState();
      unsubscribeAck();
    };
  }, [dispatch, selectedFileId, userId]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, []);

  const handleEditorChange = (value) => {
    if (!selectedFileId) {
      console.log("Editor change ignored: no file selected");
      return;
    }

    if (suppressEmitRef.current) {
      suppressEmitRef.current = false;
      previousContentRef.current = value ?? "";
      return;
    }

    const content = value ?? "";
    latestContentRef.current = content;
    dispatch(updateNodeContent({ fileId: selectedFileId, content }));
    console.log("Editor content updated", {
      fileId: selectedFileId,
      length: content.length,
    });
    previousContentRef.current = content;

    if (!workspaceId || !userId) {
      return;
    }

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    typingTimerRef.current = setTimeout(() => {
      const baseContent = lastSentContentRef.current || "";
      const currentContent = latestContentRef.current || "";
      const operations = calculateOperations(baseContent, currentContent);
      if (operations.length === 0) {
        return;
      }

      operations.forEach((operation) => {
        const baseRevision = revisionRef.current + pendingOpsRef.current.length;
        pendingOpsRef.current.push(operation);
        emitFileEdit({
          workspaceId,
          fileId: selectedFileId,
          operation,
          userId,
          baseRevision,
        });
      });

      lastSentContentRef.current = currentContent;
    }, 200);
  };

  const handleEditorSave = useCallback(() => {
    saveCurrentFile({ force: true });
  }, [saveCurrentFile]);

  const fetchLogs = useCallback(async () => {
    if (!workspaceId) {
      return;
    }

    const token = await getToken();
    if (!token) {
      return;
    }

    try {
      const url = new URL(`${apiBaseUrl}/api/workspace/${workspaceId}/logs`);
      url.searchParams.set("since", String(logCursorRef.current));
      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const lines = data.lines || [];
      if (lines.length > 0) {
        logCursorRef.current = data.next ?? logCursorRef.current + lines.length;
        setRunLogs((prev) => {
          const next = [...prev, ...lines];
          return next.length > 1000 ? next.slice(-1000) : next;
        });
      }
    } catch (error) {
      console.log("Log fetch failed", error);
    }
  }, [apiBaseUrl, getToken, workspaceId]);

  useEffect(() => {
    if (runStatus !== "running") {
      return undefined;
    }

    fetchLogs();
    const intervalId = setInterval(() => {
      fetchLogs();
    }, 1000);

    return () => clearInterval(intervalId);
  }, [fetchLogs, runStatus]);

  const handleRunNode = useCallback(
    async (node) => {
      if (!workspaceId || !node?._id) {
        return;
      }

      setRunStatus("starting");
      setRunError(null);
      setPreviewUrl(null);
      setRunLogs([]);
      logCursorRef.current = 0;

      await saveCurrentFile({ force: true });

      try {
        const token = await getToken();
        if (!token) {
          setRunStatus("idle");
          return;
        }

        const response = await fetch(
          `${apiBaseUrl}/api/workspace/${workspaceId}/run/${node._id}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "Failed to run project");
        }

        const data = await response.json();
        setRunStatus("running");
        setPreviewUrl(data.previewUrl || null);

        const shouldOpenPreview = ["react-vite", "cra", "nextjs"].includes(
          data.projectType,
        );
        if (shouldOpenPreview && data.port) {
          window.open(`http://localhost:${data.port}`, "_blank");
        }
      } catch (error) {
        setRunStatus("failed");
        setRunError(error.message || "Failed to run project");
      }
    },
    [apiBaseUrl, getToken, saveCurrentFile, workspaceId],
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
          <div>
            <h1 className="text-base font-semibold text-slate-100">
              Workspace
            </h1>
            <p className="text-xs text-slate-400">
              Import a template to add multiple stacks.
            </p>
          </div>
          <button
            className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-200 hover:border-cyan-400"
            onClick={handleOpenTemplateModal}
          >
            Import Template
          </button>
        </header>
        <TemplateImportModal
          isOpen={isTemplateModalOpen}
          templates={templates}
          loading={templateLoading}
          error={templateError}
          selectedTemplateId={selectedTemplateId}
          rootName={templateRootName}
          onSelectTemplate={setSelectedTemplateId}
          onRootNameChange={setTemplateRootName}
          onClose={handleCloseTemplateModal}
          onImport={handleImportTemplate}
        />
        <div className="flex min-h-screen">
          <FolderSidebar
            nodesByParentId={nodesByParentId}
            nodeById={nodeById}
            statusByParentId={statusByParentId}
            errorByParentId={errorByParentId}
            expandedFolderIds={expandedFolderIds}
            selectedFileId={selectedFileId}
            onToggleFolder={handleFolderToggle}
            onSelectFile={handleFileSelect}
            onRunNode={handleRunNode}
          />
          <div className="flex flex-1 flex-col">
            <EditorPane
              file={selectedFile}
              onChange={handleEditorChange}
              onSave={handleEditorSave}
            />
            <section className="border-t border-slate-800 bg-slate-950/90">
              <div className="flex items-center justify-between px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                <span>Logs</span>
                {runStatus === "running" && (
                  <span className="text-emerald-300">Running</span>
                )}
                {runStatus === "starting" && (
                  <span className="text-cyan-300">Starting</span>
                )}
                {runStatus === "failed" && (
                  <span className="text-rose-300">Failed</span>
                )}
              </div>
              <div className="h-40 overflow-auto px-4 pb-3 text-xs text-slate-200">
                {runError && (
                  <div className="mb-2 rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-rose-200">
                    {runError}
                  </div>
                )}
                {runLogs.length === 0 && !runError && (
                  <div className="text-slate-500">No logs yet.</div>
                )}
                {runLogs.length > 0 && (
                  <pre className="whitespace-pre-wrap">
                    {runLogs.join("\n")}
                  </pre>
                )}
                {previewUrl && runStatus === "running" && (
                  <div className="mt-2 text-slate-400">
                    Preview: {`${apiBaseUrl}${previewUrl}`}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingSpacePage;
