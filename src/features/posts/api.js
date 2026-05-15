export async function fetchPosts(signal) {
  const response = await fetch("/api/posts", { signal });
  if (!response.ok) throw new Error("Unable to load posts");
  return response.json();
}

export async function fetchPost(slug, signal) {
  const response = await fetch(`/api/posts/${slug}`, { signal });
  if (!response.ok) throw new Error("Post not found");
  return response.json();
}

export async function fetchContent(signal) {
  const response = await fetch("/api/content", { signal });
  if (!response.ok) throw new Error("Unable to load content");
  return response.json();
}
