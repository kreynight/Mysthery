import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPostBySlug, getAllPostSlugs } from "@/lib/blog";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  return {
    title: `${post.title} | ${SITE_NAME}`,
    description: post.description,
    keywords: post.keywords,
    authors: [{ name: post.author }],
    alternates: { canonical: `${SITE_URL}/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
      url: `${SITE_URL}/blog/${post.slug}`,
      siteName: SITE_NAME,
    },
  };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || post.draft) notFound();

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Organization",
      name: post.author,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`,
    },
    keywords: post.keywords.join(", "),
    wordCount: post.contentHtml.replace(/<[^>]+>/g, "").split(/\s+/).length,
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
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `${SITE_URL}/blog/${post.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <article className="max-w-3xl mx-auto px-4 py-16">
        {/* Breadcrumbs */}
        <nav className="text-xs text-stone-400 mb-8">
          <Link href="/" className="hover:text-[#3d4a3a] transition-colors">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/blog" className="hover:text-[#3d4a3a] transition-colors">
            Blog
          </Link>
          <span className="mx-2">/</span>
          <span className="text-stone-600">{post.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <time
              dateTime={post.date}
              className="text-[10px] tracking-wider uppercase text-stone-400"
            >
              {formatDate(post.date)}
            </time>
            <span className="text-[10px] text-stone-400">
              {post.readingTime} min read
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-light tracking-wide text-stone-800 mb-4 leading-snug">
            {post.title}
          </h1>
          <p className="text-sm text-stone-500 leading-relaxed">
            {post.description}
          </p>
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] tracking-wider uppercase text-stone-400 bg-stone-100 px-2 py-0.5"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Content */}
        <div
          className="prose-mystherie"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-stone-200">
          <div className="flex items-center justify-between">
            <Link
              href="/blog"
              className="text-xs tracking-wide uppercase text-stone-400 hover:text-[#3d4a3a] transition-colors"
            >
              &larr; Back to journal
            </Link>
            <Link
              href="/"
              className="text-xs tracking-wide uppercase text-stone-400 hover:text-[#3d4a3a] transition-colors"
            >
              Browse collections
            </Link>
          </div>
        </footer>
      </article>
    </>
  );
}
