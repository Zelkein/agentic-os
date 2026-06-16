/**
 * netlify-client.ts — Netlify Deploy API client
 * Uses NETLIFY_AUTH_TOKEN from environment for authentication.
 */
interface NetlifySite {
  id: string;
  name: string;
  url: string;
  updatedAt: string;
  deployCount: number;
}

interface DeployResult {
  success: boolean;
  url: string | null;
  deployId: string | null;
  error?: string;
}

function getNetlifyToken(): string | null {
  return process.env.NETLIFY_AUTH_TOKEN || null;
}

function getNetlifyApiBase(): string {
  return "https://api.netlify.com/api/v1";
}

async function netlifyFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getNetlifyToken();
  if (!token) {
    throw new Error("NETLIFY_AUTH_TOKEN not configured");
  }

  const url = `${getNetlifyApiBase()}${path}`;
  return fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

/**
 * List all Netlify sites accessible with the configured token.
 */
export async function listSites(): Promise<NetlifySite[]> {
  const res = await netlifyFetch("/sites?per_page=50");
  if (!res.ok) {
    throw new Error(`Netlify API error: ${res.status} ${res.statusText}`);
  }

  const sites = await res.json() as Array<{
    id: string;
    name: string;
    ssl_url?: string;
    updated_at: string;
  }>;

  return sites.map((site) => ({
    id: site.id,
    name: site.name,
    url: site.ssl_url || `https://${site.name}.netlify.app`,
    updatedAt: site.updated_at,
    deployCount: 0,
  }));
}

/**
 * Deploy a directory of static content to a Netlify site.
 * Creates a new deploy via the Netlify API.
 */
export async function deploySite(
  siteId: string,
  contentDir: string,
  options?: { message?: string }
): Promise<DeployResult> {
  // Read all files from the content directory
  const fs = await import("fs");
  const path = await import("path");

  if (!fs.existsSync(contentDir)) {
    return { success: false, url: null, deployId: null, error: "Content directory not found" };
  }

  // Walk directory and collect files
  const files: Array<{ path: string; content: string }> = [];
  const walkDir = (dir: string, prefix = "") => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walkDir(fullPath, relativePath);
      } else {
        const content = fs.readFileSync(fullPath, "utf-8");
        files.push({ path: relativePath, content });
      }
    }
  };
  walkDir(contentDir);

  // Build the deploy payload (Netlify API v1)
  const deployPayload: Record<string, string> = {};
  for (const file of files) {
    deployPayload[file.path] = file.content;
  }

  const res = await netlifyFetch(`/sites/${siteId}/deploys`, {
    method: "POST",
    body: JSON.stringify({
      files: deployPayload,
      title: options?.message || `Deploy from Agentic OS - ${new Date().toISOString().slice(0, 16)}`,
      async: false,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "Unknown error");
    return {
      success: false,
      url: null,
      deployId: null,
      error: `Deploy failed: ${res.status} - ${errorBody.slice(0, 200)}`,
    };
  }

  const deploy = await res.json() as { id: string; ssl_url?: string; deploy_url?: string };
  return {
    success: true,
    url: deploy.ssl_url || deploy.deploy_url || null,
    deployId: deploy.id || null,
  };
}

/**
 * Get deploy history for a site.
 */
export async function getDeployHistory(siteId: string, limit = 10): Promise<Array<{
  id: string;
  title: string;
  createdAt: string;
  state: string;
  url: string | null;
}>> {
  const res = await netlifyFetch(`/sites/${siteId}/deploys?per_page=${limit}`);
  if (!res.ok) return [];

  const deploys = await res.json() as Array<{
    id: string;
    title: string;
    created_at: string;
    state: string;
    ssl_url?: string;
  }>;

  return deploys.map((d) => ({
    id: d.id,
    title: d.title || "Deploy",
    createdAt: d.created_at,
    state: d.state,
    url: d.ssl_url || null,
  }));
}
