"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowDownRight, LockKeyhole, Sparkles } from "lucide-react";

import { ProfilePhoto } from "@/components/portfolio/profile-photo";
import { ProjectShowcase } from "@/components/portfolio/project-showcase";
import { Button } from "@/components/ui/button";
import { FallingPattern } from "@/components/ui/falling-pattern";
import {
  DEFAULT_PORTFOLIO_CONTENT,
  normalizePortfolioContent,
  type PortfolioContent,
} from "@/lib/portfolio-data";

interface PortfolioHomeProps {
  initialContent: PortfolioContent;
}

export function PortfolioHome({ initialContent }: PortfolioHomeProps) {
  const [content, setContent] = useState<PortfolioContent>(initialContent);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  useEffect(() => {
    let active = true;

    const syncPortfolio = async () => {
      try {
        const response = await fetch("/api/portfolio", { cache: "no-store" });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { content?: unknown };

        if (active && payload.content) {
          setContent(normalizePortfolioContent(payload.content));
        }
      } catch {
        // Use the server-rendered content if the refresh request fails.
      }
    };

    void syncPortfolio();

    return () => {
      active = false;
    };
  }, []);

  const projects = content.projects.length
    ? content.projects
    : DEFAULT_PORTFOLIO_CONTENT.projects;

  return (
    <main className="overflow-x-hidden">
      <section className="relative isolate min-h-screen overflow-hidden">
        <div className="absolute inset-0 opacity-70">
          <FallingPattern
            className="h-full w-full [mask-image:radial-gradient(ellipse_at_center,black,transparent_76%)]"
            color="oklch(0.74 0.13 67)"
            backgroundColor="transparent"
            duration={120}
            blurIntensity="0.8rem"
            density={1.15}
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(245,197,120,0.22),transparent_22%),linear-gradient(180deg,rgba(7,5,4,0.12),rgba(7,5,4,0.78))]" />

        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 lg:px-10">
          <header className="flex items-center justify-between gap-4 rounded-full border border-white/8 bg-black/20 px-5 py-3 backdrop-blur-md">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-primary/80">
                Abhi Portfolio
              </p>
              <p className="mt-1 text-xs text-white/60">
                Motion-first showcase with host controls
              </p>
            </div>

            <nav className="flex items-center gap-2">
              <Button asChild variant="ghost" className="rounded-full">
                <a href="#projects">Projects</a>
              </Button>
              <Button asChild className="rounded-full">
                <Link href="/admin" prefetch={false}>
                  Host login
                </Link>
              </Button>
            </nav>
          </header>

          <div className="grid flex-1 items-center gap-14 py-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-xs text-primary/90">
                <Sparkles className="h-4 w-4" />
                Web and mobile developer
              </div>

              <h1 className="mt-8 max-w-4xl font-serif text-5xl leading-none tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                Building real-world applications from the ground up.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-white/70">
                I&apos;m a developer who enjoys building real-world applications
                from the ground up. I work across web and mobile technologies,
                creating products that are functional, clean, and user-focused.
                From developing a gym management system to working on finance
                tracking tools, I focus on solving practical problems and
                continuously improving my skills through hands-on projects.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Button asChild size="lg" className="rounded-full">
                  <a href="#projects">
                    Explore work
                    <ArrowDownRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full">
                  <Link href="/admin" prefetch={false}>
                    Open host editor
                    <LockKeyhole className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.5rem] border border-border/70 bg-card/55 p-4 backdrop-blur-sm">
                  <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-primary/75">
                    Live projects
                  </p>
                  <p className="mt-3 text-3xl font-semibold">{projects.length}</p>
                </div>
                <div className="rounded-[1.5rem] border border-border/70 bg-card/55 p-4 backdrop-blur-sm">
                  <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-primary/75">
                    Auth mode
                  </p>
                  <p className="mt-3 text-lg font-medium text-white/80">
                    Server-backed
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-border/70 bg-card/55 p-4 backdrop-blur-sm">
                  <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-primary/75">
                    Visual system
                  </p>
                  <p className="mt-3 text-lg font-medium text-white/80">
                    Motion + mood
                  </p>
                </div>
              </div>
            </div>

            <ProfilePhoto portraitImage={content.portraitImage} />
          </div>
        </div>
      </section>

      <section id="projects" className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
        <div className="mb-12 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary/75">
              Portfolio reel
            </p>
            <h2 className="mt-4 font-serif text-4xl text-foreground sm:text-5xl">
              Browse each site through the wheel controller
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-muted-foreground">
            Scroll the pagination, tap the dots, or update entries in the host
            panel. Every card uses the same three editable fields: image, web
            link, and description.
          </p>
        </div>

        <ProjectShowcase projects={projects} />
      </section>
    </main>
  );
}
