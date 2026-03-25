import "server-only";

import { del, head, put } from "@vercel/blob";

import {
  DEFAULT_PORTFOLIO_CONTENT,
  DEFAULT_PROJECTS,
  buildPortfolioContent,
  normalizePortfolioContent,
  normalizeRemoteImageUrl,
  normalizeWebsiteUrl,
  type PortfolioContent,
  type PortfolioProject,
} from "@/lib/portfolio-data";

const PORTFOLIO_CONTENT_PATH = "portfolio/content.json";
const PROJECT_UPLOAD_PREFIX = "portfolio/projects";
const PORTRAIT_UPLOAD_PREFIX = "portfolio/portrait";
const MANAGED_BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

function trimToNull(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function ensureBlobStorageConfigured() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured on the server.");
  }
}

function sanitizeFileName(name: string) {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned || "upload";
}

function getUploadPath(prefix: string, file: File) {
  return `${prefix}/${crypto.randomUUID()}-${sanitizeFileName(file.name || "upload")}`;
}

function extractManagedBlobPath(url: string, prefix: string) {
  try {
    const parsed = new URL(url);
    const pathname = decodeURIComponent(parsed.pathname).replace(/^\/+/, "");

    if (
      !parsed.hostname.endsWith(MANAGED_BLOB_HOST_SUFFIX) ||
      !pathname.startsWith(`${prefix}/`)
    ) {
      return null;
    }

    return pathname;
  } catch {
    return null;
  }
}

async function deleteManagedBlob(url: string | null | undefined, prefix: string) {
  const normalizedUrl = trimToNull(url);
  const path = normalizedUrl ? extractManagedBlobPath(normalizedUrl, prefix) : null;

  if (!path) {
    return;
  }

  try {
    await del(path);
  } catch {
    // Best-effort cleanup for replaced uploads.
  }
}

async function uploadImage(file: File, kind: "portrait" | "project") {
  ensureBlobStorageConfigured();

  const uploaded = await put(
    getUploadPath(kind === "portrait" ? PORTRAIT_UPLOAD_PREFIX : PROJECT_UPLOAD_PREFIX, file),
    file,
    {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type || undefined,
    },
  );

  return uploaded.url;
}

export function isPortfolioStorageConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function getPortfolioContent(): Promise<PortfolioContent> {
  if (!isPortfolioStorageConfigured()) {
    return DEFAULT_PORTFOLIO_CONTENT;
  }

  try {
    const blob = await head(PORTFOLIO_CONTENT_PATH);
    const response = await fetch(blob.url, { cache: "no-store" });

    if (!response.ok) {
      return DEFAULT_PORTFOLIO_CONTENT;
    }

    const data = (await response.json()) as unknown;
    return normalizePortfolioContent(data);
  } catch {
    return DEFAULT_PORTFOLIO_CONTENT;
  }
}

async function savePortfolioContent(content: PortfolioContent) {
  ensureBlobStorageConfigured();

  const nextContent = buildPortfolioContent({
    portraitImage: trimToNull(content.portraitImage),
    projects: content.projects,
  });

  await put(PORTFOLIO_CONTENT_PATH, JSON.stringify(nextContent, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });

  return nextContent;
}

export async function createProject(input: {
  url: string;
  description: string;
  imageUrl?: string;
  imageFile?: File | null;
}) {
  const description = input.description.trim();
  const websiteUrl = normalizeWebsiteUrl(input.url);

  if (!websiteUrl) {
    throw new Error("Add a valid website link before saving.");
  }

  if (!description) {
    throw new Error("Add a project description before saving.");
  }

  const uploadedImage =
    input.imageFile && input.imageFile.size > 0
      ? await uploadImage(input.imageFile, "project")
      : null;
  const image = uploadedImage || normalizeRemoteImageUrl(input.imageUrl ?? "");

  if (!image) {
    throw new Error("Upload a project image or paste a valid image URL.");
  }

  const current = await getPortfolioContent();
  const project: PortfolioProject = {
    id: crypto.randomUUID(),
    image,
    url: websiteUrl,
    description,
  };

  const content = await savePortfolioContent({
    ...current,
    projects: [project, ...current.projects],
  });

  return { content, project };
}

export async function removeProject(projectId: string) {
  const current = await getPortfolioContent();
  const target = current.projects.find((project) => project.id === projectId);

  if (!target) {
    throw new Error("That project could not be found.");
  }

  const content = await savePortfolioContent({
    ...current,
    projects: current.projects.filter((project) => project.id !== projectId),
  });

  await deleteManagedBlob(target.image, PROJECT_UPLOAD_PREFIX);

  return content;
}

export async function resetProjects() {
  const current = await getPortfolioContent();

  const content = await savePortfolioContent({
    ...current,
    projects: DEFAULT_PROJECTS,
  });

  await Promise.allSettled(
    current.projects.map((project) => deleteManagedBlob(project.image, PROJECT_UPLOAD_PREFIX)),
  );

  return content;
}

export async function updatePortrait(input: {
  imageUrl?: string;
  imageFile?: File | null;
}) {
  const current = await getPortfolioContent();
  const uploadedImage =
    input.imageFile && input.imageFile.size > 0
      ? await uploadImage(input.imageFile, "portrait")
      : null;
  const portraitImage = uploadedImage || normalizeRemoteImageUrl(input.imageUrl ?? "");

  if (!portraitImage) {
    throw new Error("Upload a portrait image or paste a valid image URL.");
  }

  const content = await savePortfolioContent({
    ...current,
    portraitImage,
  });

  if (current.portraitImage && current.portraitImage !== portraitImage) {
    await deleteManagedBlob(current.portraitImage, PORTRAIT_UPLOAD_PREFIX);
  }

  return content;
}

export async function clearPortrait() {
  const current = await getPortfolioContent();
  const content = await savePortfolioContent({
    ...current,
    portraitImage: null,
  });

  await deleteManagedBlob(current.portraitImage, PORTRAIT_UPLOAD_PREFIX);

  return content;
}
