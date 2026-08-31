"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTransLinkBuses } from "@/lib/translinkApi";
import type { BusData } from "@/types";

export function useBusData() {
  return useQuery<BusData[]>({
    queryKey: ["buses"],
    queryFn: async () => {
      console.log("🔄 Fetching bus data from TransLink...");
      
      const buses = await fetchTransLinkBuses();
      
      if (buses.length === 0) {
        console.warn("⚠️ No buses returned from TransLink API");
      } else {
        console.log(`✅ Loaded ${buses.length} buses`);
      }
      
      return buses;
    },
    refetchInterval: 10000, // Refresh every 10 seconds for real-time
    staleTime: 5000,
    retry: 2,
    retryDelay: 1000,
  });
}
