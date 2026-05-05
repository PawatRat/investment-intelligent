import { ArrowLeft } from "lucide-react";
import StateMessage from "../../components/StateMessage.jsx";
import { formatPostDate } from "../../lib/date.js";
import MarkdownBody from "./components/MarkdownBody.jsx";
import TagList from "./components/TagList.jsx";
import { usePost } from "./hooks.js";

export default function PostDetail({ slug, navigate }) {
  const { post, loading, error } = usePost(slug);

  if (loading) {
    return (
      <section className="relative z-10 mx-auto max-w-4xl px-5 py-12">
        <StateMessage message="Loading post..." />
      </section>
    );
  }

  if (error || !post) {
    return (
      <section className="relative z-10 mx-auto max-w-4xl px-5 py-12">
        <BackButton navigate={navigate} />
        <StateMessage message={error || "Post not found"} />
      </section>
    );
  }

  return (
    <article className="relative z-10 mx-auto max-w-4xl px-5 py-12">
      <BackButton navigate={navigate} />
      <header className="border-b border-black pb-8">
        <time className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-600">
          {formatPostDate(post.date)} / {post.readingMinutes} min read
        </time>
        <h1 className="mt-4 text-5xl font-semibold leading-none md:text-7xl">{post.title}</h1>
        <p className="mt-5 text-lg leading-8 text-neutral-700">{post.description}</p>
        <TagList tags={post.tags} />
      </header>
      {post.coverImage && (
        <img
          alt=""
          className="mt-8 aspect-[16/9] w-full border border-black object-cover"
          src={post.coverImage}
        />
      )}
      <MarkdownBody markdown={post.body} slug={post.slug} />
    </article>
  );
}

function BackButton({ navigate }) {
  return (
    <button className="mb-8 inline-flex items-center gap-2 text-sm" onClick={() => navigate("/")}>
      <ArrowLeft className="h-4 w-4" /> Back to index
    </button>
  );
}
