import { useEffect } from "react";
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
} from "../store/fileTreeSlice";

const CodingSpacePage = () => {
  const { workspaceId } = useParams();
  const { getToken, isSignedIn } = useAuth();
  const dispatch = useDispatch();
  const {
    nodesByParentId,
    nodeById,
    statusByParentId,
    errorByParentId,
    expandedFolderIds,
    selectedFileId,
  } = useSelector((state) => state.fileTree);

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
        <EditorPane file={selectedFile} />
      </div>
    </div>
  );
};

export default CodingSpacePage;
