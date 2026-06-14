import { Router, type IRouter } from "express";
import { db, projectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.post("/ai-proxy/:projectId/openai", async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.projectId, 10);
  if (isNaN(projectId)) {
    res.status(400).json({ error: "Invalid project ID" });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  const apiKey = project?.openaiApiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(403).json({ error: "No OpenAI API key configured for this project" });
    return;
  }

  const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(req.body),
  });

  const contentType = upstream.headers.get("content-type") ?? "application/json";
  res.status(upstream.status).setHeader("Content-Type", contentType);

  if (req.body?.stream) {
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    if (upstream.body) {
      const reader = upstream.body.getReader();
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
        res.end();
      };
      pump().catch(() => res.end());
    } else {
      res.end();
    }
  } else {
    const data = await upstream.json();
    res.json(data);
  }
});

router.post("/ai-proxy/:projectId/gemini", async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.projectId, 10);
  if (isNaN(projectId)) {
    res.status(400).json({ error: "Invalid project ID" });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  const apiKey = project?.geminiApiKey ?? process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(403).json({ error: "No Gemini API key configured for this project" });
    return;
  }

  const model = (req.query.model as string) ?? "gemini-2.0-flash";
  const upstreamUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const upstream = await fetch(upstreamUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req.body),
  });

  const contentType = upstream.headers.get("content-type") ?? "application/json";
  res.status(upstream.status).setHeader("Content-Type", contentType);
  const data = await upstream.json();
  res.json(data);
});

export default router;
