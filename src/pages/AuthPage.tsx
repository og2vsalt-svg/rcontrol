import { useState } from "react";
import { useAuth } from "../auth";

interface Props {
  onClose: () => void;
  initialMode?: "login" | "register";
}

export default function AuthPage({ onClose, initialMode = "login" }: Props) {
  const { login, register, settings } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const err =
        mode === "login"
          ? await login(username, password)
          : await register(username, password);

      if (err) {
        setError(err);
      } else {
        onClose();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-[340px] rounded-lg border border-white/[0.08] bg-[#0a0a0a] p-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#444] transition-colors hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-5">
          <h2 className="text-[14px] font-medium text-white">
            {mode === "login" ? "Sign in" : "Create account"}
          </h2>
          <p className="mt-1 text-[11px] text-[#555]">
            {mode === "login" ? "Welcome back" : "Join rcontrol"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-[10px] text-[#666]">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-white/[0.08] bg-transparent px-3 py-2 text-[13px] text-white outline-none placeholder:text-[#333] focus:border-white/20"
              placeholder="username"
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] text-[#666]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-white/[0.08] bg-transparent px-3 py-2 text-[13px] text-white outline-none placeholder:text-[#333] focus:border-white/20"
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              disabled={loading}
            />
          </div>

          {error && <p className="text-[11px] text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-md bg-white py-2 text-[12px] font-medium text-black transition-colors hover:bg-white/90 disabled:opacity-50"
          >
            {loading ? "..." : mode === "login" ? "Continue" : "Create account"}
          </button>
        </form>

        <div className="mt-4 border-t border-white/[0.06] pt-4 text-center text-[11px] text-[#555]">
          {mode === "login" ? (
            <>
              No account?{" "}
              <button
                onClick={() => { setMode("register"); setError(null); }}
                className="text-white hover:underline"
                disabled={!settings.registrationOpen}
              >
                {settings.registrationOpen ? "Sign up" : "Registration closed"}
              </button>
            </>
          ) : (
            <>
              Have an account?{" "}
              <button
                onClick={() => { setMode("login"); setError(null); }}
                className="text-white hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
