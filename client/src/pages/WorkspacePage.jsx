import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useAuth, useUser } from "@clerk/clerk-react";
import { fetchWorkspaces } from "../store/workspaceSlice";
import { setUser } from "../store/userSlice";

const WorkspacePage = () => {
  const dispatch = useDispatch();
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const { items, status, error } = useSelector((state) => state.workspaces);

  useEffect(() => {
    if (user) {
      dispatch(
        setUser({
          id: user.id,
          userName: user.username,
          email: user.primaryEmailAddress?.emailAddress,
          fullName: user.fullName,
        }),
      );
    }
  }, [dispatch, user]);

  useEffect(() => {
    const loadWorkspaces = async () => {
      if (!isSignedIn) {
        return;
      }

      const token = await getToken();
      if (token) {
        dispatch(fetchWorkspaces({ token }));
      }
    };

    loadWorkspaces();
  }, [dispatch, getToken, isSignedIn]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-50 font-[Space_Grotesk]">
              Your Workspaces
            </h1>
            <p className="text-sm text-slate-400">
              All your collaborative sessions in one place.
            </p>
          </div>
        </div>

        {status === "loading" && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-slate-300">
            Loading workspaces...
          </div>
        )}

        {status === "failed" && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6 text-rose-200">
            {error}
          </div>
        )}

        {status !== "loading" && items.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-slate-300">
            No workspaces yet. Create one to get started.
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((workspace) => (
            <Link
              key={workspace._id}
              to={`/workspace/${workspace._id}`}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition hover:border-cyan-500/40"
            >
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                Workspace
              </div>
              <h2 className="mt-2 text-xl font-semibold text-slate-50">
                {workspace.name}
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                {workspace.description || "No description provided."}
              </p>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>Role</span>
                <span className="text-cyan-300">
                  {workspace.role || "Member"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkspacePage;
