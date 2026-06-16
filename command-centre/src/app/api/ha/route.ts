import { NextRequest, NextResponse } from "next/server";

const HA_URL = process.env.HA_URL || "http://homeassistant.local:8123";
const HA_TOKEN = process.env.HA_TOKEN || "";

async function haFetch(path: string, options?: RequestInit) {
  const url = `${HA_URL}/api/${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${HA_TOKEN}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HA API error ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

export async function GET(request: NextRequest) {
  if (!HA_TOKEN) {
    return NextResponse.json(
      { error: "HA_TOKEN not configured. Set HA_URL and HA_TOKEN in .env" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");

  try {
    const states = await haFetch("states");
    const entities = states as Array<{
      entity_id: string;
      state: string;
      attributes: Record<string, any>;
      last_changed: string;
      last_updated: string;
    }>;

    // Filter by domain if specified
    const filtered = domain
      ? entities.filter((e) => e.entity_id.startsWith(`${domain}.`))
      : entities;

    // Group by area
    const byArea: Record<string, typeof filtered> = {};
    for (const entity of filtered) {
      const area = entity.attributes.area_id ||
        entity.entity_id.split(".")[0] ||
        "other";
      if (!byArea[area]) byArea[area] = [];
      byArea[area].push(entity);
    }

    return NextResponse.json({
      entities: filtered,
      byArea,
      total: filtered.length,
      config: { url: HA_URL },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Cannot reach Home Assistant at ${HA_URL}: ${msg}` },
      { status: 502 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!HA_TOKEN) {
    return NextResponse.json(
      { error: "HA_TOKEN not configured" },
      { status: 503 }
    );
  }

  const body = await request.json();
  const { domain, service, entity_id, data } = body;

  if (!domain || !service || !entity_id) {
    return NextResponse.json(
      { error: "domain, service, and entity_id are required" },
      { status: 400 }
    );
  }

  try {
    const result = await haFetch(`services/${domain}/${service}`, {
      method: "POST",
      body: JSON.stringify({
        entity_id,
        ...(data || {}),
      }),
    });
    return NextResponse.json({ result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}