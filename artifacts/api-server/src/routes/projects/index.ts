import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, projectsTable, projectFilesTable } from "@workspace/db";
import {
  CreateProjectBody,
  GetProjectParams,
  UpdateProjectParams,
  UpdateProjectBody,
  DeleteProjectParams,
  ListProjectFilesParams,
  CreateProjectFileParams,
  CreateProjectFileBody,
  UpdateProjectFileParams,
  UpdateProjectFileBody,
  DeleteProjectFileParams,
  PublishProjectParams,
  PublishProjectBody,
  UpdateProjectSettingsParams,
  UpdateProjectSettingsBody,
  PushProjectToGithubParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/projects", async (_req, res): Promise<void> => {
  const projects = await db.select().from(projectsTable).orderBy(projectsTable.updatedAt);
  res.json(projects);
});

router.post("/projects", async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [project] = await db.insert(projectsTable).values(parsed.data).returning();
  res.status(201).json(project);
});

router.get("/projects/:id", async (req, res): Promise<void> => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.id));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const files = await db.select().from(projectFilesTable).where(eq(projectFilesTable.projectId, params.data.id));
  res.json({ ...project, files });
});

router.patch("/projects/:id", async (req, res): Promise<void> => {
  const params = UpdateProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [project] = await db
    .update(projectsTable)
    .set(parsed.data)
    .where(eq(projectsTable.id, params.data.id))
    .returning();
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(project);
});

router.delete("/projects/:id", async (req, res): Promise<void> => {
  const params = DeleteProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(projectFilesTable).where(eq(projectFilesTable.projectId, params.data.id));
  const [project] = await db.delete(projectsTable).where(eq(projectsTable.id, params.data.id)).returning();
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/projects/:id/files", async (req, res): Promise<void> => {
  const params = ListProjectFilesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const files = await db.select().from(projectFilesTable).where(eq(projectFilesTable.projectId, params.data.id));
  res.json(files);
});

router.post("/projects/:id/files", async (req, res): Promise<void> => {
  const params = CreateProjectFileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateProjectFileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [file] = await db
    .insert(projectFilesTable)
    .values({ ...parsed.data, projectId: params.data.id })
    .returning();
  res.status(201).json(file);
});

router.patch("/projects/:id/files/:fileId", async (req, res): Promise<void> => {
  const params = UpdateProjectFileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateProjectFileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [file] = await db
    .update(projectFilesTable)
    .set(parsed.data)
    .where(eq(projectFilesTable.id, params.data.fileId))
    .returning();
  if (!file) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  res.json(file);
});

router.delete("/projects/:id/files/:fileId", async (req, res): Promise<void> => {
  const params = DeleteProjectFileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(projectFilesTable).where(eq(projectFilesTable.id, params.data.fileId));
  res.sendStatus(204);
});

router.post("/projects/:id/publish", async (req, res): Promise<void> => {
  const params = PublishProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = PublishProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [project] = await db
    .update(projectsTable)
    .set({ isPublished: parsed.data.isPublished })
    .where(eq(projectsTable.id, params.data.id))
    .returning();
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(project);
});

router.patch("/projects/:id/settings", async (req, res): Promise<void> => {
  const params = UpdateProjectSettingsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateProjectSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [project] = await db
    .update(projectsTable)
    .set(parsed.data)
    .where(eq(projectsTable.id, params.data.id))
    .returning();
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(project);
});

router.post("/projects/:id/github/push", async (req, res): Promise<void> => {
  const params = PushProjectToGithubParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.id));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  if (!project.githubToken || !project.githubRepo) {
    res.status(400).json({ error: "GitHub token and repository name are required. Configure them in project settings." });
    return;
  }

  const files = await db.select().from(projectFilesTable).where(eq(projectFilesTable.projectId, params.data.id));
  if (files.length === 0) {
    res.status(400).json({ error: "No files to push. Generate an app first." });
    return;
  }

  const token = project.githubToken;
  const repoName = project.githubRepo;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "AI-App-Builder",
    "Content-Type": "application/json",
  };

  // Get authenticated user
  const userRes = await fetch("https://api.github.com/user", { headers });
  if (!userRes.ok) {
    res.status(400).json({ error: "Invalid GitHub token. Please check your personal access token." });
    return;
  }
  const user = await userRes.json() as { login: string };
  const owner = user.login;
  const fullRepo = repoName.includes("/") ? repoName : `${owner}/${repoName}`;
  const [repoOwner, repoSlug] = fullRepo.split("/");

  // Create repo if it doesn't exist
  const repoCheckRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoSlug}`, { headers });
  if (repoCheckRes.status === 404) {
    const createRes = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: repoSlug,
        description: project.description || `Generated by AI App Builder`,
        private: false,
        auto_init: true,
      }),
    });
    if (!createRes.ok) {
      const err = await createRes.json() as { message?: string };
      res.status(400).json({ error: `Failed to create repo: ${err.message ?? "unknown error"}` });
      return;
    }
    // Wait for repo to be ready
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Push each file
  let filesUpdated = 0;
  for (const file of files) {
    const content = Buffer.from(file.content).toString("base64");
    const fileUrl = `https://api.github.com/repos/${repoOwner}/${repoSlug}/contents/${file.filename}`;

    // Check if file exists (to get sha for update)
    const existingRes = await fetch(fileUrl, { headers });
    let sha: string | undefined;
    if (existingRes.ok) {
      const existing = await existingRes.json() as { sha?: string };
      sha = existing.sha;
    }

    const putRes = await fetch(fileUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: `Update ${file.filename} via AI App Builder`,
        content,
        ...(sha ? { sha } : {}),
      }),
    });

    if (putRes.ok) filesUpdated++;
  }

  res.json({
    success: true,
    repoUrl: `https://github.com/${repoOwner}/${repoSlug}`,
    filesUpdated,
    message: `Pushed ${filesUpdated} file${filesUpdated !== 1 ? "s" : ""} to ${repoOwner}/${repoSlug}`,
  });
});

export default router;
