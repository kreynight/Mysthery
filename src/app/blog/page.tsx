import Link from "next/link";
import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Blog | ${SITE_NAME}`,
  description:
    "Explore tea culture, brewing guides, and the craft behind curated mystery tea collections. Insights from the Mystherie tea atelier.",
  alternates: { canonical: `${SITE_URL}/blog` },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogPage() {
  const posts = getAllPosts();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${SITE_NAME} Blog`,
    description:
      "Tea culture, brewing guides, and the craft behind curated mystery tea collections.",
    url: `${SITE_URL}/blog`,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${SITE_URL}/blog`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <div className="max-w-3xl mx-auto px-4 py-16">
        <nav className="text-xs text-stone-400 mb-8">
          <Link href="/" className="hover:text-[#3d4a3a] transition-colors">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-stone-600">Blog</span>
        </nav>

        <div className="mb-14">
          <p className="text-xs tracking-[0.3em] uppercase text-stone-400 mb-3">
            From the Atelier
          </p>
          <h1 className="text-2xl md:text-3xl font-light tracking-wide text-stone-800 mb-3">
            Journal
          </h1>
          <p className="text-sm text-stone-400 max-w-md">
            Tea culture, brewing wisdom, and notes from behind the blend.
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="text-sm text-stone-400 py-12 text-center">
            No posts yet. Check back soon.
          </p>
        ) : (
          <div className="space-y-10">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="border-b border-stone-200/60 pb-8"
              >
                <Link href={`/blog/${post.slug}`} className="group block">
                  <div className="flex items-center gap-3 mb-2">
                    <time
                      dateTime={post.date}
                      className="text-[10px] tracking-wider uppercase text-stone-400"
                    >
                      {formatDate(post.date)}
                    </time>
                    {post.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] tracking-wider uppercase text-stone-400 bg-stone-100 px-2 py-0.5"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-lg font-light text-stone-800 group-hover:text-[#3d4a3a] transition-colors mb-2">
                    {post.title}
                  </h2>
                  <p className="text-sm text-stone-500 leading-relaxed">
                    {post.description}
                  </p>
                  <span className="inline-block mt-3 text-xs tracking-wide uppercase text-[#3d4a3a] group-hover:underline">
                    Read more
                  </span>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
