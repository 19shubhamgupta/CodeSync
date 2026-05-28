import { SignIn } from "@clerk/clerk-react";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <SignIn />
    </div>
  );
}
