import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(_req: NextRequest) {
  // No auth gating here; we'll guard in layouts client-side.
  return NextResponse.next();
}

// Disable all matchers for now.
export const config = {
  matcher: [],
};