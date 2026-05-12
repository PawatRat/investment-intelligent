import { useEffect, useState } from "react";
import { fetchPosts, fetchPost } from "./api.js";

export function usePosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();
    fetchPosts(controller.signal)
      .then((data) => { if (!ignore) setPosts(data); })
      .catch((err) => { if (!ignore && err.name !== "AbortError") setError(err.message); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; controller.abort(); };
  }, []);

  return { posts, loading, error };
}

export function usePost(slug) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetchPost(slug, controller.signal)
      .then((data) => { if (!ignore) setPost(data); })
      .catch((err) => { if (!ignore && err.name !== "AbortError") setError(err.message); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; controller.abort(); };
  }, [slug]);

  return { post, loading, error };
}
