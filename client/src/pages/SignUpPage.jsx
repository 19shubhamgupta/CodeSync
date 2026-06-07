import { SignUp } from "@clerk/clerk-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 right-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
          </div>
    
          {/* Content */}
          <div className="relative z-10 w-full max-w-md">
            {/* SignIn Form Container */}
            <div className="relative group mb-6 ">
              <SignUp
              />
            </div>
          </div>
        </div>
  );
}