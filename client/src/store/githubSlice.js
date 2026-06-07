import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchGitHubStatus = createAsyncThunk(
  "github/fetchStatus",
  async ({ workspaceId, token }, { rejectWithValue }) => {
    try {
      const res = await fetch(
        `${apiBaseUrl}/api/github/status?workspaceId=${workspaceId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchUserRepos = createAsyncThunk(
  "github/fetchRepos",
  async ({ token }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/github/repos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      return data.repos || [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createGitHubRepo = createAsyncThunk(
  "github/createRepo",
  async ({ repoName, description, token }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/github/create-repo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ repoName, description }),
      });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const linkRepository = createAsyncThunk(
  "github/linkRepo",
  async ({ workspaceId, repoOwner, repoName, branch, token }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/github/link-repo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ workspaceId, repoOwner, repoName, branch }),
      });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const pushToGitHub = createAsyncThunk(
  "github/push",
  async ({ workspaceId, commitMessage, token }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/github/push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ workspaceId, commitMessage }),
      });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const pullFromGitHub = createAsyncThunk(
  "github/pull",
  async ({ workspaceId, token }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/github/pull`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ workspaceId }),
      });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchBranches = createAsyncThunk(
  "github/fetchBranches",
  async ({ workspaceId, token }, { rejectWithValue }) => {
    try {
      const res = await fetch(
        `${apiBaseUrl}/api/github/branches?workspaceId=${workspaceId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const switchBranch = createAsyncThunk(
  "github/switchBranch",
  async ({ workspaceId, branchName, token }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/github/switch-branch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ workspaceId, branchName }),
      });
      if (!res.ok) throw new Error(await res.text());
      return { ...(await res.json()), branchName };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchCommits = createAsyncThunk(
  "github/fetchCommits",
  async ({ workspaceId, token }, { rejectWithValue }) => {
    try {
      const res = await fetch(
        `${apiBaseUrl}/api/github/commits?workspaceId=${workspaceId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const disconnectRepository = createAsyncThunk(
  "github/disconnect",
  async ({ workspaceId, token }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/github/disconnect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ workspaceId }),
      });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const githubSlice = createSlice({
  name: "github",
  initialState: {
    // Auth
    isAuthenticated: false,
    user: null, // { username, name, avatar }
    // Repo
    isRepoLinked: false,
    repo: null, // { owner, name, url, branch, lastSyncedAt }
    // Lists
    repos: [],       // user's GitHub repos for the link modal
    branches: [],
    currentBranch: "main",
    commits: [],
    // UI state
    loading: false,
    reposLoading: false,
    branchesLoading: false,
    commitsLoading: false,
    error: null,
    message: null,
    statusChecked: false,
  },
  reducers: {
    clearGitHubError(state) {
      state.error = null;
    },
    clearGitHubMessage(state) {
      state.message = null;
    },
    resetGitHubStatus(state) {
      state.statusChecked = false;
    },
  },
  extraReducers: (builder) => {
    // ── fetchGitHubStatus ──
    builder
      .addCase(fetchGitHubStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGitHubStatus.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.statusChecked = true;
        state.isAuthenticated = payload.isGitHubAuthConnected;
        state.user = payload.githubUser;
        state.isRepoLinked = payload.isRepoLinked;
        state.repo = payload.repo;
        if (payload.repo?.branch) state.currentBranch = payload.repo.branch;
      })
      .addCase(fetchGitHubStatus.rejected, (state, { payload }) => {
        state.loading = false;
        state.statusChecked = true;
        state.error = payload;
      });

    // ── fetchUserRepos ──
    builder
      .addCase(fetchUserRepos.pending, (state) => { state.reposLoading = true; state.error = null; })
      .addCase(fetchUserRepos.fulfilled, (state, { payload }) => {
        state.reposLoading = false;
        state.repos = payload;
      })
      .addCase(fetchUserRepos.rejected, (state, { payload }) => {
        state.reposLoading = false;
        state.error = payload;
      });

    // ── createGitHubRepo ──
    builder
      .addCase(createGitHubRepo.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createGitHubRepo.fulfilled, (state) => { state.loading = false; })
      .addCase(createGitHubRepo.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      });

    // ── linkRepository ──
    builder
      .addCase(linkRepository.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(linkRepository.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.isRepoLinked = true;
        const gi = payload.workspace?.githubIntegration;
        if (gi) {
          state.repo = {
            owner: gi.repoOwner,
            name: gi.repoName,
            url: gi.repoUrl,
            branch: gi.branch,
          };
          state.currentBranch = gi.branch;
        }
        state.message = "Repository linked successfully!";
      })
      .addCase(linkRepository.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      });

    // ── pushToGitHub ──
    builder
      .addCase(pushToGitHub.pending, (state) => { state.loading = true; state.error = null; state.message = null; })
      .addCase(pushToGitHub.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.message = payload.message || "Pushed successfully!";
      })
      .addCase(pushToGitHub.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      });

    // ── pullFromGitHub ──
    builder
      .addCase(pullFromGitHub.pending, (state) => { state.loading = true; state.error = null; state.message = null; })
      .addCase(pullFromGitHub.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.message = payload.message || "Pulled successfully!";
      })
      .addCase(pullFromGitHub.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      });

    // ── fetchBranches ──
    builder
      .addCase(fetchBranches.pending, (state) => { state.branchesLoading = true; state.error = null; })
      .addCase(fetchBranches.fulfilled, (state, { payload }) => {
        state.branchesLoading = false;
        state.branches = payload.branches || [];
        if (payload.currentBranch) state.currentBranch = payload.currentBranch;
      })
      .addCase(fetchBranches.rejected, (state, { payload }) => {
        state.branchesLoading = false;
        state.error = payload;
      });

    // ── switchBranch ──
    builder
      .addCase(switchBranch.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(switchBranch.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.currentBranch = payload.branchName;
        if (state.repo) state.repo.branch = payload.branchName;
        state.message = `Switched to branch: ${payload.branchName}`;
      })
      .addCase(switchBranch.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      });

    // ── fetchCommits ──
    builder
      .addCase(fetchCommits.pending, (state) => { state.commitsLoading = true; state.error = null; })
      .addCase(fetchCommits.fulfilled, (state, { payload }) => {
        state.commitsLoading = false;
        state.commits = payload.commits || [];
      })
      .addCase(fetchCommits.rejected, (state, { payload }) => {
        state.commitsLoading = false;
        state.error = payload;
      });

    // ── disconnectRepository ──
    builder
      .addCase(disconnectRepository.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(disconnectRepository.fulfilled, (state) => {
        state.loading = false;
        state.isRepoLinked = false;
        state.repo = null;
        state.branches = [];
        state.commits = [];
        state.currentBranch = "main";
        state.message = "Repository disconnected";
      })
      .addCase(disconnectRepository.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      });
  },
});

export const { clearGitHubError, clearGitHubMessage, resetGitHubStatus } =
  githubSlice.actions;

export default githubSlice.reducer;
