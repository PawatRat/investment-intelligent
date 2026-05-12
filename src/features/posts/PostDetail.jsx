import { ArrowLeft } from "lucide-react";
import ArticleNav from "../../components/ArticleNav.jsx";
import StateMessage from "../../components/StateMessage.jsx";
import { formatPostDate } from "../../lib/date.js";
import { extractMarkdownHeadings } from "../../lib/markdownHeadings.js";
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

  const headings = extractMarkdownHeadings(post.body, post.slug);

  return (
    <>
      <ArticleNav headings={headings} />
      <article className="relative z-10 mx-auto max-w-4xl px-5 py-12 min-[720px]:ml-56 min-[720px]:mr-5 xl:mx-auto">
        <BackButton navigate={navigate} />
        <header className="border-b border-slate-200 pb-12">
          <time className="text-[13px] font-medium text-slate-500">
            {formatPostDate(post.date)} / {post.readingMinutes} min read
          </time>
          <h1 className="font-serif mt-5 text-4xl font-normal tracking-tight text-slate-900 md:text-5xl md:leading-tight">{post.title}</h1>
          <p className="mt-5 text-lg leading-8 text-slate-700">{post.description}</p>
          <TagList tags={post.tags} />
        </header>
        {post.coverImage && (
          <img
            alt=""
            className="mt-12 aspect-[16/9] w-full border border-slate-200 object-cover shadow-sm"
            src={post.coverImage}
          />
        )}
        <MarkdownBody markdown={post.body} slug={post.slug} />
      </article>
    </>
  );
}

function BackButton({ navigate }) {
  return (
    <button className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-900" onClick={() => navigate("/")}>
      <ArrowLeft className="h-4 w-4" /> Back to index
    </button>
  );
}
