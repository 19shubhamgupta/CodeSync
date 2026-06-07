import { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth, useUser } from "@clerk/clerk-react";
import {
  Github,
  GitBranch,
  Upload,
  Download,
  Link2,
  Settings,
  GitCommit,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  AlertCircle,
  ExternalLink,
  Unlink,
  RefreshCw,
  Clock,
  User,
  Hash,
  FolderGit2,
} from "lucide-react";
import {
  fetchGitHubStatus,
  fetchUserRepos,
  createGitHubRepo,
  linkRepository,
  pushToGitHub,
  pullFromGitHub,
  fetchBranches,
  switchBranch,
  fetchCommits,
  disconnectRepository,
} from "../../store/githubSlice";

// ─── Shared Modal Shell ──────────────────────────────────────────────────────

function Modal({ title, onClose, children, width = "max-w-lg" }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`relative w-full ${width} rounded-xl border border-[#30363d] bg-[#0d1117] shadow-2xl shadow-black/60`}
        style={{ fontFamily: "'-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#30363d] px-5 py-4 bg-[#0d1117] rounded-t-xl">
          <div className="flex items-center gap-2">
            <Github size={16} className="text-[#8b949e]" />
            <h2 className="text-sm font-semibold text-[#c9d1d9]">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[#8b949e] transition hover:bg-[#21262d] hover:text-[#c9d1d9]"
          >
            <X size={14} />
          </button>
        </div>
        {/* Body */}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Inline status banner ─────────────────────────────────────────────────────

function StatusBanner({ type, message, onDismiss }) {
  if (!message) return null;
  const styles = {
    success: "border-[#2ea043] bg-[#238636]/10 text-[#3fb950]",
    error: "border-[#f85149] bg-[#da3633]/10 text-[#ff7b72]",
    info: "border-[#388bfd] bg-[#1f6feb]/10 text-[#79c0ff]",
  };
  return (
    <div
      className={`mb-4 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${styles[type]}`}
    >
      {type === "success" && (
        <CheckCircle2 size={13} className="mt-0.5 shrink-0" />
      )}
      {type === "error" && (
        <AlertCircle size={13} className="mt-0.5 shrink-0" />
      )}
      {type === "info" && <AlertCircle size={13} className="mt-0.5 shrink-0" />}
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 opacity-60 hover:opacity-100"
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
}

// ─── Primary button ───────────────────────────────────────────────────────────

function Btn({
  onClick,
  disabled,
  loading,
  children,
  variant = "primary",
  className = "",
}) {
  const base =
    "inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition disabled:opacity-50";
  const variants = {
    primary:
      "bg-[#238636] border border-[#2ea043] text-white hover:bg-[#2ea043]",
    success:
      "bg-[#238636] border border-[#2ea043] text-white hover:bg-[#2ea043]",
    danger:
      "bg-[#da3633] border border-[#f85149] text-white hover:bg-[#b62324]",
    ghost:
      "bg-[#21262d] border border-[#363b42] text-[#c9d1d9] hover:bg-[#30363d] hover:border-[#8b949e]",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {loading && <Loader2 size={12} className="animate-spin" />}
      {children}
    </button>
  );
}

// ─── Input helper ─────────────────────────────────────────────────────────────

function Input({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="space-y-1">
      {label && <label className="text-xs font-semibold text-[#8b949e]">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-2 text-xs text-[#c9d1d9] placeholder-[#484f58] outline-none transition focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
      />
    </div>
  );
}

// ─── Textarea helper ──────────────────────────────────────────────────────────

function Textarea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div className="space-y-1">
      {label && <label className="text-xs font-semibold text-[#8b949e]">{label}</label>}
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-2 text-xs text-[#c9d1d9] placeholder-[#484f58] outline-none transition focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
      />
    </div>
  );
}

// ─── Modal: Connect GitHub ────────────────────────────────────────────────────

function ConnectModal({ onClose }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const externalAccount = await user.createExternalAccount({
        strategy: "oauth_github",
        redirectUrl: window.location.href,
      });
      // Redirect to GitHub to authorize
      window.location.href =
        externalAccount.verification.externalVerificationRedirectURL;
    } catch (err) {
      setError(err.message || "Failed to initiate GitHub connection");
      setLoading(false);
    }
  };

  return (
    <Modal title="Connect GitHub Account" onClose={onClose}>
      <div className="space-y-5">
        <div className="rounded-lg border border-[#30363d]/60 bg-[#0d1117]/50 p-4">
          <p className="mb-1 text-xs font-medium text-[#c9d1d9]">
            Link your GitHub account to CodeSync
          </p>
          <p className="text-xs text-[#8b949e]">
            You&apos;ll be redirected to GitHub to authorize access. Once
            connected you can push &amp; pull your workspace code directly.
          </p>
        </div>

        {error && (
          <StatusBanner
            type="error"
            message={error}
            onDismiss={() => setError(null)}
          />
        )}

        <div className="flex items-center gap-3">
          <Btn
            onClick={handleConnect}
            loading={loading}
            variant="primary"
            className="flex-1 justify-center"
          >
            <Github size={13} />
            {loading ? "Redirecting to GitHub…" : "Login with GitHub"}
          </Btn>
          <Btn onClick={onClose} variant="ghost">
            Cancel
          </Btn>
        </div>

        <p className="text-center text-[10px] text-[#484f58]">
          This uses your Clerk account to securely store the GitHub OAuth token.
        </p>
      </div>
    </Modal>
  );
}

// ─── Modal: Link Repository ───────────────────────────────────────────────────

function LinkRepoModal({ workspaceId, onClose, onLinked }) {
  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const { repos, reposLoading, loading, error } = useSelector((s) => s.github);

  const [tab, setTab] = useState("existing"); // "existing" | "new"
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [newRepoName, setNewRepoName] = useState("");
  const [newRepoDesc, setNewRepoDesc] = useState("");
  const [branch, setBranch] = useState("main");
  const [localError, setLocalError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (token) dispatch(fetchUserRepos({ token }));
    })();
  }, [dispatch, getToken]);

  const handleLink = async () => {
    setLocalError(null);
    const token = await getToken();
    if (!token) return;

    try {
      let owner, name;

      if (tab === "existing") {
        if (!selectedRepo) {
          setLocalError("Please select a repository.");
          return;
        }
        owner = selectedRepo.owner;
        name = selectedRepo.name;
      } else {
        if (!newRepoName.trim()) {
          setLocalError("Please enter a repository name.");
          return;
        }
        // Create the repo first
        const createResult = await dispatch(
          createGitHubRepo({
            repoName: newRepoName.trim(),
            description: newRepoDesc,
            token,
          }),
        ).unwrap();
        owner = createResult.repo.owner;
        name = createResult.repo.name;
      }

      await dispatch(
        linkRepository({
          workspaceId,
          repoOwner: owner,
          repoName: name,
          branch,
          token,
        }),
      ).unwrap();

      setSuccess(`✅ Linked to ${owner}/${name}`);
      setTimeout(() => {
        onLinked?.();
        onClose();
      }, 1500);
    } catch (err) {
      setLocalError(err.message || String(err));
    }
  };

  return (
    <Modal title="Link Repository" onClose={onClose} width="max-w-xl">
      <div className="space-y-4">
        {/* Tab selector */}
        <div className="flex gap-1 rounded-lg border border-[#30363d] bg-[#0d1117]/50 p-1">
          {[
            ["existing", "Select existing"],
            ["new", "Create new"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setTab(key);
                setLocalError(null);
              }}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                tab === key
                  ? "bg-[#30363d] text-slate-100"
                  : "text-[#8b949e] hover:text-[#c9d1d9]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Existing repos list */}
        {tab === "existing" && (
          <div className="space-y-2">
            <label className="text-xs text-[#8b949e]">Select repository:</label>
            <div className="max-h-52 overflow-y-auto rounded-lg border border-[#30363d] bg-[#0d1117]/40">
              {reposLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-xs text-[#8b949e]">
                  <Loader2 size={13} className="animate-spin" /> Loading
                  repositories…
                </div>
              ) : repos.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8b949e]">
                  No repositories found
                </div>
              ) : (
                repos.map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => setSelectedRepo(repo)}
                    className={`flex w-full items-center gap-3 border-b border-[#30363d]/50 px-3 py-2.5 text-left transition last:border-0 hover:bg-[#30363d]/40 ${
                      selectedRepo?.id === repo.id ? "bg-cyan-500/10" : ""
                    }`}
                  >
                    <FolderGit2
                      size={14}
                      className={
                        selectedRepo?.id === repo.id
                          ? "text-[#58a6ff]"
                          : "text-[#8b949e]"
                      }
                    />
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-xs font-medium text-[#c9d1d9]">
                        {repo.owner}/{repo.name}
                      </p>
                      {repo.description && (
                        <p className="truncate text-[10px] text-[#8b949e]">
                          {repo.description}
                        </p>
                      )}
                    </div>
                    {selectedRepo?.id === repo.id && (
                      <CheckCircle2
                        size={13}
                        className="shrink-0 text-[#58a6ff]"
                      />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* New repo form */}
        {tab === "new" && (
          <div className="space-y-3">
            <Input
              label="Repository name"
              value={newRepoName}
              onChange={setNewRepoName}
              placeholder="my-awesome-project"
            />
            <Input
              label="Description (optional)"
              value={newRepoDesc}
              onChange={setNewRepoDesc}
              placeholder="A short description"
            />
          </div>
        )}

        {/* Branch */}
        <Input
          label="Default branch"
          value={branch}
          onChange={setBranch}
          placeholder="main"
        />

        {(localError || error) && (
          <StatusBanner
            type="error"
            message={localError || error}
            onDismiss={() => setLocalError(null)}
          />
        )}
        {success && <StatusBanner type="success" message={success} />}

        <div className="flex items-center gap-3 pt-1">
          <Btn
            onClick={handleLink}
            loading={loading}
            variant="success"
            className="flex-1 justify-center"
          >
            <Link2 size={13} />
            {tab === "new" ? "Create & Link Repository" : "Link Repository"}
          </Btn>
          <Btn onClick={onClose} variant="ghost">
            Cancel
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ─── Modal: Push ──────────────────────────────────────────────────────────────

function PushModal({ workspaceId, repo, branch, onClose, onAddLog }) {
  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const { loading } = useSelector((s) => s.github);
  const [commitMessage, setCommitMessage] = useState("Updated from CodeSync");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handlePush = async () => {
    setError(null);
    setSuccess(null);
    const token = await getToken();
    if (!token) return;

    onAddLog?.(`📤 Pushing to ${repo.owner}/${repo.name}:${branch}…`);

    try {
      const result = await dispatch(
        pushToGitHub({ workspaceId, commitMessage, token }),
      ).unwrap();

      onAddLog?.(`📝 Commit: "${commitMessage}"`);
      onAddLog?.(`✅ ${result.message}`);
      setSuccess(`${result.message}`);
    } catch (err) {
      const msg = err.message || String(err);
      onAddLog?.(`❌ Push failed: ${msg}`);
      setError(msg);
    }
  };

  return (
    <Modal title="Push to GitHub" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-lg border border-[#30363d]/60 bg-[#0d1117]/40 px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-[#8b949e]">
            Pushing to
          </p>
          <p className="mt-0.5 text-sm font-semibold text-slate-100">
            {repo.owner}/{repo.name}
            <span className="ml-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-normal text-[#58a6ff]">
              {branch}
            </span>
          </p>
        </div>

        <Textarea
          label="Commit message"
          value={commitMessage}
          onChange={setCommitMessage}
          placeholder="Describe your changes…"
          rows={3}
        />

        {error && (
          <StatusBanner
            type="error"
            message={error}
            onDismiss={() => setError(null)}
          />
        )}
        {success && <StatusBanner type="success" message={success} />}

        <div className="flex items-center gap-3 pt-1">
          <Btn
            onClick={handlePush}
            loading={loading}
            variant="success"
            className="flex-1 justify-center"
            disabled={!commitMessage.trim()}
          >
            <Upload size={13} />
            {loading ? "Pushing…" : "Push"}
          </Btn>
          <Btn onClick={onClose} variant="ghost">
            Cancel
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ─── Modal: Pull ──────────────────────────────────────────────────────────────

function PullModal({
  workspaceId,
  repo,
  branch,
  onClose,
  onAddLog,
  onRefreshTree,
}) {
  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const { loading } = useSelector((s) => s.github);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handlePull = async () => {
    setError(null);
    setSuccess(null);
    const token = await getToken();
    if (!token) return;

    onAddLog?.(`📥 Pulling from ${repo.owner}/${repo.name}:${branch}…`);

    try {
      const result = await dispatch(
        pullFromGitHub({ workspaceId, token }),
      ).unwrap();
      onAddLog?.(`✅ ${result.message}`);
      setSuccess(`${result.message}`);
      onRefreshTree?.();
    } catch (err) {
      const msg = err.message || String(err);
      onAddLog?.(`❌ Pull failed: ${msg}`);
      setError(msg);
    }
  };

  return (
    <Modal title="Pull from GitHub" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-lg border border-[#30363d]/60 bg-[#0d1117]/40 px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-[#8b949e]">
            Pulling from
          </p>
          <p className="mt-0.5 text-sm font-semibold text-slate-100">
            {repo.owner}/{repo.name}
            <span className="ml-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-normal text-[#58a6ff]">
              {branch}
            </span>
          </p>
        </div>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-300">
          ⚠️ Pulling will overwrite local changes for files that exist in the
          remote repository.
        </div>

        {error && (
          <StatusBanner
            type="error"
            message={error}
            onDismiss={() => setError(null)}
          />
        )}
        {success && <StatusBanner type="success" message={success} />}

        <div className="flex items-center gap-3 pt-1">
          <Btn
            onClick={handlePull}
            loading={loading}
            variant="primary"
            className="flex-1 justify-center"
          >
            <Download size={13} />
            {loading ? "Pulling…" : "Pull"}
          </Btn>
          <Btn onClick={onClose} variant="ghost">
            Cancel
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ─── Modal: Branches ──────────────────────────────────────────────────────────

function BranchesModal({ workspaceId, currentBranch, onClose, onAddLog }) {
  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const { branches, branchesLoading, loading } = useSelector((s) => s.github);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (token) dispatch(fetchBranches({ workspaceId, token }));
    })();
  }, [dispatch, getToken, workspaceId]);

  const handleSwitch = async (branchName) => {
    if (branchName === currentBranch) return;
    setError(null);
    setSuccess(null);
    const token = await getToken();
    if (!token) return;
    try {
      await dispatch(switchBranch({ workspaceId, branchName, token })).unwrap();
      setSuccess(`Switched to ${branchName}`);
      onAddLog?.(`🌿 Switched to branch: ${branchName}`);
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  return (
    <Modal title="Switch Branch" onClose={onClose}>
      <div className="space-y-4">
        {branchesLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-xs text-[#8b949e]">
            <Loader2 size={13} className="animate-spin" /> Loading branches…
          </div>
        ) : branches.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#8b949e]">
            No branches found
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto rounded-lg border border-[#30363d] bg-[#0d1117]/40">
            {branches.map((b) => (
              <button
                key={b.name}
                onClick={() => handleSwitch(b.name)}
                disabled={loading}
                className={`flex w-full items-center gap-3 border-b border-[#30363d]/50 px-3 py-2.5 text-left transition last:border-0 hover:bg-[#30363d]/40 ${
                  b.name === currentBranch ? "bg-emerald-500/10" : ""
                }`}
              >
                <GitBranch
                  size={13}
                  className={
                    b.name === currentBranch
                      ? "text-[#3fb950]"
                      : "text-[#8b949e]"
                  }
                />
                <span
                  className={`flex-1 text-xs ${b.name === currentBranch ? "font-semibold text-emerald-300" : "text-[#c9d1d9]"}`}
                >
                  {b.name}
                </span>
                {b.name === currentBranch && (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-[#3fb950]">
                    current
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {error && (
          <StatusBanner
            type="error"
            message={error}
            onDismiss={() => setError(null)}
          />
        )}
        {success && <StatusBanner type="success" message={success} />}

        <Btn
          onClick={onClose}
          variant="ghost"
          className="w-full justify-center"
        >
          Close
        </Btn>
      </div>
    </Modal>
  );
}

// ─── Modal: Commits ───────────────────────────────────────────────────────────

function CommitsModal({ workspaceId, onClose }) {
  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const { commits, commitsLoading, error } = useSelector((s) => s.github);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (token) dispatch(fetchCommits({ workspaceId, token }));
    })();
  }, [dispatch, getToken, workspaceId]);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Modal title="Commit History" onClose={onClose} width="max-w-2xl">
      <div className="space-y-3">
        {commitsLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-xs text-[#8b949e]">
            <Loader2 size={14} className="animate-spin" /> Loading commits…
          </div>
        ) : error ? (
          <StatusBanner type="error" message={error} />
        ) : commits.length === 0 ? (
          <div className="py-10 text-center text-xs text-[#8b949e]">
            No commits found
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {commits.map((commit) => (
              <div
                key={commit.sha}
                className="rounded-lg border border-[#30363d]/60 bg-[#0d1117]/40 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="flex-1 text-xs font-medium text-slate-100 leading-snug">
                    {commit.message}
                  </p>
                  <a
                    href={commit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-[#484f58] transition hover:text-[#58a6ff]"
                  >
                    <ExternalLink size={11} />
                  </a>
                </div>
                <div className="mt-2 flex items-center gap-4 text-[10px] text-[#8b949e]">
                  <span className="flex items-center gap-1">
                    <User size={9} /> {commit.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={9} /> {formatDate(commit.date)}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Hash size={9} /> {commit.sha.slice(0, 7)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <Btn
          onClick={onClose}
          variant="ghost"
          className="w-full justify-center"
        >
          Close
        </Btn>
      </div>
    </Modal>
  );
}

// ─── Modal: Repository Settings ───────────────────────────────────────────────

function SettingsModal({ workspaceId, repo, branch, onClose, onDisconnected }) {
  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const { loading } = useSelector((s) => s.github);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);

  const now = useMemo(() => Date.now(), []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "Never";
    const d = new Date(dateStr);
    const diff = Math.round((now - d) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff} minute${diff !== 1 ? "s" : ""} ago`;
    const hrs = Math.round(diff / 60);
    if (hrs < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleDisconnect = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    const token = await getToken();
    if (!token) return;
    try {
      await dispatch(disconnectRepository({ workspaceId, token })).unwrap();
      onDisconnected?.();
      onClose();
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  const rows = [
    ["Connected to", `${repo.owner}/${repo.name}`],
    ["Repository URL", repo.url],
    ["Active branch", branch],
    ["Last synced", formatDate(repo.lastSyncedAt)],
  ];

  return (
    <Modal title="GitHub Settings" onClose={onClose}>
      <div className="space-y-4">
        <div className="overflow-hidden rounded-lg border border-[#30363d]/60">
          {rows.map(([label, value], i) => (
            <div
              key={label}
              className={`flex items-center gap-4 px-4 py-3 text-xs ${
                i !== rows.length - 1 ? "border-b border-[#30363d]/50" : ""
              }`}
            >
              <span className="w-28 shrink-0 text-[#8b949e]">{label}</span>
              {label === "Repository URL" ? (
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 truncate text-[#58a6ff] hover:underline"
                >
                  {value} <ExternalLink size={9} />
                </a>
              ) : (
                <span className="truncate font-medium text-[#c9d1d9]">
                  {value}
                </span>
              )}
            </div>
          ))}
        </div>

        {error && (
          <StatusBanner
            type="error"
            message={error}
            onDismiss={() => setError(null)}
          />
        )}

        {confirming && (
          <StatusBanner
            type="error"
            message="Are you sure? This will unlink the repository from this workspace."
          />
        )}

        <div className="flex items-center gap-3 pt-1">
          <Btn
            onClick={handleDisconnect}
            loading={loading}
            variant="danger"
            className="flex-1 justify-center"
          >
            <Unlink size={13} />
            {confirming ? "Confirm Disconnect" : "Disconnect Repository"}
          </Btn>
          <Btn
            onClick={() => {
              setConfirming(false);
              onClose();
            }}
            variant="ghost"
          >
            Cancel
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main GitHubPanel ─────────────────────────────────────────────────────────

export default function GitHubPanel({ isOpen, onClose, workspaceId, onAddLog, onRefreshTree }) {
  const dispatch = useDispatch();
  const { getToken } = useAuth();

  const {
    isAuthenticated,
    user,
    isRepoLinked,
    repo,
    currentBranch,
    statusChecked,
  } = useSelector((s) => s.github);

  const [activeModal, setActiveModal] = useState(null);

  // ── Fetch status on mount ──
  useEffect(() => {
    if (!workspaceId || statusChecked || !isOpen) return;
    (async () => {
      const token = await getToken();
      if (token) dispatch(fetchGitHubStatus({ workspaceId, token }));
    })();
  }, [dispatch, getToken, workspaceId, statusChecked, isOpen]);

  const openModal = (name) => {
    setActiveModal(name);
  };
  const closeModal = useCallback(() => setActiveModal(null), []);

  const handleRefreshStatus = async () => {
    const token = await getToken();
    if (token) dispatch(fetchGitHubStatus({ workspaceId, token }));
  };

  // ── Dropdown menu items (now rendered in Modal) ──
  const renderDropdownContent = () => {
    if (!statusChecked) {
      return (
        <div className="flex items-center justify-center gap-2 py-4 text-xs text-[#8b949e]">
          <Loader2 size={12} className="animate-spin" /> Checking status…
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <>
          <div className="border-b border-[#30363d] px-3 py-3">
            <div className="flex items-center gap-2 text-xs text-[#8b949e]">
              <XCircle size={12} className="text-[#8b949e]" /> Not connected to GitHub
            </div>
          </div>
          <div className="p-3">
            <button
              onClick={() => openModal("connect")}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-[#c9d1d9] transition hover:bg-[#21262d]"
            >
              <Github size={13} className="text-[#8b949e]" /> Connect GitHub Account
            </button>
          </div>
        </>
      );
    }

    if (!isRepoLinked) {
      return (
        <>
          <div className="border-b border-[#30363d] px-3 py-3">
            <div className="flex items-center gap-2 text-xs text-[#3fb950]">
              <CheckCircle2 size={12} /> {user?.username || "Connected"}
            </div>
            <p className="mt-0.5 text-[10px] text-[#8b949e]">
              No repository linked yet
            </p>
          </div>
          <div className="p-3">
            <button
              onClick={() => openModal("link")}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-[#c9d1d9] transition hover:bg-[#21262d]"
            >
              <Link2 size={13} className="text-[#58a6ff]" /> Link Repository
            </button>
            <button
              onClick={handleRefreshStatus}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-[#8b949e] transition hover:bg-[#21262d] hover:text-[#c9d1d9]"
            >
              <RefreshCw size={12} /> Refresh status
            </button>
          </div>
        </>
      );
    }

    // Fully connected
    return (
      <>
        <div className="border-b border-[#30363d] px-3 py-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#3fb950]">
            <CheckCircle2 size={12} />
            {repo.owner}/{repo.name}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[#8b949e]">
            <GitBranch size={9} /> {currentBranch}
            {user?.avatar && (
              <img
                src={user.avatar}
                alt=""
                className="ml-auto h-4 w-4 rounded-full"
              />
            )}
          </div>
        </div>
        <div className="p-3 space-y-1">
          <DropdownItem
            icon={<Upload size={13} className="text-[#3fb950]" />}
            label="Push to GitHub"
            onClick={() => openModal("push")}
          />
          <DropdownItem
            icon={<Download size={13} className="text-[#58a6ff]" />}
            label="Pull from GitHub"
            onClick={() => openModal("pull")}
          />
          <div className="my-2 border-t border-[#30363d]" />
          <DropdownItem
            icon={<GitBranch size={13} className="text-[#d2a8ff]" />}
            label={`Branches: ${currentBranch}`}
            onClick={() => openModal("branches")}
          />
          <DropdownItem
            icon={<GitCommit size={13} className="text-[#d29922]" />}
            label="View Commits"
            onClick={() => openModal("commits")}
          />
          <div className="my-2 border-t border-[#30363d]" />
          <DropdownItem
            icon={<Settings size={13} className="text-[#8b949e]" />}
            label="Repository Settings"
            onClick={() => openModal("settings")}
          />
        </div>
      </>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {!activeModal && (
        <Modal title="GitHub Source Control" onClose={onClose} width="max-w-md">
          <div className="-m-5">
            {renderDropdownContent()}
          </div>
        </Modal>
      )}

      {/* ── Modals ── */}
      {activeModal === "connect" && <ConnectModal onClose={closeModal} />}

      {activeModal === "link" && (
        <LinkRepoModal
          workspaceId={workspaceId}
          onClose={closeModal}
          onLinked={handleRefreshStatus}
        />
      )}

      {activeModal === "push" && repo && (
        <PushModal
          workspaceId={workspaceId}
          repo={repo}
          branch={currentBranch}
          onClose={closeModal}
          onAddLog={onAddLog}
        />
      )}

      {activeModal === "pull" && repo && (
        <PullModal
          workspaceId={workspaceId}
          repo={repo}
          branch={currentBranch}
          onClose={closeModal}
          onAddLog={onAddLog}
          onRefreshTree={onRefreshTree}
        />
      )}

      {activeModal === "branches" && (
        <BranchesModal
          workspaceId={workspaceId}
          currentBranch={currentBranch}
          onClose={closeModal}
          onAddLog={onAddLog}
        />
      )}

      {activeModal === "commits" && (
        <CommitsModal workspaceId={workspaceId} onClose={closeModal} />
      )}

      {activeModal === "settings" && repo && (
        <SettingsModal
          workspaceId={workspaceId}
          repo={repo}
          branch={currentBranch}
          onClose={closeModal}
          onDisconnected={handleRefreshStatus}
        />
      )}
    </>
  );
}

// ─── Dropdown Item helper ─────────────────────────────────────────────────────

function DropdownItem({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs text-[#c9d1d9] transition hover:bg-[#21262d] hover:text-white"
    >
      {icon}
      {label}
    </button>
  );
}
