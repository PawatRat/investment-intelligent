import { lazy, Suspense } from "react";
import DotField from "./components/DotField.jsx";
import SiteHeader from "./components/SiteHeader.jsx";
import StateMessage from "./components/StateMessage.jsx";
import PostIndex from "./features/posts/PostIndex.jsx";
import { useRoute } from "./lib/router.js";

const PostDetail = lazy(() => import("./features/posts/PostDetail.jsx"));

export default function App() {
  const { path, navigate } = useRoute();
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
