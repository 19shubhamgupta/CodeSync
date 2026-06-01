import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { io } from "socket.io-client";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

let workspaceSocket = null;
let activeWorkspaceId = null;

export const fetchWorkspaces = createAsyncThunk(
  "workspaces/fetch",
  async ({ token }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/workspace`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const message = await response.text();
        return rejectWithValue(message || "Failed to fetch workspaces");
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch workspaces");
    }
  },
);

export const saveFile = createAsyncThunk(
  "workspaces/saveFile",
  async ({ fileId, content, token }, { rejectWithValue }) => {
    try {
      if (!fileId) {
        return rejectWithValue("File id required");
      }

      const response = await fetch(`${apiBaseUrl}/api/file/${fileId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const message = await response.text();
        return rejectWithValue(message || "Failed to save file");
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message || "Failed to save file");
    }
  },
);

const workspaceSlice = createSlice({
  name: "workspaces",
  initialState: {
    items: [],
    status: "idle",
    error: null,
    socketStatus: "idle",
    activeWorkspaceId: null,
    saveStatus: "idle",
    saveError: null,
  },
  reducers: {
    setWorkspaces(state, action) {
      state.items = action.payload;
    },
    setSocketStatus(state, action) {
      state.socketStatus = action.payload;
    },
    setActiveWorkspaceId(state, action) {
      state.activeWorkspaceId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaces.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload.workspaces || [];
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to fetch workspaces";
      })
      .addCase(saveFile.pending, (state) => {
        state.saveStatus = "saving";
        state.saveError = null;
      })
      .addCase(saveFile.fulfilled, (state) => {
        state.saveStatus = "saved";
      })
      .addCase(saveFile.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload || "Failed to save file";
      });
  },
});

export const { setWorkspaces, setSocketStatus, setActiveWorkspaceId } =
  workspaceSlice.actions;

const connectToWorkspace = ({ workspaceId, userId }) => {
  if (!workspaceId || !userId) {
    return null;
  }

  if (workspaceSocket && activeWorkspaceId === workspaceId) {
    return workspaceSocket;
  }

  if (workspaceSocket) {
    workspaceSocket.emit("leaveWorkspace", { workspaceId: activeWorkspaceId });
    workspaceSocket.disconnect();
    workspaceSocket = null;
  }

  activeWorkspaceId = workspaceId;
  workspaceSocket = io(apiBaseUrl, {
    query: { userId },
  });

  workspaceSocket.emit("joinWorkspace", { workspaceId });

  return workspaceSocket;
};

const disconnectFromWorkspace = ({ workspaceId }) => {
  if (!workspaceSocket) {
    return;
  }

  const roomId = workspaceId || activeWorkspaceId;
  if (roomId) {
    workspaceSocket.emit("leaveWorkspace", { workspaceId: roomId });
  }

  workspaceSocket.disconnect();
  workspaceSocket = null;
  activeWorkspaceId = null;
};

export const connectWorkspaceSocket =
  ({ workspaceId, userId }) =>
  (dispatch) => {
    if (!workspaceId || !userId) {
      return;
    }

    dispatch(setSocketStatus("connecting"));
    connectToWorkspace({ workspaceId, userId });
    dispatch(setActiveWorkspaceId(workspaceId));
    dispatch(setSocketStatus("connected"));
  };

export const disconnectWorkspaceSocket =
  ({ workspaceId } = {}) =>
  (dispatch) => {
    dispatch(setSocketStatus("disconnecting"));
    disconnectFromWorkspace({ workspaceId });
    dispatch(setActiveWorkspaceId(null));
    dispatch(setSocketStatus("idle"));
  };

export const listenToFileChanges = (callback) => {
  if (!workspaceSocket) {
    return () => {};
  }

  const handler = (data) => {
    callback(data);
  };

  workspaceSocket.on("file:edited", handler);

  return () => {
    workspaceSocket.off("file:edited", handler);
  };
};

export const listenToFileState = (callback) => {
  if (!workspaceSocket) {
    return () => {};
  }

  const handler = (data) => {
    callback(data);
  };

  workspaceSocket.on("file:state", handler);

  return () => {
    workspaceSocket.off("file:state", handler);
  };
};

export const listenToOpAck = (callback) => {
  if (!workspaceSocket) {
    return () => {};
  }

  const handler = (data) => {
    callback(data);
  };

  workspaceSocket.on("op:ack", handler);

  return () => {
    workspaceSocket.off("op:ack", handler);
  };
};

export const initializeFileState = ({ fileId, initialContent }) => {
  if (!workspaceSocket || !fileId) {
    return;
  }

  workspaceSocket.emit("file:open", {
    fileId,
    initialContent: initialContent || "",
  });
};

export const emitFileEdit = ({
  workspaceId,
  fileId,
  operation,
  userId,
  baseRevision,
}) => {
  if (!workspaceSocket) {
    return;
  }

  if (!workspaceId || !fileId || !operation) {
    return;
  }

  workspaceSocket.emit("file:edit", {
    workspaceId,
    fileId,
    operation,
    userId,
    baseRevision,
    timestamp: new Date().toISOString(),
  });
};

export const getWorkspaceSocket = () => workspaceSocket;
export default workspaceSlice.reducer;
