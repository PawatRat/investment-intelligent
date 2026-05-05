import { CalendarDays } from "lucide-react";
import { formatPostDate } from "../../../lib/date.js";
import TagList from "./TagList.jsx";

export default function PostCard({ post, navigate }) {
  return (
    <article className="flex min-h-[280px] flex-col border border-black bg-white p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-neutral-600">
        <CalendarDays className="h-4 w-4" />
        {formatPostDate(post.date)}
      </div>
      <h2 className="mt-5 text-2xl font-semibold leading-tight">{post.title}</h2>
      <p className="mt-3 flex-1 text-sm leading-6 text-neutral-700">{post.description}</p>
      <TagList tags={post.tags} />
      <button
        className="mt-6 border border-black bg-white px-4 py-3 text-left text-sm font-semibold hover:bg-black hover:text-white"
        onClick={() => navigate(`/posts/${post.slug}`)}
        type="button"
      >
        Read /posts/{post.slug}
      </button>
    </article>
  );
}
