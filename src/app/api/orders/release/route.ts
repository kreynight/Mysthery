import { NextResponse } from "next/server";
import { releaseReadyOrders } from "@/lib/fulfil";

// Called every few minutes by a scheduled job. It only sends paid orders whose
// hold is over, once each, so calling it more often changes nothing.
export const dynamic = "force-dynamic";

export async function GET() {
  const result = await releaseReadyOrders();
  return NextResponse.json(result);
}
