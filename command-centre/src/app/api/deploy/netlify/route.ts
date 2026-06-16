import { NextRequest, NextResponse } from "next/server";
import { listSites, deploySite, getDeployHistory } from "@/lib/netlify-client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const action = searchParams.get("action") || "list";

    if (action === "history" && siteId) {
      const history = await getDeployHistory(siteId);
      return NextResponse.json({ deploys: history });
    }

    const sites = await listSites();
    return NextResponse.json({ sites });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Netlify API error";
    const isConfigError = message.includes("NETLIFY_AUTH_TOKEN");
    return NextResponse.json(
      { error: message, sites: [], deploys: [] },
      { status: isConfigError ? 400 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteId, contentDir, message } = body;

    if (!siteId || !contentDir) {
      return NextResponse.json(
        { error: "siteId and contentDir are required" },
        { status: 400 }
      );
    }

    const result = await deploySite(siteId, contentDir, { message });
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Deploy failed";
    return NextResponse.json(
      { success: false, url: null, deployId: null, error: message },
      { status: 500 }
    );
  }
}
