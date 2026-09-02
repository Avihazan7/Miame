// middleware.ts — the URLs this site deliberately removed.
//
// WHY 410 AND NOT 404. They mean different things to a crawler and Google acts on
// them differently: 404 is "not found", which it treats as possibly temporary and
// keeps retrying for months while the URL lingers in the index; 410 is "gone,
// deliberately", and it drops the URL far faster. These two pages were REMOVED by a
// product decision, not lost — so 410 is simply the true status, and the faster
// de-indexing is what that truth buys.
//
// WHY A LIST HERE AND NOT A ROUTE FILE PER PATH. A `route.ts` under app/partners/
// would put the tombstone back inside the directory the decision deleted, where the
// next person restoring a page would find a file and assume the route still exists.
// One list, in one file, named for what it is.
//
// WHEN A PATH LEAVES THIS LIST: only once Google has dropped it and the URL is truly
// dead traffic. Removing it early just turns a 410 into a 404 and restarts the clock.
import { NextResponse, type NextRequest } from "next/server";

/**
 * Removed 2026-09-02 by owner decision: MiaMe markets and sells MIA FOUR, and
 * nothing else. `/partners` offered a MiaMe Hub business partnership (13% success
 * fee) and sat in the header nav; `/rent-eilat` offered an hourly rental fleet.
 * Neither product exists.
 */
const GONE = new Set(["/partners", "/rent-eilat"]);

export function middleware(req: NextRequest) {
  // Trailing slash normalised so /partners/ is as gone as /partners.
  const path = req.nextUrl.pathname.replace(/\/+$/, "") || "/";
  if (GONE.has(path)) {
    return new NextResponse(null, {
      status: 410,
      // noindex alongside the 410: belt and braces for any crawler that renders
      // the response before reading its status.
      headers: { "X-Robots-Tag": "noindex" },
    });
  }
  return NextResponse.next();
}

export const config = {
  // Only the paths that can be gone — the middleware must not sit in front of
  // static assets, the image routes or /api on every request for nothing.
  matcher: ["/partners", "/partners/", "/rent-eilat", "/rent-eilat/"],
};
