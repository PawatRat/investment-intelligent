import { useCallback, useEffect, useState } from "react";
import { fetchScreener } from "./api.js";

export function useScreener() {
  const [screener, setScreener] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback((signal, ignoreRef = { current: false }) => {
    setLoading(true);
    setError("");
    fetchScreener(signal)
      .then((data) => { if (!ignoreRef.current) setScreener(data); })
      .catch((e) => { if (!ignoreRef.current && e.name !== "AbortError") setError(e.message); })
      .finally(() => { if (!ignoreRef.current) setLoading(false); });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const ignoreRef = { current: false };
    load(controller.signal, ignoreRef);
    return () => { ignoreRef.current = true; controller.abort(); };
  }, [load]);

  function refetch() {
    const controller = new AbortController();
    load(controller.signal);
  }

  return { screener, loading, error, refetch };
}
