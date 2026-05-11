import { CalendarDays } from "lucide-react";
import { formatPostDate } from "../../../lib/date.js";
import TagList from "./TagList.jsx";

export default function PostCard({ post, navigate }) {
  return (
    <article className="group flex min-h-[280px] flex-col border border-neutral-200 bg-white p-6 shadow-sm transition-colors duration-300 hover:bg-neutral-50/80">
      <div className="flex items-center gap-2 text-[13px] font-medium text-neutral-500">
        <CalendarDays className="h-4 w-4" />
        {formatPostDate(post.date)}
      </div>
      <button
        className="mt-5 block text-left text-2xl font-semibold leading-tight transition-colors hover:text-neutral-600"
        onClick={() => navigate(`/posts/${post.slug}`)}
        type="button"
      >
        {post.title}
      </button>
      <p className="mt-3 flex-1 text-sm leading-6 text-neutral-700">{post.description}</p>
      <TagList tags={post.tags} />
    </article>
  );
}
