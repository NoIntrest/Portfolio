"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import {
  ArrowLeft,
  ImagePlus,
  KeyRound,
  LogOut,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { FallingPattern } from "@/components/ui/falling-pattern";
import {
  getProjectLabel,
  type PortfolioContent,
  type PortfolioProject,
} from "@/lib/portfolio-data";

interface AdminSessionState {
  authenticated: boolean;
  configured: boolean;
  storageConfigured: boolean;
}

interface AdminPanelProps {
  initialContent: PortfolioContent;
  initialSession: AdminSessionState;
}

interface FormState {
  imageUrl: string;
  url: string;
  description: string;
}

const EMPTY_FORM: FormState = {
  imageUrl: "",
  url: "",
  description: "",
};

async function parseJsonResponse<T>(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;

  if (!response.ok) {
    const error = new Error(payload?.error ?? "Something went wrong.") as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }

  return payload as T;
}

export function AdminPanel({
  initialContent,
  initialSession,
}: AdminPanelProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<PortfolioProject[]>(
    initialContent.projects,
  );
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [projectImageFile, setProjectImageFile] = useState<File | null>(null);
  const [projectImagePreview, setProjectImagePreview] = useState("");
  const [savedPortraitImage, setSavedPortraitImage] = useState(
    initialContent.portraitImage ?? "",
  );
  const [portraitInput, setPortraitInput] = useState(
    initialContent.portraitImage ?? "",
  );
  const [portraitFile, setPortraitFile] = useState<File | null>(null);
  const [portraitPreview, setPortraitPreview] = useState(
    initialContent.portraitImage ?? "",
  );
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string>("");
  const [isBusy, setIsBusy] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(
    initialSession.authenticated,
  );
  const [isConfigured, setIsConfigured] = useState(initialSession.configured);
  const [storageConfigured, setStorageConfigured] = useState(
    initialSession.storageConfigured,
  );

  useEffect(() => {
    setProjects(initialContent.projects);
    setSavedPortraitImage(initialContent.portraitImage ?? "");
    setPortraitInput(initialContent.portraitImage ?? "");
    setPortraitPreview(initialContent.portraitImage ?? "");
  }, [initialContent]);

  useEffect(() => {
    setIsAuthenticated(initialSession.authenticated);
    setIsConfigured(initialSession.configured);
    setStorageConfigured(initialSession.storageConfigured);
  }, [initialSession]);

  useEffect(() => {
    return () => {
      if (projectImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(projectImagePreview);
      }
    };
  }, [projectImagePreview]);

  useEffect(() => {
    return () => {
      if (portraitPreview.startsWith("blob:")) {
        URL.revokeObjectURL(portraitPreview);
      }
    };
  }, [portraitPreview]);

  const resetStatus = (message: string) => {
    setStatus(message);
  };

  const handleRequestError = (error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Something went wrong.";
    const statusCode =
      error && typeof error === "object" && "status" in error
        ? Number((error as { status?: number }).status)
        : null;

    if (statusCode === 401) {
      setIsAuthenticated(false);
    }

    resetStatus(message);
  };

  const applyContent = (content: PortfolioContent) => {
    setProjects(content.projects);

    const nextPortraitImage = content.portraitImage ?? "";
    setSavedPortraitImage(nextPortraitImage);
    setPortraitInput(nextPortraitImage);
    setPortraitFile(null);
    setPortraitPreview(nextPortraitImage);
    router.refresh();
  };

  const handleFieldChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;

    if (name === "imageUrl") {
      setProjectImageFile(null);
      setProjectImagePreview("");
    }

    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleProjectImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setProjectImageFile(file);
    setForm((current) => ({ ...current, imageUrl: "" }));
    setProjectImagePreview(URL.createObjectURL(file));
    resetStatus("Image loaded. Save the entry when you are ready.");
  };

  const addProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAuthenticated || !storageConfigured) {
      return;
    }

    if ((!projectImageFile && !form.imageUrl.trim()) || !form.url || !form.description.trim()) {
      resetStatus("Add an image, website link, and description before saving.");
      return;
    }

    try {
      setIsBusy(true);
      resetStatus("Saving the project to shared storage...");

      const body = new FormData();
      body.set("url", form.url);
      body.set("description", form.description);

      if (projectImageFile) {
        body.set("imageFile", projectImageFile);
      } else {
        body.set("imageUrl", form.imageUrl);
      }

      const response = await fetch("/api/admin/projects", {
        method: "POST",
        body,
      });
      const payload = await parseJsonResponse<{
        content: PortfolioContent;
      }>(response);

      applyContent(payload.content);
      setForm(EMPTY_FORM);
      setProjectImageFile(null);
      setProjectImagePreview("");
      resetStatus("Project added to the shared portfolio.");
    } catch (error) {
      handleRequestError(error);
    } finally {
      setIsBusy(false);
    }
  };

  const handlePortraitUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setPortraitFile(file);
    setPortraitInput("");
    setPortraitPreview(URL.createObjectURL(file));
    resetStatus("Portrait loaded. Save it when you are ready.");
  };

  const savePortrait = async () => {
    if (!isAuthenticated || !storageConfigured) {
      return;
    }

    if (!portraitFile && !portraitInput.trim()) {
      resetStatus("Upload a portrait or paste an image URL before saving.");
      return;
    }

    try {
      setIsBusy(true);
      resetStatus("Updating the shared portrait...");

      const body = new FormData();

      if (portraitFile) {
        body.set("imageFile", portraitFile);
      } else {
        body.set("imageUrl", portraitInput);
      }

      const response = await fetch("/api/admin/portrait", {
        method: "PUT",
        body,
      });
      const payload = await parseJsonResponse<{
        content: PortfolioContent;
      }>(response);

      applyContent(payload.content);
      resetStatus("Portrait updated on the homepage.");
    } catch (error) {
      handleRequestError(error);
    } finally {
      setIsBusy(false);
    }
  };

  const removePortrait = async () => {
    if (!isAuthenticated || !storageConfigured) {
      return;
    }

    try {
      setIsBusy(true);
      resetStatus("Removing the portrait...");

      const response = await fetch("/api/admin/portrait", {
        method: "DELETE",
      });
      const payload = await parseJsonResponse<{
        content: PortfolioContent;
      }>(response);

      applyContent(payload.content);
      setPortraitInput("");
      setPortraitPreview("");
      resetStatus("Portrait removed. The placeholder is back.");
    } catch (error) {
      handleRequestError(error);
    } finally {
      setIsBusy(false);
    }
  };

  const removeProject = async (projectId: string) => {
    if (!isAuthenticated || !storageConfigured) {
      return;
    }

    try {
      setIsBusy(true);
      resetStatus("Removing the project...");

      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: "DELETE",
      });
      const payload = await parseJsonResponse<{
        content: PortfolioContent;
      }>(response);

      applyContent(payload.content);
      resetStatus("Project removed.");
    } catch (error) {
      handleRequestError(error);
    } finally {
      setIsBusy(false);
    }
  };

  const resetProjects = async () => {
    if (!isAuthenticated || !storageConfigured) {
      return;
    }

    try {
      setIsBusy(true);
      resetStatus("Restoring the sample showcase...");

      const response = await fetch("/api/admin/projects/reset", {
        method: "POST",
      });
      const payload = await parseJsonResponse<{
        content: PortfolioContent;
      }>(response);

      applyContent(payload.content);
      resetStatus("The sample showcase has been restored.");
    } catch (error) {
      handleRequestError(error);
    } finally {
      setIsBusy(false);
    }
  };

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!password.trim()) {
      resetStatus("Enter the admin password to continue.");
      return;
    }

    try {
      setIsBusy(true);
      resetStatus("Signing in...");

      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });
      const payload = await parseJsonResponse<AdminSessionState>(response);

      setIsAuthenticated(payload.authenticated);
      setIsConfigured(payload.configured);
      setStorageConfigured(payload.storageConfigured);
      setPassword("");
      router.refresh();

      if (payload.storageConfigured) {
        resetStatus("Host access granted. Shared editing is ready.");
      } else {
        resetStatus("Host access granted. Connect Vercel Blob to enable shared storage.");
      }
    } catch (error) {
      handleRequestError(error);
    } finally {
      setIsBusy(false);
    }
  };

  const logout = async () => {
    try {
      setIsBusy(true);
      await fetch("/api/admin/session", {
        method: "DELETE",
      });
      setIsAuthenticated(false);
      setPassword("");
      router.refresh();
      resetStatus("Host session closed.");
    } finally {
      setIsBusy(false);
    }
  };

  const canEdit = isAuthenticated && storageConfigured;
  const portraitDisplay = portraitPreview || savedPortraitImage || "/profile-placeholder.svg";
  const projectPreview = projectImagePreview || form.imageUrl;

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 opacity-65">
        <FallingPattern
          className="h-full w-full [mask-image:radial-gradient(circle_at_center,black,transparent_75%)]"
          color="oklch(0.74 0.13 67)"
          backgroundColor="transparent"
          duration={135}
          blurIntensity="0.9rem"
          density={1.05}
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,5,4,0.66),rgba(7,5,4,0.92))]" />

      <div className="relative mx-auto max-w-6xl px-6 py-8 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-full border border-white/8 bg-black/20 px-5 py-3 backdrop-blur-md">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-primary/80">
              Host editor
            </p>
            <p className="mt-1 text-xs text-white/60">
              Add portfolio image, link, and description from this panel
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="rounded-full">
              <Link href="/" prefetch={false}>
                <ArrowLeft className="h-4 w-4" />
                Back to site
              </Link>
            </Button>
            {isAuthenticated ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] border border-border/70 bg-card/60 p-8 backdrop-blur-md">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-primary/75">
              Access
            </p>
            <h1 className="mt-4 font-serif text-4xl text-foreground">
              Shared host login
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              This admin now writes to shared server storage so updates show up
              for everyone who visits the site. Sign in with the server-side
              admin password before you edit anything.
            </p>

            <div className="mt-8 rounded-[1.5rem] border border-border/70 bg-background/45 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-white/85">
                    Server configuration
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {!isConfigured
                      ? "Set ADMIN_PASSWORD in your environment to unlock this editor."
                      : !storageConfigured
                        ? "Admin auth is ready, but BLOB_READ_WRITE_TOKEN is still missing."
                        : "Admin auth and shared storage are both configured."}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {!isAuthenticated ? (
                <form className="space-y-3" onSubmit={login}>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-white/80">
                      Admin password
                    </span>
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your admin password"
                      className="w-full rounded-2xl border border-input bg-background/65 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
                      disabled={!isConfigured || isBusy}
                    />
                  </label>
                  <Button
                    type="submit"
                    disabled={!isConfigured || isBusy}
                    className="w-full rounded-full"
                  >
                    <KeyRound className="h-4 w-4" />
                    Sign in to edit
                  </Button>
                </form>
              ) : (
                <Button type="button" disabled className="w-full rounded-full">
                  <ShieldCheck className="h-4 w-4" />
                  Editor unlocked
                </Button>
              )}

              {isAuthenticated ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-full"
                  onClick={logout}
                  disabled={isBusy}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              ) : null}
            </div>

            {status ? (
              <p className="mt-6 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary/90">
                {status}
              </p>
            ) : null}
          </section>

          <section className="rounded-[2rem] border border-border/70 bg-card/60 p-8 backdrop-blur-md">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-primary/75">
                  Portfolio data
                </p>
                <h2 className="mt-4 font-serif text-3xl text-foreground">
                  Add and manage website entries
                </h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="rounded-full"
                onClick={resetProjects}
                disabled={!canEdit || isBusy}
              >
                Reset sample content
              </Button>
            </div>

            {!canEdit ? (
              <div className="mt-8 rounded-[1.5rem] border border-dashed border-border/70 bg-background/35 p-8 text-center">
                <ImagePlus className="mx-auto h-10 w-10 text-primary/70" />
                <p className="mt-4 text-lg font-medium text-white/85">
                  {isAuthenticated
                    ? "Finish your server setup to publish shared updates"
                    : "Sign in to add your work"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {isAuthenticated
                    ? "Connect Vercel Blob so images and portfolio data persist for every visitor."
                    : "Each entry stores an image, a website link, and a description."}
                </p>
              </div>
            ) : (
              <>
                <div className="mt-8 rounded-[1.5rem] border border-border/70 bg-background/35 p-5">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-primary/75">
                        Portrait
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Upload your profile image here and the hero section will
                        update instantly.
                      </p>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-white/8 bg-black/25">
                      <img
                        src={portraitDisplay}
                        alt="Portrait preview"
                        className="h-24 w-20 bg-black object-contain"
                      />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-white/80">
                        Upload portrait image
                      </span>
                      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-input bg-background/45 px-4 py-3">
                        <Upload className="h-4 w-4 text-primary" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePortraitUpload}
                          disabled={isBusy}
                          className="w-full text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
                        />
                      </div>
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-white/80">
                        Or paste a portrait URL
                      </span>
                      <input
                        type="url"
                        value={portraitFile ? "" : portraitInput}
                        onChange={(event) => {
                          setPortraitFile(null);
                          setPortraitInput(event.target.value);
                          setPortraitPreview(event.target.value.trim());
                        }}
                        placeholder="https://images.example.com/portrait.jpg"
                        className="w-full rounded-2xl border border-input bg-background/65 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
                        disabled={isBusy}
                      />
                    </label>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button
                      type="button"
                      className="rounded-full"
                      onClick={savePortrait}
                      disabled={isBusy}
                    >
                      Save portrait
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={removePortrait}
                      disabled={isBusy || (!savedPortraitImage && !portraitPreview)}
                    >
                      Remove portrait
                    </Button>
                  </div>
                </div>

                <form className="mt-8 space-y-5" onSubmit={addProject}>
                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-white/80">
                        Website link
                      </span>
                        <input
                          name="url"
                          type="url"
                          value={form.url}
                          onChange={handleFieldChange}
                          placeholder="https://your-site.com"
                          className="w-full rounded-2xl border border-input bg-background/65 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
                          disabled={isBusy}
                        />
                      </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-white/80">
                        Upload website image
                      </span>
                      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-input bg-background/45 px-4 py-3">
                        <Upload className="h-4 w-4 text-primary" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProjectImageUpload}
                          disabled={isBusy}
                          className="w-full text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
                        />
                      </div>
                    </label>
                  </div>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-white/80">
                      Or paste an image URL
                    </span>
                    <input
                      name="imageUrl"
                      type="url"
                      value={projectImageFile ? "" : form.imageUrl}
                      onChange={handleFieldChange}
                      placeholder="https://images.example.com/preview.jpg"
                      className="w-full rounded-2xl border border-input bg-background/65 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
                      disabled={isBusy}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-white/80">
                      Website description
                    </span>
                    <textarea
                      name="description"
                      rows={5}
                      value={form.description}
                      onChange={handleFieldChange}
                      placeholder="Describe the project, what it does, and why it matters."
                      className="w-full rounded-2xl border border-input bg-background/65 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
                      disabled={isBusy}
                    />
                  </label>

                  {projectPreview ? (
                    <div className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-background/35 p-3">
                      <img
                        src={projectPreview}
                        alt="Project preview"
                        className="aspect-[16/10] w-full rounded-[1.2rem] object-cover"
                      />
                    </div>
                  ) : null}

                  <Button
                    type="submit"
                    className="w-full rounded-full"
                    disabled={isBusy}
                  >
                    Save portfolio entry
                  </Button>
                </form>

                <div className="mt-8 space-y-4">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="grid gap-4 rounded-[1.5rem] border border-border/70 bg-background/35 p-4 md:grid-cols-[160px_1fr_auto]"
                    >
                      <div className="overflow-hidden rounded-2xl border border-white/6 bg-black/20">
                        <img
                          src={project.image}
                          alt={getProjectLabel(project.url)}
                          className="aspect-[4/3] h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-primary/75">
                          {getProjectLabel(project.url)}
                        </p>
                        <p className="mt-2 break-all text-sm text-white/75">
                          {project.url}
                        </p>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                          {project.description}
                        </p>
                      </div>
                      <div className="flex items-start justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          className="rounded-full"
                          disabled={isBusy}
                          onClick={() => removeProject(project.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
