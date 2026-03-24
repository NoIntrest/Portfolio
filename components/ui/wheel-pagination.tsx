"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WheelPaginationProps {
  totalPages?: number;
  className?: string;
  visibleCount?: number;
  onChange?: (page: number) => void;
}

export default function WheelPagination({
  totalPages = 50,
  visibleCount = 5,
  className,
  onChange,
}: WheelPaginationProps) {
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActive((current) => Math.min(current, Math.max(totalPages - 1, 0)));
  }, [totalPages]);

  useEffect(() => {
    if (onChange) {
      onChange(active);
    }
  }, [active, onChange]);

  const prevPage = () => setActive((page) => Math.max(page - 1, 0));
  const nextPage = () => setActive((page) => Math.min(page + 1, totalPages - 1));

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (event.deltaY < 0) {
        setActive((page) => Math.max(page - 1, 0));
      } else if (event.deltaY > 0) {
        setActive((page) => Math.min(page + 1, totalPages - 1));
      }
    };

    element.addEventListener("wheel", handleWheel, { passive: false });

    return () => element.removeEventListener("wheel", handleWheel);
  }, [totalPages]);

  const getVisiblePages = () => {
    const pages: number[] = [];
    const half = Math.floor(visibleCount / 2);
    let start = active - half;
    let end = active + half;

    if (start < 0) {
      end += -start;
      start = 0;
    }

    if (end > totalPages - 1) {
      start -= end - (totalPages - 1);
      end = totalPages - 1;
      if (start < 0) {
        start = 0;
      }
    }

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex items-center gap-2 rounded-full border border-border/70 bg-card/60 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur-sm select-none",
        className,
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={prevPage}
        disabled={active === 0}
        aria-label="Previous page"
        className="text-gray-400 transition-colors hover:text-primary disabled:opacity-40"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <div className="flex gap-2">
        {visiblePages.map((page) => (
          <motion.div
            key={page}
            layout
            animate={{ scale: active === page ? 1.3 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={cn(
              "flex h-10 min-h-[40px] w-10 items-center justify-center rounded-full font-medium",
              active === page
                ? "border border-primary bg-primary text-primary-foreground"
                : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
            )}
            onClick={() => setActive(page)}
            role="button"
            tabIndex={0}
            aria-current={active === page ? "page" : undefined}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setActive(page);
              }
            }}
          >
            {page + 1}
          </motion.div>
        ))}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={nextPage}
        disabled={active === totalPages - 1}
        aria-label="Next page"
        className="text-gray-400 transition-colors hover:text-primary disabled:opacity-40"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
