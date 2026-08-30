"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { SunIcon, MoonIcon } from "./icons";

interface BusSeatIndicatorProps {
  sunnySide: "left" | "right" | "none";
  shadedSide: "left" | "right" | "none";
  intensity: number;
  confidence: number;
  onWantsSunChange: (wantsSun: boolean) => void;
  wantsSun: boolean;
  recommendation: string;
}

export function BusSeatIndicator({
  sunnySide,
  shadedSide,
  intensity,
  confidence,
  onWantsSunChange,
  wantsSun,
  recommendation,
}: BusSeatIndicatorProps) {
  const getSideClass = (side: "left" | "right") => {
    const isSunny = sunnySide === side;
    const isShaded = shadedSide === side;

    if (isSunny && intensity > 0.2) {
      return clsx(
        "relative overflow-hidden rounded-xl transition-all duration-500",
        "bg-gradient-to-b from-sun-200 to-sun-400",
        "shadow-[0_0_30px_rgba(251,191,36,0.6)] animate-pulse-sun"
      );
    }
    
    if (isShaded) {
      return clsx(
        "relative overflow-hidden rounded-xl transition-all duration-500",
        "bg-gradient-to-b from-shade-300 to-shade-500"
      );
    }

    return clsx(
      "relative overflow-hidden rounded-xl transition-all duration-500",
      "bg-gradient-to-b from-shade-100 to-shade-200"
    );
  };

  const getLabelClass = (side: "left" | "right") => {
    const isSunny = sunnySide === side && intensity > 0.2;
    const isShaded = shadedSide === side;

    if (isSunny) return "text-sun-900 font-bold";
    if (isShaded) return "text-shade-700 font-medium";
    return "text-shade-500";
  };

  return (
    <div className="bg-white dark:bg-shade-800 rounded-2xl p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-shade-800 dark:text-shade-100">
          Seat Recommendation
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-shade-500">Shade</span>
          <button
            onClick={() => onWantsSunChange(!wantsSun)}
            className={clsx(
              "relative w-14 h-7 rounded-full transition-all duration-300",
              wantsSun 
                ? "bg-sun-400" 
                : "bg-shade-300"
            )}
            aria-label={wantsSun ? "Switch to shade preference" : "Switch to sun preference"}
          >
            <span
              className={clsx(
                "absolute top-1 w-5 h-5 rounded-full bg-white shadow-md",
                "transition-all duration-300 flex items-center justify-center",
                wantsSun ? "left-8" : "left-1"
              )}
            >
              {wantsSun ? (
                <SunIcon className="w-3 h-3 text-sun-500" />
              ) : (
                <MoonIcon className="w-3 h-3 text-shade-500" />
              )}
            </span>
          </button>
          <span className="text-sm text-shade-500">Sun</span>
        </div>
      </div>

      {/* Bus Visualization */}
      <div className="relative flex flex-col items-center gap-4">
        {/* Bus Front Indicator */}
        <div className="flex items-center gap-2 text-shade-500 text-xs">
          <span>▲</span>
          <span>Bus Direction</span>
        </div>

        {/* Seats Row */}
        <div className="flex gap-4 w-full justify-center">
          {/* Left Side */}
          <div className="flex flex-col items-center gap-2 w-24">
            <div className={clsx("w-full h-28 flex items-center justify-center", getSideClass("left"))}>
              <div className="text-center">
                <span className={clsx("text-2xl", getLabelClass("left"))}>🪟</span>
                <p className={clsx("text-xs mt-1", getLabelClass("left"))}>
                  {sunnySide === "left" && intensity > 0.2 ? "☀️" : shadedSide === "left" ? "🌳" : ""}
                </p>
              </div>
            </div>
            <span className={clsx("text-sm font-medium", getLabelClass("left"))}>
              LEFT
            </span>
          </div>

          {/* Aisle */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-8 h-28 bg-shade-200 dark:bg-shade-600 rounded-lg flex items-center justify-center">
              <span className="text-shade-400 text-xs rotate-90">AISLE</span>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex flex-col items-center gap-2 w-24">
            <div className={clsx("w-full h-28 flex items-center justify-center", getSideClass("right"))}>
              <div className="text-center">
                <span className={clsx("text-2xl", getLabelClass("right"))}>🪟</span>
                <p className={clsx("text-xs mt-1", getLabelClass("right"))}>
                  {sunnySide === "right" && intensity > 0.2 ? "☀️" : shadedSide === "right" ? "🌳" : ""}
                </p>
              </div>
            </div>
            <span className={clsx("text-sm font-medium", getLabelClass("right"))}>
              RIGHT
            </span>
          </div>
        </div>

        {/* Recommendation */}
        <div className="mt-4 text-center">
          <div className={clsx(
            "inline-flex items-center gap-2 px-4 py-2 rounded-full",
            wantsSun 
              ? "bg-sun-100 text-sun-800 dark:bg-sun-900/30 dark:text-sun-300"
              : "bg-shade-100 text-shade-700 dark:bg-shade-700 dark:text-shade-200"
          )}>
            <span className="text-lg">
              {wantsSun 
                ? (sunnySide === "left" ? "←" : sunnySide === "right" ? "→" : "↔")
                : (shadedSide === "left" ? "←" : shadedSide === "right" ? "→" : "↔")
              }
            </span>
            <span className="font-medium">
              {wantsSun
                ? sunnySide === "left" || sunnySide === "right"
                  ? `Sit on the ${sunnySide.toUpperCase()} side`
                  : "Either side works"
                : shadedSide === "left" || shadedSide === "right"
                  ? `Sit on the ${shadedSide.toUpperCase()} side`
                  : "Either side works"
              }
            </span>
          </div>
          <p className="text-sm text-shade-500 mt-2">{recommendation}</p>
        </div>

        {/* Confidence Indicator */}
        <div className="w-full mt-4">
          <div className="flex justify-between text-xs text-shade-500 mb-1">
            <span>Confidence</span>
            <span>{Math.round(confidence * 100)}%</span>
          </div>
          <div className="h-2 bg-shade-200 dark:bg-shade-600 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-sun-400 to-sun-500 transition-all duration-500"
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
