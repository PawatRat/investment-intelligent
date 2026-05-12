import { useEffect, useState } from "react";

function normalizePath(pathname) {
  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "");
}

export function useRoute() {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));

  useEffect(() => {
    const onPopState = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (nextPath) => {
    const normalized = normalizePath(nextPath);
    window.history.pushState({}, "", normalized);
    setPath(normalized);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return { path, navigate };
}
