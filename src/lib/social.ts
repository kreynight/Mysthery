// Social links shared by the header menu and the footer.

// Instagram moved to @mystherie.tea on Nov 21, 2026 (the old @mystherietea account was disabled).
// Set here rather than from NEXT_PUBLIC_INSTAGRAM_URL, which still holds the old handle.
export const INSTAGRAM_HREF = "https://www.instagram.com/mystherie.tea/";

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
