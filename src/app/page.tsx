"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useBusData } from "@/hooks";
import { BusDetailsModal } from "@/components/BusDetailsModal";
import { SunIcon, BusIcon, MapPinIcon, ClockIcon } from "@/components/icons";
import type { BusData } from "@/types";
import { getSolarPosition, getSolarExposure, getSeatRecommendation } from "@/lib/solar/solarCalculator";

// Dynamic import for map to avoid SSR issues
const TransitMap = dynamic(() => import("@/components/TransitMap"), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-full flex items-center justify-center bg-shade-100 dark:bg-shade-900">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-bus-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-shade-500">Loading map...</p>
      </div>
    </div>
  ),
});

export default function HomePage() {
  const { data: buses, isLoading, error } = useBusData();
  const [selectedBus, setSelectedBus] = useState<BusData | null>(null);
  const [wantsSun, setWantsSun] = useState(false);

  const handleBusClick = (bus: BusData) => {
    setSelectedBus(bus);
  };

  const handleCloseModal = () => {
    setSelectedBus(null);
  };

  // Get solar analysis for selected bus
  const getSolarForBus = (bus: BusData) => {
    const position = getSolarPosition(bus.position, new Date());
    const exposure = getSolarExposure(position.azimuth, bus.heading, position.elevation);
    const recommendation = getSeatRecommendation(exposure, wantsSun);
    return { position, recommendation };
  };

  return (
    <main className="h-screen w-screen overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 bg-white/90 dark:bg-shade-800/90 backdrop-blur-sm border-b border-shade-200 dark:border-shade-700">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sun-400 to-sun-500 flex items-center justify-center">
              <SunIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-shade-800 dark:text-shade-100">
                BC Bus Solar Tracker
              </h1>
              <p className="text-xs text-shade-500">Real-time transit with sun analysis</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live indicator */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-sm text-shade-600 dark:text-shade-300">Live</span>
            </div>
          </div>
        </div>
      </header>

      {/* Map */}
      <div className="h-full w-full pt-16">
        <TransitMap
          buses={buses || []}
          isLoading={isLoading}
          onBusClick={handleBusClick}
          selectedBusId={selectedBus?.id}
        />
      </div>

      {/* Bus List Panel */}
      <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-10">
        <div className="bg-white/95 dark:bg-shade-800/95 backdrop-blur-sm rounded-2xl shadow-xl border border-shade-200 dark:border-shade-700 max-h-64 overflow-y-auto">
          <div className="p-3 border-b border-shade-200 dark:border-shade-700 sticky top-0 bg-white/95 dark:bg-shade-800/95">
            <h2 className="font-semibold text-shade-800 dark:text-shade-100 flex items-center gap-2">
              <BusIcon className="w-4 h-4" />
              Active Buses ({buses?.length || 0})
            </h2>
          </div>
          
          <div className="p-2 space-y-1">
            {buses?.map((bus) => (
              <button
                key={bus.id}
                onClick={() => handleBusClick(bus)}
                className={`w-full text-left p-3 rounded-xl transition-all ${
                  selectedBus?.id === bus.id
                    ? "bg-bus-primary/10 border border-bus-primary/30"
                    : "hover:bg-shade-50 dark:hover:bg-shade-700/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-shade-800 dark:text-shade-100">
                      {bus.routeName}
                    </span>
                    <p className="text-xs text-shade-500">To {bus.destination}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-medium ${
                        bus.delay > 0 ? "text-red-500" : bus.delay < 0 ? "text-blue-500" : "text-green-500"
                      }`}
                    >
                      {bus.delay === 0 ? "On Time" : `${Math.abs(bus.delay)} min ${bus.delay > 0 ? "late" : "early"}`}
                    </span>
                    <p className="text-xs text-shade-400">{bus.speed} km/h</p>
                  </div>
                </div>
              </button>
            ))}
            
            {isLoading && (
              <div className="p-4 text-center text-shade-400">
                <div className="w-5 h-5 border-2 border-bus-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm">Updating...</p>
              </div>
            )}

            {error && (
              <div className="p-4 text-center text-red-500">
                <p>Error loading bus data</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bus Details Modal */}
      {selectedBus && (
        <BusDetailsModal
          bus={selectedBus}
          solarPosition={getSolarForBus(selectedBus).position}
          seatRecommendation={getSolarForBus(selectedBus).recommendation}
          onClose={handleCloseModal}
        />
      )}
    </main>
  );
}
