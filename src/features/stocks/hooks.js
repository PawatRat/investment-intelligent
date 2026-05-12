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
    fetchStocks()
      .then(setStocks)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { stocks, loading, error };
}

export function useActivities() {
  const [activityData, setActivityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchActivities()
      .then(setActivityData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { activityData, loading, error };
}

export function useStock(ticker) {
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetchStock(ticker)
      .then(setStock)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [ticker]);

  return { stock, loading, error };
}

export function useStockNote(ticker, noteSlug) {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetchStockNote(ticker, noteSlug)
      .then(setNote)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [ticker, noteSlug]);

  return { note, loading, error };
}

export function useStockActivity(ticker) {
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetchStockActivity(ticker)
      .then(setActivity)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [ticker]);

  return { activity, loading, error };
}

export function usePortfolioPerformance() {
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPortfolioPerformance()
      .then(setPerformance)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { performance, loading, error };
}

export function useStockPerformance(ticker) {
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetchStockPerformance(ticker)
      .then(setPerformance)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [ticker]);

  return { performance, loading, error };
}
