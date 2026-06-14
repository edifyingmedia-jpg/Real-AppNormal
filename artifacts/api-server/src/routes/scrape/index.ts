import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/scrape", async (req, res): Promise<void> => {
  const url = req.query.url as string;

  if (!url) {
    res.status(400).json({ error: "url query parameter is required" });
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    res.status(400).json({ error: "Invalid URL — must be a full URL including https://" });
    return;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    res.status(400).json({ error: "Only http/https URLs are supported" });
    return;
  }

  let html: string;
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xhtml+xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Cache-Control": "no-cache",
      },
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) {
      res.status(400).json({ error: `Failed to fetch: ${response.status} ${response.statusText}` });
      return;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("html")) {
      res.status(400).json({ error: `URL returns ${contentType.split(";")[0]}, not HTML` });
      return;
    }

    html = await response.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    res.status(400).json({ error: `Could not reach URL: ${msg}` });
    return;
  }

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : parsed.hostname;

  // Extract meta description
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)
    ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  const description = descMatch ? descMatch[1] : "";

  // Clean HTML to reduce size:
  // - strip <script> blocks (noisy, not needed for visual cloning)
  // - strip HTML comments
  // - collapse base64 data URIs (can be megabytes)
  // - collapse whitespace runs
  html = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/data:[a-z]+\/[a-z+\-]+;base64,[A-Za-z0-9+/=]{50,}/g, "data:image/placeholder")
    .replace(/[ \t]{4,}/g, "   ");

  const MAX_CHARS = 80_000;
  const truncated = html.length > MAX_CHARS;
  if (truncated) {
    // Prefer to keep the <head> and beginning of <body> for styles + structure
    html = html.slice(0, MAX_CHARS);
  }

  res.json({ url, title, description, html, truncated });
});

export default router;
