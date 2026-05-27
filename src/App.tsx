import { useEffect, useRef, useState } from "react";
import { AuthProvider, useAuth } from "./auth";
import AuthPage from "./pages/AuthPage";
import AdminPanel from "./pages/AdminPanel";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import MetaDashboard from "./components/MetaDashboard";
import ConfigVault from "./components/ConfigVault";
import Footer from "./components/Footer";

function AppContent() {
  const { isAdmin, loading } = useAuth();
  const [visible, setVisible] = useState(true);
  const [displayPage, setDisplayPage] = useState("home");
  const [authModal, setAuthModal] = useState<"login" | "register" | null>(
    null
  );
  const timeoutRef = useRef<number | undefined>(undefined);

  const navigate = (next: string) => {
    if (next === displayPage) return;
    if (next === "admin" && !isAdmin) return;
    setVisible(false);
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      setDisplayPage(next);
      setVisible(true);
      window.scrollTo({ top: 0 });
    }, 150);
  };

  const openAuth = (mode: "login" | "register") => setAuthModal(mode);
  const closeAuth = () => setAuthModal(null);

  useEffect(() => {
    return () => window.clearTimeout(timeoutRef.current);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-[12px] text-[#333]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* animated background */}
      <div className="bg-animate" />
      <div className="grid-pattern" />
      <div className="noise" />

      {/* content */}
      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar
          page={displayPage}
          onNavigate={navigate}
          onOpenAuth={openAuth}
        />

        <main className="flex-1 pt-12">
          <div
            className={`transition-all duration-200 ease-out ${
              visible
                ? "translate-y-0 opacity-100"
                : "translate-y-1 opacity-0"
            }`}
          >
            {displayPage === "home" && (
              <HeroSection onNavigate={navigate} onOpenAuth={openAuth} />
            )}
            {displayPage === "meta" && <MetaDashboard />}
            {displayPage === "configs" && (
              <ConfigVault onOpenAuth={openAuth} />
            )}
            {displayPage === "admin" && isAdmin && <AdminPanel />}
          </div>
        </main>

        <Footer />
      </div>

      {/* auth modal */}
      {authModal && (
        <AuthPage onClose={closeAuth} initialMode={authModal} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
