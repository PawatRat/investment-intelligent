import PostCard from "./PostCard.jsx";

export default function GridView({ posts, navigate }) {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard key={post.slug} post={post} navigate={navigate} />
      ))}
    </div>
  );
}
