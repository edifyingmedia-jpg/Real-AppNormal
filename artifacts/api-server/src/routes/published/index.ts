import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, projectsTable, projectFilesTable } from "@workspace/db";

const router: IRouter = Router();

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildDocument(files: { filename: string; content: string; language: string }[]): string {
  const htmlFile = files.find((f) => f.filename === "index.html" || f.language === "html");

  if (!htmlFile) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Not Found</title></head><body>
<p style="font-family:system-ui;padding:40px">No app files found for this project.</p></body></html>`;
  }

  let doc = htmlFile.content;
  const cssFiles = files.filter((f) => f.language === "css");
  const jsFiles = files.filter((f) => f.language === "javascript" || f.language === "js");

  for (const cssFile of cssFiles) {
    doc = doc.replace(
      new RegExp(`<link[^>]+href=["']${escapeRegex(cssFile.filename)}["'][^>]*>`, "gi"),
      `<style>\n${cssFile.content}\n</style>`
    );
  }

  for (const jsFile of jsFiles) {
    doc = doc.replace(
      new RegExp(`<script[^>]+src=["']${escapeRegex(jsFile.filename)}["'][^>]*><\\/script>`, "gi"),
      `<script>\n${jsFile.content}\n</script>`
    );
  }

  const unreferencedCSS = cssFiles.filter((f) => !doc.toLowerCase().includes(f.filename.toLowerCase()));
  if (unreferencedCSS.length > 0) {
    const block = unreferencedCSS.map((f) => `<style>\n${f.content}\n</style>`).join("\n");
    doc = doc.includes("</head>") ? doc.replace("</head>", `${block}\n</head>`) : block + "\n" + doc;
  }

  const unreferencedJS = jsFiles.filter((f) => !doc.toLowerCase().includes(f.filename.toLowerCase()));
  if (unreferencedJS.length > 0) {
    const block = unreferencedJS.map((f) => `<script>\n${f.content}\n</script>`).join("\n");
    doc = doc.includes("</body>") ? doc.replace("</body>", `${block}\n</body>`) : doc + "\n" + block;
  }

  return doc;
}

router.get("/published/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).send("Invalid project ID");
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) {
    res.status(404).send("Project not found");
    return;
  }
  if (!project.isPublished) {
    res.status(403).send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Not Published</title>
<style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0d1117;color:#8b949e;flex-direction:column;gap:12px}
h2{color:#f0f6fc;margin:0}p{margin:0;font-size:14px}</style></head><body>
<h2>App not published</h2><p>This project has not been published yet.</p></body></html>`);
    return;
  }

  const files = await db.select().from(projectFilesTable).where(eq(projectFilesTable.projectId, id));
  const html = buildDocument(files);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.send(html);
});

export default router;
