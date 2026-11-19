// Social links from env vars, shared by the header menu and the footer.

// NEXT_PUBLIC_INSTAGRAM_URL may hold a full URL or just a handle ("@name" or "name").
function instagramHref(value?: string): string | null {
  const v = value?.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, "");
  if (!/^[A-Za-z0-9._]{1,30}$/.test(handle)) return null;
  return `https://www.instagram.com/${handle}`;
}

export const INSTAGRAM_HREF = instagramHref(process.env.NEXT_PUBLIC_INSTAGRAM_URL);

// NEXT_PUBLIC_TIKTOK_URL may hold a full URL or just a handle ("@name" or "name").
function tiktokHref(value?: string): string | null {
  const v = value?.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, "");
  if (!/^[A-Za-z0-9._]{2,24}$/.test(handle)) return null;
  return `https://www.tiktok.com/@${handle}`;
}

export const TIKTOK_HREF = tiktokHref(process.env.NEXT_PUBLIC_TIKTOK_URL);
