import type { VercelRequest, VercelResponse } from "@vercel/node";

const BACKEND_URL = process.env.VITE_API_BASE_URL || "http://13.232.112.215:8080";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = req.url?.replace("/api/", "") || "";
  const target = `${BACKEND_URL}/api/${path}`;

  try {
    const response = await fetch(target, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        ...(req.headers.authorization ? { Authorization: req.headers.authorization as string } : {}),
        ...(req.headers["x-organization-id"] ? { "X-Organization-Id": req.headers["x-organization-id"] as string } : {}),
      },
      body: req.method !== "GET" && req.method !== "HEAD" ? JSON.stringify(req.body) : undefined,
    });

    const data = response.headers.get("content-type")?.includes("application/json")
      ? await response.json()
      : await response.text();

    res.status(response.status).json(data);
  } catch {
    res.status(502).json({ error: "Backend unavailable" });
  }
}
