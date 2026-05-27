import { useState } from "react";
import { useAuth } from "../auth";

interface Props {
  page: string;
  onNavigate: (page: string) => void;
  onOpenAuth: (mode: "login" | "register") => void;
}

export default function Navbar({ page, onNavigate, onOpenAuth }: Props) {
  const { user, logout, isAdmin, ownerId, settings } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const showAdmin = isAdmin || (user && ownerId === null);

  const navLinks = [
    { id: "home", label: "Home" },
    { id: "meta", label: "Meta" },
    { id: "configs", label: "Configs" },
    ...(showAdmin ? [{ id: "admin", label: "Admin" }] : []),
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b border-white/[0.06] bg-black/80 backdrop-blur-md">
      {settings.announcement && (
        <div className="border-b border-white/[0.04] bg-blue-500/5 px-4 py-1.5 text-center text-[11px] text-blue-300">
          {settings.announcement}
        </div>
      )}

      <div className="mx-auto flex h-11 max-w-5xl items-center px-4">
        {/* Left: logo */}
        <div className="flex min-w-0 flex-shrink-0 items-center">
          <button onClick={() => onNavigate("home")} className="text-[13px] font-medium text-white">
            rcontrol
          </button>
        </div>

        {/* Center: nav links */}
        <div className="hidden flex-1 items-center justify-center gap-0.5 md:flex">
          {navLinks.map((l) => (
            <button
              key={l.id}
              onClick={() => onNavigate(l.id)}
              className={`rounded-md px-2.5 py-1.5 text-[12px] transition-colors ${
                l.id === "admin"
                  ? page === "admin" ? "text-red-400" : "text-[#555] hover:text-red-400"
                  : page === l.id ? "text-white" : "text-[#555] hover:text-white"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Right: auth */}
        <div className="hidden min-w-0 flex-shrink-0 items-center gap-3 md:flex">
          {user ? (
            <>
              <span className="text-[11px] text-[#444]">
                {user.username}
                <span className="ml-1 text-[#333]">#{user.id.slice(0, 6)}</span>
              </span>
              <button onClick={logout} className="text-[11px] text-[#555] hover:text-white">
                Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={() => onOpenAuth("login")} className="text-[12px] text-[#555] hover:text-white">
                Login
              </button>
              <button
                onClick={() => onOpenAuth("register")}
                className="rounded-md bg-white px-3 py-1.5 text-[11px] font-medium text-black hover:bg-white/90"
              >
                Sign up
              </button>
            </>
          )}
        </div>

        <div className="ml-auto md:hidden">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-[#555]">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/[0.04] bg-black/95 px-4 pb-4 md:hidden">
          {["home", "meta", "configs"].map((id) => (
            <button
              key={id}
              onClick={() => { onNavigate(id); setMobileOpen(false); }}
              className={`block w-full py-2 text-left text-[13px] capitalize ${
                page === id ? "text-white" : "text-[#555]"
              }`}
            >
              {id}
            </button>
          ))}
          {showAdmin && (
            <button
              onClick={() => { onNavigate("admin"); setMobileOpen(false); }}
              className={`block w-full py-2 text-left text-[13px] ${
                page === "admin" ? "text-red-400" : "text-[#555]"
              }`}
            >
              Admin
            </button>
          )}
          <div className="mt-3 border-t border-white/[0.05] pt-3">
            {user ? (
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-[#444]">{user.username} #{user.id.slice(0, 6)}</span>
                <button onClick={logout} className="text-[#555]">Logout</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => { onOpenAuth("login"); setMobileOpen(false); }}
                  className="flex-1 rounded-md border border-white/[0.1] py-2 text-[12px] text-white"
                >
                  Login
                </button>
                <button
                  onClick={() => { onOpenAuth("register"); setMobileOpen(false); }}
                  className="flex-1 rounded-md bg-white py-2 text-[12px] font-medium text-black"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
