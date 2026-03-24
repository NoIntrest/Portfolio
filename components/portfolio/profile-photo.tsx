"use client";

import { useState } from "react";

import { PORTRAIT_IMAGE_PATH } from "@/lib/portfolio-storage";

const FALLBACK_PORTRAIT = "/profile-placeholder.svg";

export function ProfilePhoto() {
  const [source, setSource] = useState(PORTRAIT_IMAGE_PATH);
  const [usingFallback, setUsingFallback] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/75 p-3 shadow-[0_30px_80px_-45px_rgba(0,0,0,0.85)] backdrop-blur-md">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.4rem]">
        <img
          src={source}
          alt="Profile portrait"
          className="h-full w-full object-cover"
          onError={() => {
            setSource(FALLBACK_PORTRAIT);
            setUsingFallback(true);
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,4,3,0)_15%,rgba(6,4,3,0.26)_62%,rgba(6,4,3,0.82)_100%)]" />
        <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_center,rgba(250,213,157,0.42),transparent_68%)]" />
      </div>

      <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/10 bg-black/45 p-4 backdrop-blur-sm">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary/80">
          Backlit Portrait
        </p>
        <p className="mt-2 text-sm text-white/80">
          Warm, cinematic lighting sets the tone for the portfolio.
        </p>
        {usingFallback ? (
          <p className="mt-3 text-xs text-white/55">
            Add your provided photo as <code>/public/profile-photo.jpg</code> to
            replace the placeholder automatically.
          </p>
        ) : null}
      </div>
    </div>
  );
}
