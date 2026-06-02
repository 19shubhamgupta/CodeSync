import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0px); opacity: 0.8; }
          50% { transform: translateY(-10px); opacity: 1; }
          100% { transform: translateY(0px); opacity: 0.8; }
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-8 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />

        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-800/80 text-cyan-300">
              <span className="text-lg font-bold">C</span>
            </div>
            <div className="text-lg font-semibold tracking-wide font-[Space_Grotesk]">
              CodeSync
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a className="hover:text-cyan-300" href="#features">
              Features
            </a>
            <a className="hover:text-cyan-300" href="#collab">
              Collaboration
            </a>
            <a className="hover:text-cyan-300" href="#security">
              Security
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <SignedOut>
              <Link
                to="/login"
                className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-cyan-400 hover:text-cyan-300"
              >
                Sign in
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                to="/workspaces"
                className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
              >
                Go to workspace
              </Link>
            </SignedIn>
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-9 h-9",
                  },
                }}
              />
            </SignedIn>
          </div>
        </header>

        <section className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10 md:pb-24">
          <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr]">
            <div
              className="space-y-6"
              style={{ animation: "fadeIn 0.8s ease-out" }}
            >
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">
                Collaborative Code IDE
              </p>
              <h1 className="text-4xl font-semibold leading-tight text-slate-50 md:text-5xl font-[Space_Grotesk]">
                Build together in a shared editor that feels instant.
              </h1>
              <p className="max-w-xl text-lg text-slate-300">
                CodeSync brings live cursors, shared terminals, and project
                state into one dark workspace. Every keystroke is synced, every
                voice gets a cursor.
              </p>
              <div className="flex flex-wrap gap-3">
                <SignedIn>
                  <Link
                    to="/workspaces"
                    className="rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
                  >
                    Create a session
                  </Link>
                </SignedIn>
                <SignedOut>
                  <Link
                    to="/login"
                    className="rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
                  >
                    Sign in to start
                  </Link>
                </SignedOut>
                <button className="rounded-full border border-slate-700 px-6 py-3 text-sm text-slate-200 hover:border-cyan-400 hover:text-cyan-300">
                  Watch live demo
                </button>
              </div>
              <div className="flex items-center gap-6 text-sm text-slate-400">
                <span className="font-[JetBrains_Mono]">Realtime</span>
                <span className="font-[JetBrains_Mono]">Secure</span>
                <span className="font-[JetBrains_Mono]">Low latency</span>
              </div>
            </div>

            <div
              className="relative rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-[0_0_40px_rgba(56,189,248,0.15)]"
              style={{ animation: "floatUp 6s ease-in-out infinite" }}
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>codesync/session.js</span>
                <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-emerald-300">
                  Live
                </span>
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-200 font-[JetBrains_Mono]">
                <div className="text-cyan-300">
                  const workspace = await sync.join("alpha-room");
                </div>
                <div>workspace.cursor("shubham").move(24, 11);</div>
                <div className="text-emerald-300">
                  workspace.broadcast("Deploying in 2 min");
                </div>
                <div>workspace.files.open("/server/index.js");</div>
              </div>
              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400">
                3 collaborators online • 2 edits/sec • 148ms latency
              </div>
            </div>
          </div>
        </section>
      </div>

      <section id="features" className="mx-auto w-full max-w-6xl px-6 pb-16">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Live Cursors",
              text: "See every collaborator’s cursor, selection, and presence in real time.",
            },
            {
              title: "Shared Terminals",
              text: "Run builds once, watch output together, and keep your logs in sync.",
            },
            {
              title: "Workspace Timeline",
              text: "Rewind changes, replay sessions, and recover instantly.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-slate-300"
            >
              <h3 className="text-lg font-semibold text-slate-50 font-[Space_Grotesk]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="collab" className="mx-auto w-full max-w-6xl px-6 pb-16">
        <div className="rounded-3xl border border-slate-800 bg-linear-to-br from-slate-900/80 to-slate-950 p-8 md:p-12">
          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h2 className="text-3xl font-semibold text-slate-50 font-[Space_Grotesk]">
                Collaboration without the chaos.
              </h2>
              <p className="mt-3 text-slate-300">
                Invite teammates with one link. Permissions, roles, and
                workspace history stay organized so you can focus on the code.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
              <div className="flex items-center justify-between">
                <span>Active room</span>
                <span className="text-cyan-300">alpha-room</span>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span>Editors</span>
                  <span>3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Viewers</span>
                  <span>2</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Voice channel</span>
                  <span className="text-emerald-300">Connected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="security" className="mx-auto w-full max-w-6xl px-6 pb-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-8 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-slate-50 font-[Space_Grotesk]">
              Ship confidently.
            </h2>
            <p className="mt-2 text-slate-300">
              End-to-end encrypted sessions, access controls, and audit trails
              built in.
            </p>
          </div>
          <button className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-300">
            Explore security
          </button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
