import { useEffect, useState } from "react";
import { fetchScreener } from "./api.js";

export function useScreener() {
  const [screener, setScreener] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();
    fetchScreener(controller.signal)
      .then((data) => { if (!ignore) setScreener(data); })
      .catch((e) => { if (!ignore && e.name !== "AbortError") setError(e.message); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; controller.abort(); };
  }, []);

  return { screener, loading, error };
}
