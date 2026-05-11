import { formatPostDate } from "../../../lib/date.js";
import TagList from "./TagList.jsx";

export default function TimelineView({ posts, navigate }) {
  return (
    <div className="mt-10 border-l-2 border-neutral-200">
      {posts.map((post) => (
        <article className="relative pb-10 pl-8" key={post.slug}>
          <span className="absolute -left-[5px] top-1.5 h-2 w-2 bg-neutral-300 ring-4 ring-white" />
          <time className="text-[13px] font-medium text-neutral-500">
            {formatPostDate(post.date)}
          </time>
          <button
            className="mt-2 block text-left text-3xl font-semibold leading-tight text-neutral-900 transition-colors hover:text-neutral-600"
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
