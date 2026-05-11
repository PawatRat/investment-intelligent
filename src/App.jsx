import { lazy, Suspense } from "react";
import DotField from "./components/DotField.jsx";
import SiteHeader from "./components/SiteHeader.jsx";
import StateMessage from "./components/StateMessage.jsx";
import PostIndex from "./features/posts/PostIndex.jsx";
import PromptsIndex from "./features/prompts/PromptsIndex.jsx";
import { useRoute } from "./lib/router.js";

const PostDetail = lazy(() => import("./features/posts/PostDetail.jsx"));
const PromptsDetail = lazy(() => import("./features/prompts/PromptsDetail.jsx"));

export default function App() {
  const { path, navigate } = useRoute();

  if (path.startsWith("/prompts/")) {
    const filename = path.replace("/prompts/", "");
    return (
      <main className="min-h-screen bg-white text-black">
        <DotField />
        <SiteHeader navigate={navigate} />
        <Suspense
          fallback={
            <section className="relative z-10 mx-auto max-w-4xl px-5 py-12">
              <StateMessage message="Loading prompt..." />
            </section>
          }
        >
          <PromptsDetail filename={filename} navigate={navigate} />
        </Suspense>
      </main>
    );
  }

  if (path === "/prompts") {
    return (
      <main className="min-h-screen bg-white text-black">
        <DotField />
        <SiteHeader navigate={navigate} />
        <PromptsIndex navigate={navigate} />
      </main>
    );
  }

  const slug = path.startsWith("/posts/") ? path.replace("/posts/", "") : "";

  return (
    <main className="min-h-screen bg-white text-black">
      <DotField />
      <SiteHeader navigate={navigate} />
      {slug ? (
        <Suspense
          fallback={
            <section className="relative z-10 mx-auto max-w-4xl px-5 py-12">
              <StateMessage message="Loading post..." />
            </section>
          }
        >
          <PostDetail slug={slug} navigate={navigate} />
        </Suspense>
      ) : (
        <PostIndex navigate={navigate} />
      )}
    </main>
  );
}
