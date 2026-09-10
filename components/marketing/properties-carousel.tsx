"use client";

import { useEffect, useState, useRef } from "react";
import { PropertyCard } from "@/components/property/property-card";
import type { Property } from "@/types/property";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type PropertyCardData = Omit<Property, "units" | "images"> & {
  units?: Property["units"];
  images: Array<{ id: string; url: string; altText?: string | null }>;
};

interface PropertiesCarouselProps {
  properties: PropertyCardData[];
  autoplayInterval?: number;
}

export function PropertiesCarousel({ 
  properties, 
  autoplayInterval = 5000 
}: PropertiesCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(1);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const maxIndex = Math.max(0, properties.length - itemsPerView);
  const canScroll = properties.length > itemsPerView;

  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth >= 1024) {
        setItemsPerView(4);
      } else if (window.innerWidth >= 640) {
        setItemsPerView(2);
      } else {
        setItemsPerView(1);
      }
    };

    updateItemsPerView();
    window.addEventListener("resize", updateItemsPerView);
    return () => window.removeEventListener("resize", updateItemsPerView);
  }, []);

  useEffect(() => {
    setCurrentIndex((index) => Math.min(index, maxIndex));
  }, [maxIndex]);

  // Autoplay logic
  useEffect(() => {
    if (!isAutoplay || !canScroll) return;

    autoplayTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, autoplayInterval);

    return () => {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    };
  }, [isAutoplay, canScroll, maxIndex, autoplayInterval]);

  // Reset autoplay on manual interaction
  const handleManualScroll = (direction: "next" | "prev") => {
    if (direction === "next") {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    } else {
      setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
    }
    // Pause autoplay for 2 seconds after manual interaction
    setIsAutoplay(false);
    if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    
    setTimeout(() => setIsAutoplay(true), 2000);
  };

  // Handle mouse enter/leave
  const handleMouseEnter = () => setIsAutoplay(false);
  const handleMouseLeave = () => setIsAutoplay(true);

  return (
    <div 
      ref={containerRef}
      className="w-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative overflow-hidden">
        {/* Carousel container */}
        <div className="overflow-hidden rounded-[28px]">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{
              transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
            }}
          >
            {properties.map((property) => (
              <div
                key={property.id}
                className="flex w-full shrink-0 px-2 first:pl-0 last:pr-0 sm:w-1/2 sm:px-3 lg:w-1/4"
              >
                <PropertyCard property={property} />
              </div>
            ))}
          </div>
        </div>

        {/* Navigation buttons - only show if there are enough items */}
        {canScroll && (
          <>
            <button
              onClick={() => handleManualScroll("prev")}
              aria-label="Previous properties"
              className={cn(
                "absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full sm:left-0 sm:-translate-x-6",
                "bg-white shadow-lg transition-all duration-200 hover:bg-slate-50 hover:-translate-x-8 focus:outline-none focus:ring-2 focus:ring-brand/50"
              )}
            >
              <ChevronLeft className="h-5 w-5 text-brand" />
            </button>

            <button
              onClick={() => handleManualScroll("next")}
              aria-label="Next properties"
              className={cn(
                "absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full sm:right-0 sm:translate-x-6",
                "bg-white shadow-lg transition-all duration-200 hover:bg-slate-50 hover:translate-x-8 focus:outline-none focus:ring-2 focus:ring-brand/50"
              )}
            >
              <ChevronRight className="h-5 w-5 text-brand" />
            </button>
          </>
        )}
      </div>

      {/* Indicators */}
      {canScroll && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setIsAutoplay(false);
                setTimeout(() => setIsAutoplay(true), 2000);
              }}
              aria-label={`Go to slide ${index + 1}`}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentIndex
                  ? "w-8 bg-brand"
                  : "w-2 bg-slate-300 hover:bg-slate-400"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
