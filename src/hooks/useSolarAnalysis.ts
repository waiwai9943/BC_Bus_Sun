"use client";

import { useMemo } from "react";
import type { BusData, SolarPosition, SeatRecommendation } from "@/types";
import { 
  getSolarPosition, 
  getSolarExposure, 
  getSeatRecommendation 
} from "@/lib/solar/solarCalculator";

export function useSolarAnalysis(bus: BusData | null, wantsSun: boolean) {
  const solarPosition = useMemo((): SolarPosition | null => {
    if (!bus) return null;
    return getSolarPosition(bus.position, new Date());
  }, [bus?.position?.latitude, bus?.position?.longitude]);

  const exposure = useMemo(() => {
    if (!solarPosition || !bus) return null;
    return getSolarExposure(
      solarPosition.azimuth,
      bus.heading,
      solarPosition.elevation
    );
  }, [solarPosition, bus?.heading]);

  const recommendation = useMemo((): SeatRecommendation | null => {
    if (!exposure) return null;
    return getSeatRecommendation(exposure, wantsSun);
  }, [exposure, wantsSun]);

  return {
    solarPosition,
    exposure,
    recommendation,
  };
}
