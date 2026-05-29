import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const fetchNodes = createAsyncThunk(
  "fileTree/fetchNodes",
  async ({ workspaceId, parentId, token }, { rejectWithValue }) => {
    try {
      const url = new URL(`${apiBaseUrl}/api/file/workspace/${workspaceId}`);
      url.searchParams.set("parentId", parentId || "");

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const message = await response.text();
        return rejectWithValue(message || "Failed to fetch nodes");
      }

      const data = await response.json();
      return {
        parentId: parentId || null,
        nodes: data.files || [],
      };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch nodes");
    }
  },
);

const fileTreeSlice = createSlice({
  name: "fileTree",
  initialState: {
    nodesByParentId: {},
    nodeById: {},
    statusByParentId: {},
    errorByParentId: {},
    expandedFolderIds: {},
    selectedFileId: null,
  },
  reducers: {
    toggleFolder(state, action) {
      const folderId = action.payload;
      state.expandedFolderIds[folderId] = !state.expandedFolderIds[folderId];
    },
    setSelectedFile(state, action) {
      state.selectedFileId = action.payload;
    },
    updateNodeContent(state, action) {
      const { fileId, content } = action.payload;
      if (state.nodeById[fileId]) {
        state.nodeById[fileId].content = content;
      }
    },
    clearTree(state) {
      state.nodesByParentId = {};
      state.nodeById = {};
      state.statusByParentId = {};
      state.errorByParentId = {};
      state.expandedFolderIds = {};
      state.selectedFileId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNodes.pending, (state, action) => {
        const parentKey = action.meta.arg.parentId || null;
        state.statusByParentId[parentKey] = "loading";
        state.errorByParentId[parentKey] = null;
      })
      .addCase(fetchNodes.fulfilled, (state, action) => {
        const { parentId, nodes } = action.payload;
        state.statusByParentId[parentId] = "succeeded";
        state.nodesByParentId[parentId] = nodes.map((node) => node._id);
        nodes.forEach((node) => {
          state.nodeById[node._id] = node;
        });
      })
      .addCase(fetchNodes.rejected, (state, action) => {
        const parentKey = action.meta.arg.parentId || null;
        state.statusByParentId[parentKey] = "failed";
        state.errorByParentId[parentKey] =
          action.payload || "Failed to fetch nodes";
      });
  },
});

export const { toggleFolder, setSelectedFile, updateNodeContent, clearTree } =
  fileTreeSlice.actions;
export default fileTreeSlice.reducer;
