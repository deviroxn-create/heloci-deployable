"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { LandingImage } from "@/lib/landing-images";

type HeroCrossfadeProps = {
  images: readonly LandingImage[];
};

export function HeroCrossfade({ images }: HeroCrossfadeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedSources, setFailedSources] = useState<Set<string>>(new Set());
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (reducedMotion || images.length < 2) return;

    const interval = window.setInterval(() => {
      setCurrentIndex((index) => (index + 1) % images.length);
    }, 6000);

    return () => window.clearInterval(interval);
  }, [images.length, reducedMotion]);

  const currentImage = images[currentIndex];
  const imageFailed = currentImage ? failedSources.has(currentImage.src) : true;

  const handleImageError = () => {
    if (!currentImage) return;
    setFailedSources((sources) => new Set(sources).add(currentImage.src));
    if (images.length > 1) {
      setCurrentIndex((index) => (index + 1) % images.length);
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE]">
      {!imageFailed && currentImage ? (
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            key={currentImage.src}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <Image
              src={currentImage.src}
              alt={currentImage.alt}
              fill
              priority={currentIndex === 0}
              sizes="(max-width: 768px) 100vw, 58vw"
              className="object-cover"
              onError={handleImageError}
            />
          </motion.div>
        </AnimatePresence>
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-950/35 to-slate-950/10" aria-hidden="true" />
    </div>
  );
}
