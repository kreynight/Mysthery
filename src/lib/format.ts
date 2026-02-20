export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatRemaining(remaining: number): string {
  if (remaining <= 0) return "Sold out";
  if (remaining === 1) return "1 remaining";
  return `${remaining} remaining`;
}
