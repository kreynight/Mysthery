// Order confirmation email, sent through Resend when RESEND_API_KEY is set.
// Without the key nothing is sent, and Stripe's own receipt is the only email.

import { SITE_NAME } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { INSTAGRAM_HREF } from "@/lib/social";

export interface ConfirmationLine {
  description: string;
  quantity: number;
}

export interface Confirmation {
  to: string;
  name?: string | null;
  lines: ConfirmationLine[];
  totalCents: number;
}

const DEFAULT_FROM = `${SITE_NAME} <orders@mystherie.com>`;

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function firstName(name?: string | null): string | null {
  const first = name?.trim().split(/\s+/)[0];
  return first ? first : null;
}

export function confirmationContent(c: Confirmation) {
  const hello = firstName(c.name) ? `Hi ${firstName(c.name)},` : "Hi,";
  const items = c.lines.map((l) => `${l.quantity > 1 ? `${l.quantity} × ` : ""}${l.description}`);
  const total = formatPrice(c.totalCents);
  const subject = `Your ${SITE_NAME} tea is on its way`;

  const text = [
    hello,
    "",
    "Thank you for your order. Your tea is weighed and sealed by hand, and it ships within 3 to 5 business days.",
    "",
    ...items.map((i) => `- ${i}`),
    `Total: ${total}`,
    "",
    "Half the fun is the mystery, so steep it, taste it, and tell us your guess on Instagram.",
    INSTAGRAM_HREF,
    "",
    SITE_NAME,
  ].join("\n");

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f6f1e9;">
<div style="max-width:520px;margin:0 auto;padding:32px 24px;font-family:Georgia,'Times New Roman',serif;color:#3b2f25;line-height:1.6;">
  <p style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#7a6650;margin:0 0 24px;">${escapeHtml(SITE_NAME)}</p>
  <p style="margin:0 0 16px;">${escapeHtml(hello)}</p>
  <p style="margin:0 0 20px;">Thank you for your order. Your tea is weighed and sealed by hand, and it ships within 3 to 5 business days.</p>
  <table style="width:100%;border-collapse:collapse;margin:0 0 20px;border-top:1px solid #d9ccb8;border-bottom:1px solid #d9ccb8;">
    ${items.map((i) => `<tr><td style="padding:8px 0;">${escapeHtml(i)}</td></tr>`).join("")}
    <tr><td style="padding:8px 0;font-weight:bold;">Total: ${escapeHtml(total)}</td></tr>
  </table>
  <p style="margin:0 0 20px;">Half the fun is the mystery, so steep it, taste it, and tell us your guess on <a href="${INSTAGRAM_HREF}" style="color:#5b4a36;">Instagram</a>.</p>
  <p style="margin:0;">${escapeHtml(SITE_NAME)}</p>
</div>
</body></html>`;

  return { subject, text, html };
}

/** Sends the confirmation. Never throws: a failed email must not fail the order. */
export async function sendOrderConfirmation(c: Confirmation): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const { subject, text, html } = confirmationContent(c);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || DEFAULT_FROM,
        to: [c.to],
        subject,
        text,
        html,
      }),
    });
    if (!res.ok) console.error(`Confirmation email failed: ${res.status} ${await res.text()}`);
  } catch (err) {
    console.error("Confirmation email failed:", err);
  }
}
