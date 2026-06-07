import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import DotGrid from "../components/DotGrid";

const HomePage = () => {
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 overflow-hidden">
      {/* DotGrid Background */}
      <div className="absolute inset-0 z-0">
        <DotGrid
          dotSize={4}
          gap={20}
          baseColor="#1e1b2e"
          activeColor="#00d9ff"
          proximity={140}
          returnDuration={1.2}
          resistance={800}
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-950/30 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center font-mono font-bold text-slate-950">
                {"<>"}
              </div>
              <div className="text-xl font-bold font-mono tracking-tight">
                CodeSync
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-8 text-sm text-slate-400">
              <a
                href="#features"
                className="hover:text-cyan-400 transition-colors"
              >
                Features
              </a>
              <a
                href="#collab"
                className="hover:text-cyan-400 transition-colors"
              >
                Collaboration
              </a>
              <a href="#cta" className="hover:text-cyan-400 transition-colors">
                Get Started
              </a>
            </nav>
            <SignedOut>
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-sm font-mono hover:bg-cyan-500/30 hover:border-cyan-300 transition-all"
              >
                Sign In
              </Link>
            </SignedOut>
            <div className="flex flex-cols gap-3">
              <SignedIn>
              <Link
                to="/workspaces"
                className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 font-mono hover:bg-cyan-400 transition-all"
              >
                Go to workspace
              </Link>
            </SignedIn>
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-8 h-8",
                  },
                }}
              />
            </SignedIn>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-20 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div>
                <span className="inline-block text-cyan-400 text-xs font-mono uppercase tracking-widest mb-4">
                  {"→ Real-time collaboration"}
                </span>
                <h1 className="text-5xl md:text-6xl font-black font-mono tracking-tight leading-tight text-slate-50">
                  Code together,
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                    instantly.
                  </span>
                </h1>
              </div>

              <p className="text-lg text-slate-300 font-light leading-relaxed max-w-md">
                Live cursors. Shared execution. Synchronized state. Built for
                teams that ship fast.
              </p>

              <div className="flex flex-wrap gap-4">
                <button className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold font-mono hover:shadow-lg hover:shadow-cyan-500/50 transition-all">
                  Create Workspace
                </button>
                <button className="px-6 py-3 rounded-lg border border-slate-700 text-slate-300 font-mono hover:border-cyan-400 hover:text-cyan-400 transition-all">
                  Watch Demo
                </button>
              </div>

              <div className="flex gap-8 text-sm text-slate-400 font-mono pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                  <span>Real-time</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  <span>Secure</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                  <span>No latency</span>
                </div>
              </div>
            </div>

            {/* Right - Code Preview */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur-xl opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative rounded-xl border border-slate-700 bg-slate-900/60 backdrop-blur p-8 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono">workspace.js</span>
                  <span className="inline-block px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-mono">
                    Live
                  </span>
                </div>

                <div className="space-y-3 font-mono text-sm leading-relaxed">
                  <div className="text-cyan-300">
                    <span className="text-slate-400">{"> "}</span>
                    const room = await sync.join
                  </div>
                  <div className="text-slate-300">
                    <span className="text-slate-400"> </span>("alpha-session")
                  </div>
                  <div className="mt-4 text-emerald-300">
                    <span className="text-slate-400">{"> "}</span>
                    room.broadcast("Shipping v2")
                  </div>
                  <div className="text-slate-300">
                    <span className="text-slate-400"> </span>✓ 3 collaborators
                    joined
                  </div>
                  <div className="text-slate-300">
                    <span className="text-slate-400"> </span>✓ 12 edits/sec
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800">
                  <div className="grid grid-cols-3 gap-4 text-center text-xs text-slate-400">
                    <div>
                      <div className="text-cyan-400 font-bold">3ms</div>
                      <div>latency</div>
                    </div>
                    <div>
                      <div className="text-cyan-400 font-bold">∞</div>
                      <div>scalable</div>
                    </div>
                    <div>
                      <div className="text-cyan-400 font-bold">E2E</div>
                      <div>encrypted</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section
          id="features"
          className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-800/50"
        >
          <div className="mb-16">
            <span className="text-cyan-400 text-xs font-mono uppercase tracking-widest">
              Features
            </span>
            <h2 className="text-3xl md:text-4xl font-bold font-mono mt-2">
              Developer-first design
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "◆",
                title: "Live Cursors",
                desc: "See collaborators' cursors and selections in real-time. Know who's editing where.",
                accent: "from-cyan-400 to-blue-500",
              },
              {
                icon: "▲",
                title: "Shared Terminal",
                desc: "Run builds once, output streams to all. No sync delays, no confusion.",
                accent: "from-emerald-400 to-cyan-400",
              },
              {
                icon: "■",
                title: "Git Integration",
                desc: "Push, pull, branch, commit—all without leaving the IDE. GitHub built-in.",
                accent: "from-purple-400 to-pink-400",
              },
            ].map((feature, i) => (
              <div
                key={i}
                onMouseEnter={() => setHoveredCard(i)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`group rounded-lg border border-slate-700 bg-slate-900/40 p-6 transition-all duration-300 ${
                  hoveredCard === i ? "border-slate-500 bg-slate-900/60" : ""
                }`}
              >
                <div
                  className={`text-3xl mb-4 font-bold bg-gradient-to-r ${feature.accent} bg-clip-text text-transparent`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold font-mono mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {feature.desc}
                </p>
                <div
                  className={`mt-4 h-0.5 w-0 bg-gradient-to-r ${feature.accent} group-hover:w-full transition-all duration-500`}
                ></div>
              </div>
            ))}
          </div>
        </section>

        {/* Collaboration Section */}
        <section
          id="collab"
          className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-800/50"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-cyan-400 text-xs font-mono uppercase tracking-widest">
                Collaboration
              </span>
              <h2 className="text-4xl font-bold font-mono mt-2 mb-6">
                Build teams, not solo sessions
              </h2>
              <p className="text-slate-300 mb-8 leading-relaxed">
                Invite via a single link. Granular permissions. Full session
                history. Everything syncs automatically—no manual coordination
                needed.
              </p>

              <ul className="space-y-4 text-sm text-slate-300">
                {[
                  "Real-time permission updates",
                  "Instant replay of any session",
                  "Voice chat integrated",
                  "Full audit trail included",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="text-cyan-400 font-bold">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-8 space-y-6 font-mono text-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <span className="text-slate-400">Active Room</span>
                <span className="text-cyan-400 font-bold">alpha-session</span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Editors</span>
                  <div className="flex gap-2 items-center">
                    <span className="text-cyan-300 font-bold">3</span>
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`w-6 h-6 rounded-full border border-slate-700 bg-gradient-to-br ${
                            i === 1
                              ? "from-cyan-400 to-blue-500"
                              : i === 2
                                ? "from-emerald-400 to-cyan-400"
                                : "from-purple-400 to-pink-400"
                          }`}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Viewers</span>
                  <span className="text-slate-300">2</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status</span>
                  <span className="text-emerald-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Online
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section
          id="cta"
          className="max-w-7xl mx-auto px-6 py-24 border-t border-slate-800/50"
        >
          <div className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-900/80 to-slate-950 p-12 md:p-16 text-center">
            <span className="text-cyan-400 text-xs font-mono uppercase tracking-widest">
              Ready?
            </span>
            <h2 className="text-4xl md:text-5xl font-black font-mono mt-4 mb-6">
              Start shipping with your team
            </h2>
            <p className="text-slate-300 max-w-2xl mx-auto mb-8 text-lg">
              Join hundreds of dev teams already using CodeSync for faster,
              smarter pair programming and collaborative development.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold font-mono hover:shadow-lg hover:shadow-cyan-500/50 transition-all text-lg">
                Create Free Workspace
              </button>
              <button className="px-8 py-4 rounded-lg border-2 border-cyan-400/50 text-cyan-300 font-bold font-mono hover:border-cyan-300 hover:bg-cyan-500/10 transition-all text-lg">
                Read Docs
              </button>
            </div>

            <p className="text-slate-500 text-sm mt-8 font-mono">
              No credit card required. 14-day free trial included.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800/50 mt-20 py-12">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-slate-400 text-sm font-mono">
            <div>&copy; 2024 CodeSync. Built for developers.</div>
            <div className="flex gap-8 mt-6 md:mt-0">
              <a href="#" className="hover:text-cyan-400 transition-colors">
                GitHub
              </a>
              <a href="#" className="hover:text-cyan-400 transition-colors">
                Twitter
              </a>
              <a href="#" className="hover:text-cyan-400 transition-colors">
                Docs
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;
