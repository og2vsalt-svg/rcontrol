import { useAuth } from "../auth";

interface Props {
  onNavigate: (page: string) => void;
  onOpenAuth: (mode: "login" | "register") => void;
}

export default function HeroSection({ onNavigate, onOpenAuth }: Props) {
  const { user, ownerId, claimAdmin } = useAuth();

  return (
    <div className="flex min-h-[calc(100vh-48px)] flex-col items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-[32px] font-medium tracking-tight text-white sm:text-[40px]">
          rcontrol
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-[#555]">
          Roblox Rivals meta tracker and config vault. Browse weapon stats,
          loadouts, and rage configs.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          <button
            onClick={() => onNavigate("meta")}
            className="rounded-md bg-white px-4 py-2 text-[13px] font-medium text-black transition-all hover:bg-white/90 active:scale-[0.98]"
          >
            View Meta
          </button>
          <button
            onClick={() => onNavigate("configs")}
            className="rounded-md border border-white/[0.12] px-4 py-2 text-[13px] text-white transition-all hover:bg-white/[0.04] active:scale-[0.98]"
          >
            Configs
          </button>
        </div>

        <div className="mt-10 inline-flex items-center gap-5 text-[12px] text-[#444]">
          <span>22 weapons</span>
          <span className="text-[#222]">·</span>
          <span>5 loadouts</span>
          <span className="text-[#222]">·</span>
          <span>S4 meta</span>
        </div>

        {/* Claim admin prompt */}
        {user && ownerId === null && (
          <div className="mt-8 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <p className="mb-2 text-[12px] text-amber-200/80">
              No admin set. Claim admin access?
            </p>
            <button
              onClick={() => claimAdmin()}
              className="rounded-md bg-amber-500 px-3 py-1.5 text-[11px] font-medium text-black transition-colors hover:bg-amber-400"
            >
              Claim Admin
            </button>
          </div>
        )}

        {!user && (
          <p className="mt-8 text-[11px] text-[#444]">
            <button
              onClick={() => onOpenAuth("login")}
              className="text-white hover:underline"
            >
              Sign in
            </button>{" "}
            to upload and download configs
          </p>
        )}
      </div>
    </div>
  );
}
