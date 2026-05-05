export async function fetchPosts() {
  const response = await fetch("/api/posts");
  if (!response.ok) throw new Error("Unable to load posts");
  return response.json();
}

export async function fetchPost(slug) {
  const response = await fetch(`/api/posts/${slug}`);
  if (!response.ok) throw new Error("Post not found");
  return response.json();
}
