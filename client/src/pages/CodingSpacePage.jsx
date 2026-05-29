import { useCallback, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useDispatch, useSelector } from "react-redux";
import FolderSidebar from "../components/CodingSpace/FolderSidebar";
import EditorPane from "../components/CodingSpace/EditorPane";
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
  emitFileEdit,
} from "../store/workspaceSlice";

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
  const suppressEmitRef = useRef(false);
  const typingTimerRef = useRef(null);

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

  useEffect(() => {
    if (!isSignedIn || !workspaceId || !userId) {
      return;
    }

    dispatch(connectWorkspaceSocket({ workspaceId, userId }));

    return () => {
      dispatch(disconnectWorkspaceSocket({ workspaceId }));
    };
  }, [dispatch, isSignedIn, userId, workspaceId]);

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
    }
  }, [saveCurrentFile, selectedFileId]);

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
      return undefined;
    }

    const unsubscribe = listenToFileChanges(
      ({ fileId, content, userId: editorUserId }) => {
        if (fileId !== selectedFileId) {
          return;
        }
        if (editorUserId === userId) {
          console.log("Received own edit, ignoring", { fileId });
          return;
        }
        console.log("Received external edit", { fileId, editorUserId });
        suppressEmitRef.current = true;
        latestContentRef.current = content || "";
        lastSavedContentRef.current = content || "";
        dispatch(updateNodeContent({ fileId, content: content || "" }));
      },
    );

    return unsubscribe;
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
      return;
    }

    const content = value ?? "";
    latestContentRef.current = content;
    dispatch(updateNodeContent({ fileId: selectedFileId, content }));
    console.log("Editor content updated", {
      fileId: selectedFileId,
      length: content.length,
    });

    if (!workspaceId || !userId) {
      return;
    }

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    typingTimerRef.current = setTimeout(() => {
      emitFileEdit({
        workspaceId,
        fileId: selectedFileId,
        content,
        userId,
      });
    }, 200);
  };

  const handleEditorSave = useCallback(() => {
    saveCurrentFile({ force: true });
  }, [saveCurrentFile]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
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
        />
        <EditorPane
          file={selectedFile}
          onChange={handleEditorChange}
          onSave={handleEditorSave}
        />
      </div>
    </div>
  );
};

export default CodingSpacePage;
