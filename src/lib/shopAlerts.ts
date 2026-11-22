// Emails to the shop itself (new orders, refunds), sent through Resend.
// Goes to ORDER_ALERT_EMAIL; nothing is sent without it or without RESEND_API_KEY.

import { SITE_NAME } from "@/lib/constants";

export interface ShopAlert {
  subject: string;
  lines: string[];
}

/** Never throws: a failed alert must not fail the order. */
export async function sendShopAlert(a: ShopAlert): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.ORDER_ALERT_EMAIL;
  if (!key || !to) return;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || `${SITE_NAME} <orders@mystherie.com>`,
        to: to.split(",").map((s) => s.trim()).filter(Boolean),
        subject: a.subject,
        text: [...a.lines, "", "Admin orders: https://mystherie.com/admin/orders"].join("\n\n"),
      }),
    });
    if (!res.ok) console.error(`Shop alert failed: ${res.status} ${await res.text()}`);
  } catch (err) {
    console.error("Shop alert failed:", err);
  }
}
