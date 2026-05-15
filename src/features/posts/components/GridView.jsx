import PostCard from "./PostCard.jsx";

export default function GridView({ items, navigate }) {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <PostCard key={item.path} item={item} navigate={navigate} />
      ))}
    </div>
  );
}
