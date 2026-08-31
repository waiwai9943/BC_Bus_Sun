"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useBusData } from "@/hooks";
import { useUserLocation, calculateDistance, formatDistance } from "@/hooks/useUserLocation";
import { BusDetailsModal } from "@/components/BusDetailsModal";
import { SunIcon, BusIcon, MapPinIcon, SearchIcon, CrosshairIcon, XIcon } from "@/components/icons";
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

type ViewMode = "all" | "nearby" | "search";

export default function HomePage() {
  const { data: buses, isLoading, error } = useBusData();
  const { location: userLocation, error: locationError, isLocating, getCurrentLocation, clearLocation } = useUserLocation();
  
  const [selectedBus, setSelectedBus] = useState<BusData | null>(null);
  const [wantsSun, setWantsSun] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("all");

  const handleBusClick = (bus: BusData) => {
    setSelectedBus(bus);
  };

  const handleCloseModal = () => {
    setSelectedBus(null);
  };

  const handleFindNearby = () => {
    if (!userLocation) {
      getCurrentLocation();
    }
    setViewMode("nearby");
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setViewMode("search");
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setViewMode("all");
  };

  const handleUseLocation = () => {
    if (userLocation) {
      clearLocation();
    } else {
      getCurrentLocation();
    }
  };

  // Get solar analysis for selected bus
  const getSolarForBus = (bus: BusData) => {
    const position = getSolarPosition(bus.position, new Date());
    const exposure = getSolarExposure(position.azimuth, bus.heading, position.elevation);
    const recommendation = getSeatRecommendation(exposure, wantsSun);
    return { position, recommendation };
  };

  // Filter and sort buses based on view mode
  const filteredBuses = useMemo(() => {
    if (!buses) return [];

    let result = [...buses];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (bus) =>
          bus.routeName.toLowerCase().includes(query) ||
          bus.destination.toLowerCase().includes(query) ||
          bus.routeId.toLowerCase().includes(query)
      );
    }

    // Sort by distance if viewing nearby
    if (viewMode === "nearby" && userLocation) {
      result = result
        .map((bus) => ({
          ...bus,
          distance: calculateDistance(userLocation, bus.position),
        }))
        .sort((a, b) => a.distance - b.distance);
    }

    return result;
  }, [buses, searchQuery, viewMode, userLocation]);

  return (
    <main className="h-screen w-screen overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 bg-white/95 dark:bg-shade-800/95 backdrop-blur-sm border-b border-shade-200 dark:border-shade-700">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
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

            <div className="flex items-center gap-3">
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

          {/* Search and Filter Bar */}
          <div className="flex gap-2">
            {/* Search Input */}
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-shade-400" />
              <input
                type="text"
                placeholder="Search route or destination..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-10 pr-10 py-2 rounded-xl border border-shade-200 dark:border-shade-600 bg-white dark:bg-shade-700 text-shade-800 dark:text-shade-100 placeholder-shade-400 focus:outline-none focus:ring-2 focus:ring-bus-primary/50"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-shade-100 dark:hover:bg-shade-600 rounded"
                >
                  <XIcon className="w-4 h-4 text-shade-400" />
                </button>
              )}
            </div>

            {/* Location Button */}
            <button
              onClick={handleUseLocation}
              disabled={isLocating}
              className={`px-3 py-2 rounded-xl border transition-all ${
                userLocation
                  ? "bg-bus-primary text-white border-bus-primary"
                  : "bg-white dark:bg-shade-700 border-shade-200 dark:border-shade-600 text-shade-600 dark:text-shade-300 hover:bg-shade-50 dark:hover:bg-shade-600"
              } ${isLocating ? "opacity-50 cursor-not-allowed" : ""}`}
              title={userLocation ? "Location active" : "Enable location"}
            >
              <CrosshairIcon className={`w-5 h-5 ${isLocating ? "animate-pulse" : ""}`} />
            </button>

            {/* Find Nearby Button */}
            <button
              onClick={handleFindNearby}
              disabled={isLocating}
              className={`px-3 py-2 rounded-xl border transition-all flex items-center gap-2 ${
                viewMode === "nearby"
                  ? "bg-bus-primary text-white border-bus-primary"
                  : "bg-white dark:bg-shade-700 border-shade-200 dark:border-shade-600 text-shade-600 dark:text-shade-300 hover:bg-shade-50 dark:hover:bg-shade-600"
              }`}
            >
              <MapPinIcon className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">Nearby</span>
            </button>
          </div>

          {/* Location Error */}
          {locationError && (
            <div className="mt-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              {locationError}
            </div>
          )}
        </div>
      </header>

      {/* Map */}
      <div className="h-full w-full pt-28">
        <TransitMap
          buses={filteredBuses}
          isLoading={isLoading}
          onBusClick={handleBusClick}
          selectedBusId={selectedBus?.id}
          userLocation={userLocation}
        />
      </div>

      {/* View Mode Indicator */}
      {viewMode !== "all" && (
        <div className="absolute top-32 left-4 z-10">
          <div className="px-3 py-1.5 bg-bus-primary text-white text-sm font-medium rounded-full shadow-lg flex items-center gap-2">
            {viewMode === "nearby" && (
              <>
                <MapPinIcon className="w-4 h-4" />
                <span>Nearest buses</span>
              </>
            )}
            {viewMode === "search" && (
              <>
                <SearchIcon className="w-4 h-4" />
                <span>Search: "{searchQuery}"</span>
              </>
            )}
            <button onClick={handleClearSearch} className="ml-1 hover:bg-white/20 rounded-full p-0.5">
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bus List Panel */}
      <div className="absolute bottom-4 left-4 right-4 md:left-4 md:right-auto md:w-80 z-10">
        <div className="bg-white/95 dark:bg-shade-800/95 backdrop-blur-sm rounded-2xl shadow-xl border border-shade-200 dark:border-shade-700 max-h-72 overflow-y-auto">
          <div className="p-3 border-b border-shade-200 dark:border-shade-700 sticky top-0 bg-white/95 dark:bg-shade-800/95">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-shade-800 dark:text-shade-100 flex items-center gap-2">
                <BusIcon className="w-4 h-4" />
                {viewMode === "nearby" ? "Nearest Buses" : viewMode === "search" ? "Search Results" : "Active Buses"}
                <span className="text-xs text-shade-400">({filteredBuses.length})</span>
              </h2>
              {userLocation && viewMode === "nearby" && (
                <span className="text-xs text-bus-primary flex items-center gap-1">
                  <MapPinIcon className="w-3 h-3" />
                  You
                </span>
              )}
            </div>
          </div>
          
          <div className="p-2 space-y-1">
            {filteredBuses.length > 0 ? (
              filteredBuses.map((bus) => (
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
                      {bus.distance !== undefined && (
                        <span className="text-xs font-medium text-bus-primary bg-bus-primary/10 px-2 py-0.5 rounded-full">
                          {formatDistance(bus.distance)}
                        </span>
                      )}
                      <p className={`text-xs mt-1 ${bus.delay > 0 ? "text-red-500" : bus.delay < 0 ? "text-blue-500" : "text-green-500"}`}>
                        {bus.delay === 0 ? "On Time" : `${Math.abs(bus.delay)} min ${bus.delay > 0 ? "late" : "early"}`}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-6 text-center text-shade-400">
                <SearchIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No buses found</p>
                {viewMode !== "all" && (
                  <button
                    onClick={handleClearSearch}
                    className="mt-2 text-sm text-bus-primary hover:underline"
                  >
                    Show all buses
                  </button>
                )}
              </div>
            )}
            
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
