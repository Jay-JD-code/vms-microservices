import type { VercelRequest, VercelResponse } from "@vercel/node";

const BACKEND_URL = process.env.BACKEND_URL || "http://13.232.112.215:8080";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = req.url?.replace("/api/", "") || "";
  const target = `${BACKEND_URL}/api/${path}`;

  const headers: Record<string, string> = {
    "Content-Type": req.headers["content-type"] as string || "application/json",
  };
  if (req.headers.authorization) {
    headers["Authorization"] = req.headers.authorization as string;
  }
  if (req.headers["x-organization-id"]) {
    headers["X-Organization-Id"] = req.headers["x-organization-id"] as string;
  }
  if (req.headers["x-user-role"]) {
    headers["X-User-Role"] = req.headers["x-user-role"] as string;
  }

  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? JSON.stringify(req.body)
      : undefined;

  try {
    const response = await fetch(target, {
      method: req.method,
      headers,
      body,
    });

    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();
    const data = contentType.includes("application/json") && text ? JSON.parse(text) : text;

    if (contentType.includes("application/json")) {
      res.status(response.status).json(data);
    } else {
      res.status(response.status).send(data);
    }
  } catch (err: any) {
    res.status(502).json({ error: "Backend unavailable", detail: err?.message });
  }
}
