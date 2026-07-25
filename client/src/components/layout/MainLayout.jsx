import { useState } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const MainLayout = ({ children }) => {
  const { i18n } = useTranslation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileOpen((prev) => !prev);
  };

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen flex flex-col" dir={i18n.dir()}>
      <Navbar onToggleMenu={toggleMobileSidebar} />

      <div className="flex flex-1 relative">
        <Sidebar
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />

        {/* Backdrop overlay for mobile drawer */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        <main className="flex-1 p-6 transition-all duration-300 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;