/**
 * Mock Data Generators for Development
 * 
 * Generates realistic transit bus data for testing without requiring
 * a real GTFS-RT feed.
 * 
 * Currently simulating Greater Vancouver, BC transit routes
 */

import type { BusData, TransitStop, Coordinates } from "@/types";

// Greater Vancouver, BC area coordinates for demo
const VANCOUVER_CENTER: Coordinates = { latitude: 49.2827, longitude: -123.1207 };

// Route definitions with waypoints - Greater Vancouver routes
const ROUTES = [
  {
    id: "route-99",
    name: "99 Commercial-Broadway",
    destination: "UBC",
    stops: [
      { name: "Broadway & Commercial", position: { latitude: 49.2604, longitude: -123.0713 } },
      { name: "Main Street", position: { latitude: 49.2625, longitude: -123.0925 } },
      { name: "Cambie Street", position: { latitude: 49.2635, longitude: -123.1135 } },
      { name: "Oak Street", position: { latitude: 49.2645, longitude: -123.1315 } },
      { name: "Arbutus", position: { latitude: 49.2655, longitude: -123.1515 } },
      { name: "UBC", position: { latitude: 49.2688, longitude: -123.2530 } },
    ],
  },
  {
    id: "route-20",
    name: "20 Victoria/Downtown",
    destination: "Victoria",
    stops: [
      { name: "Waterfront Station", position: { latitude: 49.2850, longitude: -123.1107 } },
      { name: "Granville & Georgia", position: { latitude: 49.2827, longitude: -123.1207 } },
      { name: "Davie Street", position: { latitude: 49.2790, longitude: -123.1280 } },
      { name: "Denman & Georgia", position: { latitude: 49.2755, longitude: -123.1365 } },
      { name: "Stanley Park", position: { latitude: 49.2735, longitude: -123.1450 } },
    ],
  },
  {
    id: "route-41",
    name: "41 Joyce Station/Crown",
    destination: "Crown",
    stops: [
      { name: "Joyce-Collingwood Stn", position: { latitude: 49.2385, longitude: -123.0320 } },
      { name: "Rupert Street", position: { latitude: 49.2450, longitude: -123.0500 } },
      { name: "Sperling", position: { latitude: 49.2520, longitude: -123.0680 } },
      { name: "Crown", position: { latitude: 49.2595, longitude: -123.0860 } },
    ],
  },
  {
    id: "route-5",
    name: "5 Downtown/UBC",
    destination: "UBC",
    stops: [
      { name: "Howe & Robson", position: { latitude: 49.2840, longitude: -123.1180 } },
      { name: "Seymour & Pender", position: { latitude: 49.2820, longitude: -123.1050 } },
      { name: "Main & Hastings", position: { latitude: 49.2810, longitude: -123.0920 } },
      { name: "Clark & 2nd", position: { latitude: 49.2790, longitude: -123.0750 } },
      { name: "UBC", position: { latitude: 49.2688, longitude: -123.2530 } },
    ],
  },
  {
    id: "route-10",
    name: "10 Downtown/Hastings",
    destination: "Downtown",
    stops: [
      { name: "Hastings & Main", position: { latitude: 49.2810, longitude: -123.0920 } },
      { name: "Hastings & Carrall", position: { latitude: 49.2820, longitude: -123.1030 } },
      { name: "Waterfront Station", position: { latitude: 49.2850, longitude: -123.1107 } },
      { name: "Canada Place", position: { latitude: 49.2885, longitude: -123.1110 } },
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
      speed: 20 + Math.random() * 25, // 20-45 km/h (Vancouver traffic)
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
    state.progress += 0.015 + Math.random() * 0.01;

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

    // Add some variation to speed (Vancouver traffic)
    state.speed = Math.max(5, Math.min(55, state.speed + (Math.random() - 0.5) * 8));

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
      delay: Math.round((Math.random() - 0.4) * 15), // -6 to +9 minutes (BC Transit delays)
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
    speed: 25 + Math.random() * 25,
    delay: Math.round((Math.random() - 0.4) * 15),
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
