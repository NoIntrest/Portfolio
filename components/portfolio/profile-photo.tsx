"use client";

import { useEffect, useState } from "react";

import { PORTRAIT_IMAGE_PATHS } from "@/lib/portfolio-data";

const FALLBACK_PORTRAIT = "/profile-placeholder.svg";

interface ProfilePhotoProps {
  portraitImage?: string | null;
}

export function ProfilePhoto({ portraitImage = null }: ProfilePhotoProps) {
  const [source, setSource] = useState(FALLBACK_PORTRAIT);
  const [usingFallback, setUsingFallback] = useState(true);

  useEffect(() => {
    const candidates = portraitImage
      ? [portraitImage, ...PORTRAIT_IMAGE_PATHS]
      : [...PORTRAIT_IMAGE_PATHS];
    let cancelled = false;

    setSource(FALLBACK_PORTRAIT);
    setUsingFallback(true);

    const loadCandidate = (index: number) => {
      if (index >= candidates.length) {
        return;
      }

      const image = new window.Image();

      image.onload = () => {
        if (cancelled) {
          return;
        }

        setSource(candidates[index] ?? FALLBACK_PORTRAIT);
        setUsingFallback(false);
      };

      image.onerror = () => {
        if (cancelled) {
          return;
        }

        loadCandidate(index + 1);
      };

      image.src = candidates[index] ?? FALLBACK_PORTRAIT;
    };

    loadCandidate(0);

    return () => {
      cancelled = true;
    };
  }, [portraitImage]);

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/75 p-3 shadow-[0_30px_80px_-45px_rgba(0,0,0,0.85)] backdrop-blur-md">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.4rem] bg-black">
        <img
          src={source}
          alt="Profile portrait"
          className="h-full w-full object-contain"
          loading="eager"
          decoding="async"
        />
      </div>

      <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/10 bg-black/45 p-4 backdrop-blur-sm">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary/80">
          Profile Photo
        </p>
        {usingFallback ? (
          <p className="mt-2 text-xs text-white/55">
            Upload your portrait from the portfolio editor, or add it to{" "}
            <code>/public</code> as <code>profile-photo.jpg</code>,{" "}
            <code>profile-photo.png</code>, or <code>profile.jpg</code>.
          </p>
        ) : null}
      </div>
    </div>
  );
}
