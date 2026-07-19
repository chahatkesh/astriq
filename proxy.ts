import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isSupportedLocale } from "@/lib/i18n/locales";

/**
 * Locale-aware routing.
 *
 * Requests without a supported locale prefix are redirected to the default
 * locale so every page has a stable, shareable localized URL. API routes,
 * Next.js internals and static assets are excluded via the matcher below.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split("/")[1] ?? "";

  if (isSupportedLocale(firstSegment)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|opengraph-image|twitter-image|icon|apple-icon|sitemap.xml|robots.txt|.*\\..*).*)",
  ],
};
