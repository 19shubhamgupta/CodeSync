import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

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

const workspaceSlice = createSlice({
  name: "workspaces",
  initialState: {
    items: [],
    status: "idle",
    error: null,
  },
  reducers: {
    setWorkspaces(state, action) {
      state.items = action.payload;
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
      });
  },
});

export const { setWorkspaces } = workspaceSlice.actions;
export default workspaceSlice.reducer;
