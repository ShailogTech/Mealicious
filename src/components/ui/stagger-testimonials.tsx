"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { testimonials } from "@/lib/data";

// Duplicate testimonials to have 12 items so the wrapping point is far off-screen
const extendedTestimonials = [
  ...testimonials.map((t, idx) => ({ ...t, id: `${t.id}-0`, originalIndex: idx })),
  ...testimonials.map((t, idx) => ({ ...t, id: `${t.id}-1`, originalIndex: idx })),
  ...testimonials.map((t, idx) => ({ ...t, id: `${t.id}-2`, originalIndex: idx })),
];

export function StaggerTestimonials() {
  // Start the active index in the middle of the extended array for balanced layout on mount
  const [activeIndex, setActiveIndex] = useState(4);
  const [windowWidth, setWindowWidth] = useState(1024);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => setWindowWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
      const frame = requestAnimationFrame(() => {
        handleResize();
      });
      return () => {
        window.removeEventListener("resize", handleResize);
        cancelAnimationFrame(frame);
      };
    }
  }, []);

  const isMobile = windowWidth < 640;
  
  // Card dimensions and translation steps
  const cardWidth = isMobile ? 280 : 365;
  const cardHeight = isMobile ? 300 : 365;
  const step = isMobile ? 180 : 243.333;

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % extendedTestimonials.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + extendedTestimonials.length) % extendedTestimonials.length);
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto overflow-hidden bg-transparent py-10 flex flex-col items-center select-none">
      {/* Testimonials Slider Area */}
      <div 
        className="relative w-full flex items-center justify-center overflow-visible"
        style={{ height: `${cardHeight + 80}px` }}
      >
        {extendedTestimonials.map((t, i) => {
          // Shortest distance wrapping logic for infinite loop
          let relativeIndex = i - activeIndex;
          const half = extendedTestimonials.length / 2;
          if (relativeIndex > half) {
            relativeIndex -= extendedTestimonials.length;
          } else if (relativeIndex < -half) {
            relativeIndex += extendedTestimonials.length;
          }

          const isActive = i === activeIndex;

          // Compute absolute translations and rotations
          const xOffset = relativeIndex * step;
          const yOffset = isActive ? -35 : (relativeIndex % 2 === 0 ? -15 : 15);
          const rotateDeg = isActive ? 0 : (relativeIndex % 2 === 0 ? -2.5 : 2.5);
          const zIndex = isActive ? 30 : 20 - Math.abs(relativeIndex);

          // Optimize rendering: only render cards that are within view range to save DOM operations
          if (Math.abs(relativeIndex) > 3) return null;

          return (
            <motion.div
              key={t.id}
              onClick={() => setActiveIndex(i)}
              style={{
                clipPath: "polygon(50px 0%, calc(100% - 50px) 0%, 100% 50px, 100% 100%, calc(100% - 50px) 100%, 50px 100%, 0 100%, 0 0)",
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                zIndex,
              }}
              animate={{
                x: `calc(-50% + ${xOffset}px)`,
                y: `calc(-50% + ${yOffset}px)`,
                rotate: rotateDeg,
                scale: isActive ? 1.05 : 0.9,
              }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 25,
              }}
              className={`absolute left-1/2 top-1/2 cursor-pointer border-2 p-6 sm:p-8 transition-colors duration-500 flex flex-col justify-between ${
                isActive
                  ? "bg-orange-500 text-white border-orange-600 shadow-[0px_8px_0px_4px_#ea580c]"
                  : "bg-white text-orange-950 border-orange-400 hover:bg-orange-50/50 shadow-none"
              }`}
            >
              {/* Top Right Clipped Border Simulator in Orange */}
              <span 
                className={`absolute block origin-top-right rotate-45 ${
                  isActive ? "bg-orange-600" : "bg-orange-400"
                }`}
                style={{
                  right: "-2px",
                  top: "48px",
                  width: "70.71px",
                  height: "2px"
                }}
              />

              {/* Card Contents */}
              <div className="flex flex-col gap-4 text-left">
                {/* Photo / Avatar Box with neubrutalist orange border shadow offset */}
                <div 
                  className={`h-14 w-12 border-2 flex items-center justify-center font-black text-base shrink-0 select-none ${
                    isActive 
                      ? "bg-white text-orange-500 border-orange-600 shadow-[3px_3px_0px_white]" 
                      : "bg-orange-100 text-orange-600 border-orange-400 shadow-[3px_3px_0px_#f97316]"
                  }`}
                >
                  {t.avatar}
                </div>

                {/* Comment quote */}
                <h3 className={`font-serif leading-snug font-bold ${
                  isActive ? "text-white" : "text-orange-950"
                } ${
                  isMobile ? "text-sm line-clamp-5" : "text-lg md:text-xl line-clamp-5"
                }`}>
                  &ldquo;{t.comment}&rdquo;
                </h3>
              </div>

              {/* Bottom Profile info */}
              <div className="text-left">
                <p className="font-bold text-sm leading-none">{t.name}</p>
                <p className={`text-xs mt-1.5 font-medium leading-none ${isActive ? "text-orange-100" : "text-orange-600/80"}`}>
                  {t.location}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Navigation Buttons with Brand Orange Theme */}
      <div className="flex items-center gap-6 mt-6">
        <button
          onClick={handlePrev}
          className="grid h-14 w-14 place-content-center border-2 border-orange-500 bg-white hover:bg-orange-500 hover:text-white text-orange-500 transition-colors shadow-[3px_3px_0px_0px_#f97316] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={handleNext}
          className="grid h-14 w-14 place-content-center border-2 border-orange-500 bg-white hover:bg-orange-500 hover:text-white text-orange-500 transition-colors shadow-[3px_3px_0px_0px_#f97316] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
