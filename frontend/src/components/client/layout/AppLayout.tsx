import Header from "./Header";
import { Outlet, useLocation } from "react-router-dom";
import { Footer } from "./Footer";
import { useEffect } from "react";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation();
  return (
    <div
      key={pathname}
      className="animate-in fade-in slide-in-from-bottom-3 duration-300 ease-out fill-mode-both"
    >
      {children}
    </div>
  );
};

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ScrollToTop />
      <Header />

      <main className="flex-1 container-wrapper">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      <Footer />
    </div>
  );
};

export default AppLayout;
