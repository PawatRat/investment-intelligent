import { formatPostDate } from "../../../lib/date.js";
import TagList from "./TagList.jsx";

export default function TimelineView({ posts, navigate }) {
  return (
    <div className="mt-10 border-l border-black">
      {posts.map((post) => (
        <article className="relative pb-10 pl-8" key={post.slug}>
          <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 border border-black bg-white" />
          <time className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-600">
            {formatPostDate(post.date)}
          </time>
          <button
            className="mt-2 block text-left text-3xl font-semibold leading-tight hover:underline"
            onClick={() => navigate(`/posts/${post.slug}`)}
            type="button"
          >
            {post.title}
          </button>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-700">{post.description}</p>
          <TagList tags={post.tags} />
        </article>
      ))}
    </div>
  );
}
