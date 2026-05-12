import { useEffect, useState } from "react";
import {
  fetchActivities,
  fetchPortfolioPerformance,
  fetchStocks,
  fetchStock,
  fetchStockActivity,
  fetchStockNote,
  fetchStockPerformance
} from "./api.js";

export function useStocks() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();
    fetchStocks(controller.signal)
      .then((data) => { if (!ignore) setStocks(data); })
      .catch((e) => { if (!ignore && e.name !== "AbortError") setError(e.message); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; controller.abort(); };
  }, []);

  return { stocks, loading, error };
}

export function useActivities() {
  const [activityData, setActivityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();
    fetchActivities(controller.signal)
      .then((data) => { if (!ignore) setActivityData(data); })
      .catch((e) => { if (!ignore && e.name !== "AbortError") setError(e.message); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; controller.abort(); };
  }, []);

  return { activityData, loading, error };
}

export function useStock(ticker) {
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetchStock(ticker, controller.signal)
      .then((data) => { if (!ignore) setStock(data); })
      .catch((e) => { if (!ignore && e.name !== "AbortError") setError(e.message); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; controller.abort(); };
  }, [ticker]);

  return { stock, loading, error };
}

export function useStockNote(ticker, noteSlug) {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetchStockNote(ticker, noteSlug, controller.signal)
      .then((data) => { if (!ignore) setNote(data); })
      .catch((e) => { if (!ignore && e.name !== "AbortError") setError(e.message); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; controller.abort(); };
  }, [ticker, noteSlug]);

  return { note, loading, error };
}

export function useStockActivity(ticker) {
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetchStockActivity(ticker, controller.signal)
      .then((data) => { if (!ignore) setActivity(data); })
      .catch((e) => { if (!ignore && e.name !== "AbortError") setError(e.message); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; controller.abort(); };
  }, [ticker]);

  return { activity, loading, error };
}

export function usePortfolioPerformance() {
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();
    fetchPortfolioPerformance(controller.signal)
      .then((data) => { if (!ignore) setPerformance(data); })
      .catch((e) => { if (!ignore && e.name !== "AbortError") setError(e.message); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; controller.abort(); };
  }, []);

  return { performance, loading, error };
}

export function useStockPerformance(ticker) {
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetchStockPerformance(ticker, controller.signal)
      .then((data) => { if (!ignore) setPerformance(data); })
      .catch((e) => { if (!ignore && e.name !== "AbortError") setError(e.message); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; controller.abort(); };
  }, [ticker]);

  return { performance, loading, error };
}
