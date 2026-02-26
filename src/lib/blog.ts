import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  image: string | null;
  keywords: string[];
  draft: boolean;
}

export interface BlogPost extends BlogPostMeta {
  contentHtml: string;
  readingTime: number;
}

function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 230));
}

export function getAllPostSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function getAllPosts(): BlogPostMeta[] {
  const slugs = getAllPostSlugs();
  const posts = slugs
    .map((slug) => getPostMeta(slug))
    .filter((p): p is BlogPostMeta => p !== null && !p.draft)
    .sort((a, b) => (a.date > b.date ? -1 : 1));
  return posts;
}

export function getPostMeta(slug: string): BlogPostMeta | null {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data } = matter(fileContents);

  return {
    slug,
    title: data.title || slug,
    description: data.description || "",
    date: data.date ? String(data.date) : new Date().toISOString().split("T")[0],
    author: data.author || "Mystherie",
    tags: data.tags || [],
    image: data.image || null,
    keywords: data.keywords || [],
    draft: data.draft === true,
  };
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  const processed = await remark().use(html).process(content);
  const contentHtml = processed.toString();

  return {
    slug,
    title: data.title || slug,
    description: data.description || "",
    date: data.date ? String(data.date) : new Date().toISOString().split("T")[0],
    author: data.author || "Mystherie",
    tags: data.tags || [],
    image: data.image || null,
    keywords: data.keywords || [],
    draft: data.draft === true,
    contentHtml,
    readingTime: estimateReadingTime(content),
  };
}
