// Keeps one row per order in a Google Sheet, through the sheet's own Apps Script web app.
// ORDERS_SHEET_URL is that web app's address; without it nothing is sent.

export interface SheetRow {
  order: string;
  placed: string;
  status: string;
  customer: string;
  email: string;
  shipTo: string;
  items: string;
  pouches: number;
  weightGrams: number;
  shippingPaid: string;
  total: string;
  toShippoAt: string;
  shippoOrder: string;
  mode: string;
  updated: string;
}

/** Adds the order's row, or updates it if the order is already in the sheet. Throws on failure. */
export async function postOrderRow(row: SheetRow): Promise<void> {
  const url = process.env.ORDERS_SHEET_URL;
  if (!url) return;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ row }),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Orders sheet answered ${res.status}`);
}
