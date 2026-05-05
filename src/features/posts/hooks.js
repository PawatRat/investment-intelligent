import { useEffect, useState } from "react";
import { fetchPosts, fetchPost } from "./api.js";

export function usePosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPosts()
      .then(setPosts)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  return { posts, loading, error };
}

export function usePost(slug) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetchPost(slug)
      .then(setPost)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [slug]);

  return { post, loading, error };
}
