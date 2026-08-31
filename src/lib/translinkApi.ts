/**
 * TransLink BC (Greater Vancouver) Real-Time Bus API
 * 
 * Documentation: https://developer.translink.ca/
 */

import type { BusData, Coordinates } from "@/types";

const API_KEY = process.env.TRANSLINK_API_KEY;
const API_URL = process.env.TRANSLINK_API_URL || "https://api.translink.ca";

/**
 * TransLink Vehicle API Response
 */
interface TransLinkVehicle {
  VehicleNo: string;
  TripId: string;
  RouteNo: string;
  RouteName: string;
  Direction: string;
  Destination: string;
  Latitude: number;
  Longitude: number;
  Speed: number;
  Heading: number;
  NextStop: string;
  Occupancy: "empty" | "low" | "medium" | "high";
}

/**
 * Map TransLink occupancy to our format
 */
function mapOccupancy(occupancy: string): BusData["passengerLoad"] {
  const mapping: Record<string, BusData["passengerLoad"]> = {
    "Empty": "empty",
    "Low": "low",
    "Medium": "medium",
    "High": "high",
    "Full": "high",
  };
  return mapping[occupancy] || "medium";
}

/**
 * Fetch real-time bus data from TransLink API
 * 
 * Returns all active buses in the Greater Vancouver area
 */
export async function fetchTransLinkBuses(): Promise<BusData[]> {
  // Use NEXT_PUBLIC_ prefix for client-side access
  const apiKey = process.env.NEXT_PUBLIC_TRANSLINK_API_KEY || process.env.TRANSLINK_API_KEY;
  
  if (!apiKey) {
    console.warn("⚠️ TransLink API key not found - check .env.local");
    return [];
  }

  try {
    console.log(`🔗 Connecting to TransLink API: ${API_URL}`);
    
    const response = await fetch(
      `${API_URL}/rttiapi/v1/vehicles?apikey=${apiKey}`,
      {
        headers: {
          "Accept": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`❌ TransLink API error: ${response.status} ${response.statusText}`);
      throw new Error(`TransLink API error: ${response.status}`);
    }

    const data: TransLinkVehicle[] = await response.json();
    console.log(`📡 TransLink returned ${data.length} vehicles`);

    // Map TransLink data to our BusData format
    const buses: BusData[] = data
      .filter((vehicle) => vehicle.Latitude && vehicle.Longitude)
      .map((vehicle) => ({
        id: `translink-${vehicle.VehicleNo}`,
        routeId: `route-${vehicle.RouteNo}`,
        routeName: `${vehicle.RouteNo} ${vehicle.RouteName}`.trim(),
        destination: vehicle.Destination,
        currentStop: vehicle.NextStop || "Unknown",
        nextStop: "Upcoming",
        position: {
          latitude: vehicle.Latitude,
          longitude: vehicle.Longitude,
        } as Coordinates,
        heading: vehicle.Heading || 0,
        speed: vehicle.Speed || 0,
        delay: 0, // TransLink doesn't provide delay in vehicle endpoint
        timestamp: new Date(),
        passengerLoad: mapOccupancy(vehicle.Occupancy || "Medium"),
      }));

    return buses;
  } catch (error) {
    console.error("Failed to fetch TransLink data:", error);
    return [];
  }
}

/**
 * Get list of routes from TransLink
 */
export async function fetchTransLinkRoutes(): Promise<Array<{ id: string; name: string }>> {
  if (!API_KEY) {
    return [];
  }

  try {
    const response = await fetch(
      `${API_URL}/rttiapi/v1/routes?apikey=${API_KEY}`,
      {
        headers: {
          "Accept": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`TransLink API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract route info from the response
    // TransLink returns an object with Routes array
    const routes = Array.isArray(data) ? data : data.Routes || [];
    
    return routes.map((route: { RouteNumber: string; RouteName: string }) => ({
      id: `route-${route.RouteNumber}`,
      name: `${route.RouteNumber} ${route.RouteName}`.trim(),
    }));
  } catch (error) {
    console.error("Failed to fetch TransLink routes:", error);
    return [];
  }
}

/**
 * Check if TransLink API is configured and accessible
 */
export async function checkTransLinkStatus(): Promise<boolean> {
  if (!API_KEY) {
    return false;
  }

  try {
    const response = await fetch(
      `${API_URL}/rttiapi/v1/routes?apikey=${API_KEY}`,
      {
        headers: {
          "Accept": "application/json",
        },
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}
