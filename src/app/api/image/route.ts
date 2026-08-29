import { NextRequest, NextResponse } from "next/server";

// Proxies image bytes for the Blizzard CDN hosts our armory data links to, so
// the browser only ever talks to our own origin. The BFF's server-side fetch
// reaches these hosts fine (see the character/pvp/mounts routes); a client
// loading them directly is not guaranteed the same network path.
const ALLOWED_HOSTS = new Set(["render.worldofwarcraft.com", "bnetcmsus-a.akamaihd.net"]);

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("url");
  if (!target) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: "Invalid url parameter" }, { status: 400 });
  }

  if (parsed.protocol !== "https:" || !ALLOWED_HOSTS.has(parsed.hostname)) {
    return NextResponse.json({ error: "URL host is not allowed" }, { status: 400 });
  }

  const response = await fetch(parsed, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; WowDashboardBFF/1.0)" },
    cache: "no-store",
  });

  if (!response.ok || !response.body) {
    return NextResponse.json(
      { error: `Upstream image request failed with status ${response.status}` },
      { status: 502 },
    );
  }

  // Item/mount/tier icons are keyed by a stable numeric ID and never change,
  // so they're safe to cache hard. A character's avatar and full-body render
  // sit under a `/character/` path and get *regenerated at the same URL*
  // whenever gear/appearance changes — caching those long-term would show a
  // stale portrait even after a hard refresh, so they get no caching at all.
  const isCharacterRender = parsed.pathname.includes("/character/");

  return new NextResponse(response.body, {
    status: 200,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/octet-stream",
      "cache-control": isCharacterRender ? "no-store" : "public, max-age=86400, immutable",
    },
  });
}
