import Header from "./Header";
import { Outlet, useLocation } from "react-router-dom";
import { Footer } from "./Footer";
import { useEffect, useRef, useState } from "react";

const EXIT_DURATION = 150;
const ENTER_DURATION = 200;

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation();
  const [phase, setPhase] = useState<"enter" | "exit">("enter");
  const [displayedPath, setDisplayedPath] = useState(pathname);
  const [displayedChildren, setDisplayedChildren] = useState(children);
  const prevPathname = useRef(pathname);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (prevPathname.current === pathname) {
      // Same route — just update children (initial mount or child re-render)
      setDisplayedChildren(children);
      return;
    }

    // Path changed — start exit animation with current (old) content
    clearTimeout(timeoutRef.current);
    setPhase("exit");

    timeoutRef.current = setTimeout(() => {
      // Exit done — swap to new content with enter animation
      setDisplayedPath(pathname);
      setDisplayedChildren(children);
      setPhase("enter");
      prevPathname.current = pathname;
    }, EXIT_DURATION);

    return () => clearTimeout(timeoutRef.current);
  }, [pathname, children]);

  return (
    <div
      key={displayedPath}
      className={
        phase === "exit"
          ? "animate-out fade-out slide-out-to-bottom-2 duration-150 ease-in fill-mode-forwards"
          : "animate-in fade-in slide-in-from-bottom-3 duration-200 ease-out fill-mode-both"
      }
    >
      {displayedChildren}
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
