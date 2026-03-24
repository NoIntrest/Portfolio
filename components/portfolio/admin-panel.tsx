"use client";

import Link from "next/link";
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
  DEFAULT_PROJECTS,
  clearPasskeyId,
  getProjectLabel,
  getStoredPasskeyId,
  getStoredProjects,
  hasAdminSession,
  savePasskeyId,
  saveProjects,
  setAdminSession,
  type PortfolioProject,
} from "@/lib/portfolio-storage";

interface FormState {
  image: string;
  url: string;
  description: string;
}

const EMPTY_FORM: FormState = {
  image: "",
  url: "",
  description: "",
};

function arrayBufferToBase64Url(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return window
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlToArrayBuffer(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = window.atob(normalized + padding);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return bytes.buffer;
}

function createChallenge() {
  return crypto.getRandomValues(new Uint8Array(32));
}

export function AdminPanel() {
  const [projects, setProjects] = useState<PortfolioProject[]>(DEFAULT_PROJECTS);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [status, setStatus] = useState<string>("");
  const [isBusy, setIsBusy] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasPasskey, setHasPasskey] = useState(false);
  const [supportsPasskeys, setSupportsPasskeys] = useState(false);

  useEffect(() => {
    setProjects(getStoredProjects());
    setHasPasskey(Boolean(getStoredPasskeyId()));
    setIsAuthenticated(hasAdminSession());
    setSupportsPasskeys(
      typeof window !== "undefined" &&
        "PublicKeyCredential" in window &&
        typeof navigator.credentials?.create === "function" &&
        typeof navigator.credentials?.get === "function",
    );
  }, []);

  const resetStatus = (message: string) => {
    setStatus(message);
  };

  const registerPasskey = async () => {
    if (!supportsPasskeys) {
      resetStatus("Passkeys are only available on https or localhost in supported browsers.");
      return;
    }

    try {
      setIsBusy(true);
      resetStatus("Creating your host passkey...");

      const userId = crypto.getRandomValues(new Uint8Array(16));
      const challenge = createChallenge();

      const credential = (await navigator.credentials.create({
        publicKey: {
          rp: {
            name: "Abhi Portfolio Host",
          },
          user: {
            id: userId,
            name: "host@portfolio.local",
            displayName: "Portfolio Host",
          },
          challenge,
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },
            { type: "public-key", alg: -257 },
          ],
          timeout: 60_000,
          attestation: "none",
          authenticatorSelection: {
            residentKey: "preferred",
            userVerification: "preferred",
          },
        },
      })) as PublicKeyCredential | null;

      if (!credential) {
        throw new Error("Passkey creation was cancelled.");
      }

      savePasskeyId(arrayBufferToBase64Url(credential.rawId));
      setAdminSession(true);
      setHasPasskey(true);
      setIsAuthenticated(true);
      resetStatus("Passkey created. Your host editor is unlocked on this device.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create a passkey.";
      resetStatus(message);
    } finally {
      setIsBusy(false);
    }
  };

  const unlockWithPasskey = async () => {
    const passkeyId = getStoredPasskeyId();

    if (!passkeyId) {
      resetStatus("Create a host passkey first.");
      return;
    }

    try {
      setIsBusy(true);
      resetStatus("Waiting for passkey verification...");

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: createChallenge(),
          timeout: 60_000,
          userVerification: "preferred",
          allowCredentials: [
            {
              id: base64UrlToArrayBuffer(passkeyId),
              type: "public-key",
            },
          ],
        },
      });

      if (!credential) {
        throw new Error("Passkey verification was cancelled.");
      }

      setAdminSession(true);
      setIsAuthenticated(true);
      resetStatus("Host access granted.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to verify your passkey.";
      resetStatus(message);
    } finally {
      setIsBusy(false);
    }
  };

  const logout = () => {
    setAdminSession(false);
    setIsAuthenticated(false);
    resetStatus("Host session closed.");
  };

  const handleFieldChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const image = typeof reader.result === "string" ? reader.result : "";
      setForm((current) => ({ ...current, image }));
      resetStatus("Image loaded. Save the entry when you are ready.");
    };
    reader.readAsDataURL(file);
  };

  const addProject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.image || !form.url || !form.description.trim()) {
      resetStatus("Add an image, website link, and description before saving.");
      return;
    }

    let normalizedUrl = form.url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    const nextProjects: PortfolioProject[] = [
      {
        id: crypto.randomUUID(),
        image: form.image,
        url: normalizedUrl,
        description: form.description.trim(),
      },
      ...projects,
    ];

    saveProjects(nextProjects);
    setProjects(nextProjects);
    setForm(EMPTY_FORM);
    resetStatus("Project added to the portfolio.");
  };

  const removeProject = (projectId: string) => {
    const nextProjects = projects.filter((project) => project.id !== projectId);
    saveProjects(nextProjects);
    setProjects(nextProjects);
    resetStatus("Project removed.");
  };

  const resetProjects = () => {
    saveProjects(DEFAULT_PROJECTS);
    setProjects(DEFAULT_PROJECTS);
    resetStatus("The sample showcase has been restored.");
  };

  const resetPasskey = () => {
    clearPasskeyId();
    setAdminSession(false);
    setHasPasskey(false);
    setIsAuthenticated(false);
    resetStatus("Stored passkey removed from this browser.");
  };

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
              <Link href="/">
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
              Passkey-based host login
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              This editor uses WebAuthn in the browser so you can protect the
              host controls with a passkey on localhost or a secure deployed
              origin. For a fully production-hardened flow, pair this UI with a
              backend that verifies WebAuthn signatures server-side.
            </p>

            <div className="mt-8 rounded-[1.5rem] border border-border/70 bg-background/45 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-white/85">
                    Browser support
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {supportsPasskeys
                      ? "Passkey APIs are available in this browser."
                      : "Passkeys are unavailable here. Use https or localhost in a modern browser."}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {!hasPasskey ? (
                <Button
                  type="button"
                  onClick={registerPasskey}
                  disabled={isBusy || !supportsPasskeys}
                  className="w-full rounded-full"
                >
                  <KeyRound className="h-4 w-4" />
                  Create host passkey
                </Button>
              ) : !isAuthenticated ? (
                <Button
                  type="button"
                  onClick={unlockWithPasskey}
                  disabled={isBusy || !supportsPasskeys}
                  className="w-full rounded-full"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Unlock editor with passkey
                </Button>
              ) : (
                <Button type="button" disabled className="w-full rounded-full">
                  <ShieldCheck className="h-4 w-4" />
                  Editor unlocked
                </Button>
              )}

              {hasPasskey ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-full"
                  onClick={resetPasskey}
                >
                  Reset stored passkey
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
                disabled={!isAuthenticated}
              >
                Reset sample content
              </Button>
            </div>

            {!isAuthenticated ? (
              <div className="mt-8 rounded-[1.5rem] border border-dashed border-border/70 bg-background/35 p-8 text-center">
                <ImagePlus className="mx-auto h-10 w-10 text-primary/70" />
                <p className="mt-4 text-lg font-medium text-white/85">
                  Unlock the editor to add your work
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Each entry stores an image, a website link, and a description.
                </p>
              </div>
            ) : (
              <>
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
                          onChange={handleImageUpload}
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
                      name="image"
                      type="url"
                      value={form.image.startsWith("data:") ? "" : form.image}
                      onChange={handleFieldChange}
                      placeholder="https://images.example.com/preview.jpg"
                      className="w-full rounded-2xl border border-input bg-background/65 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
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
                    />
                  </label>

                  <Button type="submit" className="w-full rounded-full">
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
