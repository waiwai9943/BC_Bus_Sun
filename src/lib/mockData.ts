/**
 * Mock Data Generators for Development
 * 
 * Generates realistic transit bus data for testing without requiring
 * a real GTFS-RT feed.
 */

import type { BusData, TransitStop, Coordinates } from "@/types";

// Portland, OR area coordinates for demo
const PORTLAND_CENTER: Coordinates = { latitude: 45.5152, longitude: -122.6784 };

// Route definitions with waypoints
const ROUTES = [
  {
    id: "route-1",
    name: "Line 14",
    destination: "Hawthorne",
    stops: [
      { name: "Pioneer Square", position: { latitude: 45.5189, longitude: -122.6792 } },
      { name: "Powell's City", position: { latitude: 45.5230, longitude: -122.6815 } },
      { name: "Division", position: { latitude: 45.5089, longitude: -122.6530 } },
    ],
  },
  {
    id: "route-2",
    name: "Line 20",
    destination: "Beaverton",
    stops: [
      { name: "SW 5th & Morrison", position: { latitude: 45.5185, longitude: -122.6815 } },
      { name: "Washington Park", position: { latitude: 45.5159, longitude: -122.6973 } },
      { name: "Beaverton TC", position: { latitude: 45.4782, longitude: -122.8060 } },
    ],
  },
  {
    id: "route-3",
    name: "Line 8",
    destination: "Lake Oswego",
    stops: [
      { name: "SW 4th & Burnside", position: { latitude: 45.5231, longitude: -122.6784 } },
      { name: "Macrum", position: { latitude: 45.5070, longitude: -122.6592 } },
      { name: "Lake Oswego TC", position: { latitude: 45.4207, longitude: -122.6706 } },
    ],
  },
];

// Interpolate position between two points
function interpolatePosition(from: Coordinates, to: Coordinates, t: number): Coordinates {
  return {
    latitude: from.latitude + (to.latitude - from.latitude) * t,
    longitude: from.longitude + (to.longitude - from.longitude) * t,
  };
}

// Calculate bearing between two points
function calculateBearing(from: Coordinates, to: Coordinates): number {
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const dLon = toRadians(to.longitude - from.longitude);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  let bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

// Bus state for simulation
interface BusState {
  id: string;
  routeId: string;
  routeName: string;
  destination: string;
  waypointIndex: number;
  progress: number; // 0-1 between waypoints
  speed: number;
  direction: 1 | -1; // 1 = forward, -1 = backward
}

const busStates: Map<string, BusState> = new Map();

// Initialize bus states
function initializeBusStates(): void {
  if (busStates.size > 0) return;

  ROUTES.forEach((route) => {
    const state: BusState = {
      id: `bus-${route.id}`,
      routeId: route.id,
      routeName: route.name,
      destination: route.destination,
      waypointIndex: 0,
      progress: Math.random(),
      speed: 25 + Math.random() * 20, // 25-45 km/h
      direction: Math.random() > 0.5 ? 1 : -1,
    };
    busStates.set(state.id, state);
  });
}

/**
 * Generate mock bus data with simulated movement
 */
export function generateMockBuses(): BusData[] {
  initializeBusStates();

  const buses: BusData[] = [];

  busStates.forEach((state) => {
    const route = ROUTES.find((r) => r.id === state.routeId)!;
    const waypoints = route.stops.map((s) => s.position);

    // Update progress
    state.progress += 0.02 + Math.random() * 0.01;

    if (state.progress >= 1) {
      state.progress = 0;
      state.waypointIndex = (state.waypointIndex + 1) % waypoints.length;
      if (state.waypointIndex === 0) {
        state.direction = state.direction === 1 ? -1 : 1;
      }
    }

    // Get current segment
    const currentIdx = state.waypointIndex;
    const nextIdx = (currentIdx + 1) % waypoints.length;
    const from = waypoints[currentIdx];
    const to = waypoints[nextIdx];

    const position = interpolatePosition(from, to, state.progress);
    const heading = calculateBearing(from, to);

    // Add some variation to speed
    state.speed = Math.max(10, Math.min(60, state.speed + (Math.random() - 0.5) * 5));

    buses.push({
      id: state.id,
      routeId: state.routeId,
      routeName: state.routeName,
      destination: state.destination,
      currentStop: route.stops[currentIdx].name,
      nextStop: route.stops[nextIdx].name,
      position,
      heading,
      speed: Math.round(state.speed * 10) / 10,
      delay: Math.round((Math.random() - 0.3) * 10), // -3 to +7 minutes
      timestamp: new Date(),
      passengerLoad: ["empty", "low", "medium", "high"][
        Math.floor(Math.random() * 4)
      ] as BusData["passengerLoad"],
    });
  });

  return buses;
}

/**
 * Generate mock transit stops
 */
export function generateMockStops(): TransitStop[] {
  const stops: TransitStop[] = [];

  ROUTES.forEach((route) => {
    route.stops.forEach((stop, idx) => {
      stops.push({
        id: `stop-${route.id}-${idx}`,
        name: stop.name,
        position: stop.position,
        routes: [route.name],
      });
    });
  });

  return stops;
}

/**
 * Generate a single bus for a specific route
 */
export function generateBusForRoute(
  routeId: string,
  position: Coordinates,
  heading: number
): BusData {
  const route = ROUTES.find((r) => r.id === routeId);
  if (!route) throw new Error(`Route ${routeId} not found`);

  return {
    id: `bus-${routeId}-${Date.now()}`,
    routeId,
    routeName: route.name,
    destination: route.destination,
    currentStop: route.stops[0].name,
    nextStop: route.stops[1]?.name || route.stops[0].name,
    position,
    heading,
    speed: 30 + Math.random() * 20,
    delay: Math.round((Math.random() - 0.3) * 10),
    timestamp: new Date(),
    passengerLoad: ["empty", "low", "medium", "high"][
      Math.floor(Math.random() * 4)
    ] as BusData["passengerLoad"],
  };
}

/**
 * Get all available routes
 */
export function getAvailableRoutes() {
  return ROUTES.map((r) => ({
    id: r.id,
    name: r.name,
    destination: r.destination,
  }));
}
