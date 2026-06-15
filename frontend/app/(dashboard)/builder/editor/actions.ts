// frontend/app/(dashboard)/builder/editor/actions.ts

"use server";

// Placeholder in-memory store (replace with DB later)
let projectStore: Record<string, any> = {};

export async function saveProject(name: string, data: any) {
  projectStore[name] = {
    ...data,
    updatedAt: new Date().toISOString(),
  };

  return { success: true };
}

export async function loadProject(name: string) {
  return projectStore[name] || null;
}

export async function listProjects() {
  return Object.keys(projectStore).map((name) => ({
    name,
    updatedAt: projectStore[name].updatedAt,
  }));
}
