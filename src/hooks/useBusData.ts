"use client";

import { useQuery } from "@tanstack/react-query";
import { generateMockBuses } from "@/lib/mockData";
import type { BusData } from "@/types";

export function useBusData() {
  return useQuery<BusData[]>({
    queryKey: ["buses"],
    queryFn: async () => {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 100));
      return generateMockBuses();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 3000,
  });
}
