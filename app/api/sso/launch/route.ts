import { NextRequest, NextResponse } from "next/server";

/**
 * SSO Launch Proxy — Server-Side URL Authority Endpoint
 *
 * This route enforces the "server-authoritative URL" pattern (Zoho One / Google Workspace model).
 * The client NEVER decides which URL to POST to. The server resolves the canonical live URL
 * from environment variables at runtime and returns it to the client as a verified launch package.
 *
 * Flow:
 *   Client → POST /api/sso/launch { appId }
 *   Server → reads NEXT_PUBLIC_BOOKS_APP_URL (never trusts client-provided URLs)
 *   Server → returns { targetUrl, ssoEndpoint } to client
 *   Client → submits hidden POST form to ssoEndpoint with apiKey
 *
 * This ensures:
 *   - Zero stale localhost/staging URLs ever reach the SSO endpoint
 *   - No cache-clear required when URLs change between environments
 *   - Single source of truth for all app URLs (server env vars)
 */

// Server-side canonical URL registry (reads from env at runtime)
function getCanonicalAppUrl(appId: string): string | null {
  switch (appId) {
    case "doorstep-books": {
      const url =
        process.env.NEXT_PUBLIC_BOOKS_APP_URL ||
        process.env.NEXT_PUBLIC_BOOKS_URL ||
        "https://books.doorstepfilings.com";
      return url.replace(/\/$/, "");
    }
    // Future apps can be added here as they launch
    // case "doorstep-hrms":
    //   return process.env.NEXT_PUBLIC_HRMS_APP_URL || "https://hrms.doorstepfilings.com";
    default:
      return null;
  }
}

export async function POST(req: NextRequest) {
  let appId = "";

  try {
    const body = await req.json().catch(() => ({}));
    appId = String(body?.appId || "").trim();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  if (!appId) {
    return NextResponse.json(
      { success: false, error: "Missing appId" },
      { status: 400 }
    );
  }

  const canonicalUrl = getCanonicalAppUrl(appId);

  if (!canonicalUrl) {
    return NextResponse.json(
      { success: false, error: `Unknown app: ${appId}` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    appId,
    targetUrl: canonicalUrl,
    ssoEndpoint: `${canonicalUrl}/api/sso`,
    connectEndpoint: `${canonicalUrl}/connect`,
  });
}

// Also support GET for health/debug checks
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const appId = searchParams.get("appId") || "doorstep-books";

  const canonicalUrl = getCanonicalAppUrl(appId);

  if (!canonicalUrl) {
    return NextResponse.json(
      { success: false, error: `Unknown app: ${appId}` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    appId,
    targetUrl: canonicalUrl,
    ssoEndpoint: `${canonicalUrl}/api/sso`,
    connectEndpoint: `${canonicalUrl}/connect`,
  });
}
