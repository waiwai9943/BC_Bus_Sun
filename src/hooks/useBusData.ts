"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTransLinkBuses, checkTransLinkStatus } from "@/lib/translinkApi";
import { generateMockBuses } from "@/lib/mockData";
import type { BusData } from "@/types";

export function useBusData() {
  return useQuery<BusData[]>({
    queryKey: ["buses"],
    queryFn: async () => {
      console.log("🔄 Fetching bus data...");
      
      // Try fetching real TransLink data first
      const realBuses = await fetchTransLinkBuses();
      
      // If we got real data, use it
      if (realBuses.length > 0) {
        console.log(`✅ Loaded ${realBuses.length} real TransLink buses`);
        return realBuses;
      }
      
      // Fallback to mock data if API fails or returns empty
      console.log("⚠️ TransLink API unavailable - using mock data");
      return generateMockBuses();
    },
    refetchInterval: 10000, // Refresh every 10 seconds for real-time
    staleTime: 5000,
    retry: 2,
    retryDelay: 1000,
  });
}
