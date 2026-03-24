export interface PortfolioProject {
  id: string;
  image: string;
  url: string;
  description: string;
}

export const PROJECTS_STORAGE_KEY = "abhi-portfolio-projects";
export const PROJECTS_UPDATED_EVENT = "abhi-portfolio-projects-updated";
export const PASSKEY_STORAGE_KEY = "abhi-portfolio-passkey-id";
export const ADMIN_SESSION_KEY = "abhi-portfolio-admin-session";
export const PORTRAIT_IMAGE_PATH = "/profile-photo.jpg";

function buildPlaceholderImage(label: string, accent: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#17120f" />
          <stop offset="60%" stop-color="#241c16" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="720" rx="48" fill="url(#bg)" />
      <circle cx="950" cy="170" r="130" fill="#fde0ab" fill-opacity="0.45" />
      <rect x="120" y="140" width="620" height="420" rx="32" fill="#0e0a08" fill-opacity="0.72" stroke="#f7d7a2" stroke-opacity="0.18" />
      <rect x="160" y="190" width="420" height="22" rx="11" fill="#f7d7a2" fill-opacity="0.85" />
      <rect x="160" y="242" width="280" height="16" rx="8" fill="#f7d7a2" fill-opacity="0.45" />
      <rect x="160" y="284" width="520" height="12" rx="6" fill="#f7d7a2" fill-opacity="0.16" />
      <rect x="160" y="318" width="470" height="12" rx="6" fill="#f7d7a2" fill-opacity="0.16" />
      <rect x="160" y="352" width="360" height="12" rx="6" fill="#f7d7a2" fill-opacity="0.16" />
      <rect x="780" y="270" width="240" height="240" rx="42" fill="#0c0806" fill-opacity="0.48" stroke="#f7d7a2" stroke-opacity="0.2" />
      <text x="160" y="470" fill="#fff2d6" font-family="Avenir Next, Segoe UI, sans-serif" font-size="60" font-weight="700">${label}</text>
      <text x="160" y="530" fill="#f7d7a2" font-family="IBM Plex Mono, monospace" font-size="28">Editable project preview</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const DEFAULT_PROJECTS: PortfolioProject[] = [
  {
    id: "sample-studio",
    image: buildPlaceholderImage("Studio Launch", "#915b30"),
    url: "https://studio-launch.example",
    description:
      "A cinematic landing page for a product studio with layered gradients, bold typography, and fast-loading media blocks.",
  },
  {
    id: "sample-commerce",
    image: buildPlaceholderImage("Calm Commerce", "#7b4f2c"),
    url: "https://calm-commerce.example",
    description:
      "An editorial commerce experience focused on storytelling, tactile product detail, and smooth mobile navigation.",
  },
  {
    id: "sample-dashboard",
    image: buildPlaceholderImage("Signal Dashboard", "#5f6e7d"),
    url: "https://signal-dashboard.example",
    description:
      "A clean analytics dashboard with friendly onboarding, sharp hierarchy, and a restrained interaction system.",
  },
];

function isProject(value: unknown): value is PortfolioProject {
  if (!value || typeof value !== "object") {
    return false;
  }

  const project = value as Record<string, unknown>;

  return (
    typeof project.id === "string" &&
    typeof project.image === "string" &&
    typeof project.url === "string" &&
    typeof project.description === "string"
  );
}

export function getStoredProjects() {
  if (typeof window === "undefined") {
    return DEFAULT_PROJECTS;
  }

  const raw = window.localStorage.getItem(PROJECTS_STORAGE_KEY);

  if (!raw) {
    return DEFAULT_PROJECTS;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (Array.isArray(parsed)) {
      const projects = parsed.filter(isProject);
      return projects;
    }
  } catch {
    return DEFAULT_PROJECTS;
  }

  return DEFAULT_PROJECTS;
}

export function saveProjects(projects: PortfolioProject[]) {
  window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  window.dispatchEvent(new CustomEvent(PROJECTS_UPDATED_EVENT, { detail: projects }));
}

export function getProjectLabel(url: string) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return hostname || "Portfolio piece";
  } catch {
    return "Portfolio piece";
  }
}

export function getStoredPasskeyId() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(PASSKEY_STORAGE_KEY);
}

export function savePasskeyId(value: string) {
  window.localStorage.setItem(PASSKEY_STORAGE_KEY, value);
}

export function clearPasskeyId() {
  window.localStorage.removeItem(PASSKEY_STORAGE_KEY);
}

export function hasAdminSession() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "active";
}

export function setAdminSession(active: boolean) {
  if (active) {
    window.sessionStorage.setItem(ADMIN_SESSION_KEY, "active");
    return;
  }

  window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
}
