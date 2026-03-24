"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Globe2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import WheelPagination from "@/components/ui/wheel-pagination";
import { getProjectLabel, type PortfolioProject } from "@/lib/portfolio-storage";

interface ProjectShowcaseProps {
  projects: PortfolioProject[];
}

export function ProjectShowcase({ projects }: ProjectShowcaseProps) {
  const [activePage, setActivePage] = useState(0);

  useEffect(() => {
    setActivePage((page) => Math.min(page, Math.max(projects.length - 1, 0)));
  }, [projects.length]);

  if (!projects.length) {
    return (
      <div className="rounded-[2rem] border border-dashed border-border/70 bg-card/45 p-10 text-center">
        <p className="font-serif text-3xl text-foreground">No projects yet</p>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Open the admin page, register your passkey, and add a website image,
          link, and description. Your showcase will update here instantly.
        </p>
      </div>
    );
  }

  const project = projects[activePage] ?? projects[0];
  const visibleCount = Math.min(5, projects.length);

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <AnimatePresence mode="wait">
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/70 p-3 shadow-[0_28px_70px_-40px_rgba(0,0,0,0.85)]"
          >
            <div className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem]">
              <img
                src={project.image}
                alt={getProjectLabel(project.url)}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,7,5,0)_35%,rgba(10,7,5,0.18)_64%,rgba(10,7,5,0.84)_100%)]" />
              <div className="absolute inset-x-5 bottom-5 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 backdrop-blur-sm">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary/80">
                    Selected work
                  </p>
                  <p className="mt-1 text-sm text-white/75">
                    {activePage + 1} of {projects.length}
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10">
                  <Globe2 className="h-5 w-5 text-primary" />
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${project.id}-copy`}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex flex-col justify-between rounded-[2rem] border border-border/70 bg-card/68 p-8 backdrop-blur-md"
          >
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-primary/75">
                Project spotlight
              </p>
              <h3 className="mt-4 font-serif text-4xl text-foreground">
                {getProjectLabel(project.url)}
              </h3>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                {project.description}
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <div className="rounded-2xl border border-border/70 bg-background/40 px-4 py-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-primary/75">
                  Website link
                </p>
                <p className="mt-2 break-all text-sm text-white/75">
                  {project.url}
                </p>
              </div>

              <Button asChild size="lg" className="w-full justify-between rounded-full">
                <Link href={project.url} target="_blank" rel="noreferrer">
                  Visit live website
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-center">
        <WheelPagination
          totalPages={projects.length}
          visibleCount={visibleCount}
          onChange={setActivePage}
          className="bg-transparent"
        />
      </div>
    </div>
  );
}
