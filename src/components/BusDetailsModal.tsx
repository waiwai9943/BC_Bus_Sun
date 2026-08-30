"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { BusData, SolarPosition, SeatRecommendation } from "@/types";
import { BusSeatIndicator } from "./BusSeatIndicator";
import { 
  BusIcon, 
  MapPinIcon, 
  ClockIcon, 
  SpeedometerIcon,
  ArrowUpIcon,
} from "./icons";

interface BusDetailsModalProps {
  bus: BusData;
  solarPosition: SolarPosition;
  seatRecommendation: SeatRecommendation;
  onClose: () => void;
}

export function BusDetailsModal({
  bus,
  solarPosition,
  seatRecommendation,
  onClose,
}: BusDetailsModalProps) {
  const [wantsSun, setWantsSun] = useState(false);

  const getDelayStatus = () => {
    if (bus.delay === 0) return { text: "On Time", color: "text-green-600" };
    if (bus.delay > 0) return { text: `${bus.delay} min late`, color: "text-red-600" };
    return { text: `${Math.abs(bus.delay)} min early`, color: "text-blue-600" };
  };

  const delayStatus = getDelayStatus();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-shade-800 rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-bus-primary to-bus-secondary p-6 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <span className="text-white text-xl">×</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <BusIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{bus.routeName}</h2>
              <p className="text-white/80">To: {bus.destination}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-shade-50 dark:bg-shade-700 rounded-xl p-4">
              <div className="flex items-center gap-2 text-shade-500 dark:text-shade-400 mb-1">
                <MapPinIcon className="w-4 h-4" />
                <span className="text-xs">Current Stop</span>
              </div>
              <p className="font-medium text-shade-800 dark:text-shade-100">
                {bus.currentStop}
              </p>
            </div>

            <div className="bg-shade-50 dark:bg-shade-700 rounded-xl p-4">
              <div className="flex items-center gap-2 text-shade-500 dark:text-shade-400 mb-1">
                <ArrowUpIcon className="w-4 h-4" />
                <span className="text-xs">Next Stop</span>
              </div>
              <p className="font-medium text-shade-800 dark:text-shade-100">
                {bus.nextStop}
              </p>
            </div>

            <div className="bg-shade-50 dark:bg-shade-700 rounded-xl p-4">
              <div className="flex items-center gap-2 text-shade-500 dark:text-shade-400 mb-1">
                <SpeedometerIcon className="w-4 h-4" />
                <span className="text-xs">Speed</span>
              </div>
              <p className="font-medium text-shade-800 dark:text-shade-100">
                {bus.speed} km/h
              </p>
            </div>

            <div className="bg-shade-50 dark:bg-shade-700 rounded-xl p-4">
              <div className="flex items-center gap-2 text-shade-500 dark:text-shade-400 mb-1">
                <ClockIcon className="w-4 h-4" />
                <span className="text-xs">Status</span>
              </div>
              <p className={clsx("font-medium", delayStatus.color)}>
                {delayStatus.text}
              </p>
            </div>
          </div>

          {/* Solar Position Info */}
          <div className="bg-gradient-to-br from-sun-50 to-sun-100 dark:from-sun-900/20 dark:to-sun-800/20 rounded-xl p-4">
            <h4 className="text-sm font-medium text-sun-800 dark:text-sun-200 mb-2">
              ☀️ Solar Position
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-shade-500">Azimuth:</span>
                <span className="ml-2 font-medium">{solarPosition.azimuth.toFixed(1)}°</span>
              </div>
              <div>
                <span className="text-shade-500">Elevation:</span>
                <span className="ml-2 font-medium">{solarPosition.elevation.toFixed(1)}°</span>
              </div>
              <div>
                <span className="text-shade-500">Heading:</span>
                <span className="ml-2 font-medium">{bus.heading.toFixed(1)}°</span>
              </div>
              <div>
                <span className="text-shade-500">Night:</span>
                <span className="ml-2 font-medium">{solarPosition.isNight ? "Yes" : "No"}</span>
              </div>
            </div>
          </div>

          {/* Seat Recommendation */}
          <BusSeatIndicator
            sunnySide={seatRecommendation.side === "either" ? "none" : seatRecommendation.side}
            shadedSide={seatRecommendation.side === "either" ? "none" : seatRecommendation.side === "left" ? "right" : seatRecommendation.side === "right" ? "left" : "none"}
            intensity={seatRecommendation.confidence}
            confidence={seatRecommendation.confidence}
            onWantsSunChange={setWantsSun}
            wantsSun={wantsSun}
            recommendation={seatRecommendation.reason}
          />

          {/* Passenger Load */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-shade-500">Passenger Load</span>
            <span
              className={clsx(
                "px-3 py-1 rounded-full text-sm font-medium",
                bus.passengerLoad === "empty" && "bg-green-100 text-green-700",
                bus.passengerLoad === "low" && "bg-green-50 text-green-600",
                bus.passengerLoad === "medium" && "bg-yellow-100 text-yellow-700",
                bus.passengerLoad === "high" && "bg-red-100 text-red-700"
              )}
            >
              {bus.passengerLoad.charAt(0).toUpperCase() + bus.passengerLoad.slice(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
