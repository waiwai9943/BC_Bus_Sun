/**
 * Solar Position & Seat Recommendation Calculator
 * 
 * This module handles all solar position calculations, bearing mathematics,
 * and seat recommendation logic for the transit bus solar analysis feature.
 */

import SunCalc from "suncalc";
import type { 
  Coordinates, 
  SolarPosition, 
  SolarExposure, 
  SeatRecommendation,
  SunProfilePoint,
  RouteSegment
} from "@/types";

/**
 * Constants for sun angle thresholds
 */
const SUN_THRESHOLDS = {
  // If sun elevation is below this, it's effectively night
  NIGHT_ELEVATION: 0,
  
  // If sun elevation is above this, it's too high for distinct side illumination
  OVERHEAD_ELEVATION: 80,
  
  // When sun is this close to bus heading, it affects the front/back more than sides
  FRONT_BACK_THRESHOLD: 30, // degrees
  
  // Minimum intensity to consider "sunny"
  MIN_INTENSITY: 0.2,
  
  // Side exposure threshold (sun relative to bus heading)
  SIDE_EXPOSURE_ANGLE: 60, // degrees from perpendicular
} as const;

/**
 * Calculate the bearing (heading) between two points
 * Uses the Haversine formula
 * 
 * @param from - Starting coordinates
 * @param to - Ending coordinates
 * @returns Bearing in degrees (0-360, where 0 = North)
 */
export function calculateBearing(from: Coordinates, to: Coordinates): number {
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const dLon = toRadians(to.longitude - from.longitude);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - 
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  
  let bearing = toDegrees(Math.atan2(y, x));
  
  // Normalize to 0-360
  return (bearing + 360) % 360;
}

/**
 * Calculate the solar position (azimuth and elevation) for given coordinates and time
 * 
 * @param position - Geographic coordinates
 * @param date - Date and time for calculation (defaults to now)
 * @returns Solar position data including azimuth, elevation, and day/night status
 */
export function getSolarPosition(position: Coordinates, date: Date = new Date()): SolarPosition {
  const times = SunCalc.getTimes(date, position.latitude, position.longitude);
  const sunPos = SunCalc.getPosition(date, position.latitude, position.longitude);
  
  const azimuth = toDegrees(sunPos.azimuth) + 180; // Convert to 0-360 where 0 = North
  const elevation = toDegrees(sunPos.altitude);
  
  const now = date.getTime();
  const isNight = elevation < SUN_THRESHOLDS.NIGHT_ELEVATION ||
                  now < times.sunrise.getTime() || 
                  now > times.sunset.getTime();

  return {
    azimuth: normalizeAngle(azimuth),
    elevation,
    isNight,
    sunrise: times.sunrise,
    sunset: times.sunset,
    solarNoon: times.solarNoon,
  };
}

/**
 * Calculate the relative angle between sun and bus heading
 * 
 * @param sunAzimuth - Sun's azimuth in degrees (0-360)
 * @param busHeading - Bus's heading in degrees (0-360)
 * @returns Relative angle where:
 *   - 0° = sun directly ahead
 *   - 90° = sun to the right
 *   - -90° = sun to the left
 *   - 180° = sun directly behind
 */
export function getRelativeSunAngle(sunAzimuth: number, busHeading: number): number {
  let relativeAngle = sunAzimuth - busHeading;
  
  // Normalize to -180 to 180
  if (relativeAngle > 180) relativeAngle -= 360;
  if (relativeAngle < -180) relativeAngle += 360;
  
  return relativeAngle;
}

/**
 * Determine which side of the bus is exposed to sunlight
 * 
 * @param sunAzimuth - Sun's azimuth in degrees
 * @param busHeading - Bus's heading in degrees
 * @param sunElevation - Sun's elevation in degrees
 * @returns Which side is sunny, shaded, or neither
 */
export function getSolarExposure(
  sunAzimuth: number,
  busHeading: number,
  sunElevation: number
): SolarExposure {
  // Night time - no sun exposure
  if (sunElevation < SUN_THRESHOLDS.NIGHT_ELEVATION) {
    return {
      sunnySide: "none",
      shadedSide: "none",
      relativeAngle: 0,
      intensity: 0,
      recommendation: "It's night time - no sun exposure",
    };
  }

  const relativeAngle = getRelativeSunAngle(sunAzimuth, busHeading);
  
  // Sun too high overhead - both sides get light
  if (sunElevation > SUN_THRESHOLDS.OVERHEAD_ELEVATION) {
    return {
      sunnySide: "none",
      shadedSide: "none",
      relativeAngle,
      intensity: calculateIntensity(sunElevation),
      recommendation: "Sun is nearly overhead - minimal side-specific shading",
    };
  }

  // Calculate intensity based on elevation (higher = more intense)
  const intensity = calculateIntensity(sunElevation);

  // Determine sunny side based on relative angle
  // Positive angle = sun on the right side
  // Negative angle = sun on the left side
  let sunnySide: "left" | "right";
  let shadedSide: "left" | "right";
  
  if (Math.abs(relativeAngle) < SUN_THRESHOLDS.FRONT_BACK_THRESHOLD) {
    // Sun is mostly ahead or behind
    return {
      sunnySide: "none",
      shadedSide: "none",
      relativeAngle,
      intensity: intensity * 0.5, // Reduced intensity for front/back
      recommendation: relativeAngle >= 0 
        ? "Sun is ahead of the bus" 
        : "Sun is behind the bus",
    };
  }

  if (relativeAngle > 0) {
    sunnySide = "right";
    shadedSide = "left";
  } else {
    sunnySide = "left";
    shadedSide = "right";
  }

  // Check if sun is hitting the side at a useful angle
  const sideAngle = Math.abs(relativeAngle) - 90;
  if (Math.abs(sideAngle) > SUN_THRESHOLDS.SIDE_EXPOSURE_ANGLE) {
    return {
      sunnySide: "none",
      shadedSide: "none",
      relativeAngle,
      intensity: intensity * 0.3,
      recommendation: "Sun angle is too oblique for distinct side exposure",
    };
  }

  return {
    sunnySide,
    shadedSide,
    relativeAngle,
    intensity,
    recommendation: `Sun is on the ${sunnySide} side of the bus`,
  };
}

/**
 * Get seat recommendation based on user's preference (sun vs shade)
 * 
 * @param exposure - Solar exposure data
 * @param wantsSun - Whether the user wants to sit in the sun (true) or avoid it (false)
 * @returns Seat recommendation with side, confidence, and reasoning
 */
export function getSeatRecommendation(
  exposure: SolarExposure,
  wantsSun: boolean
): SeatRecommendation {
  const { sunnySide, shadedSide, intensity, recommendation } = exposure;

  // Night time or no distinct side exposure
  if (sunnySide === "none" || intensity < SUN_THRESHOLDS.MIN_INTENSITY) {
    return {
      side: "either",
      confidence: 0.3,
      reason: "No significant sun exposure - sit anywhere",
      wantsSun,
    };
  }

  const confidence = Math.min(intensity * 1.2, 1); // Cap at 1

  if (wantsSun) {
    const side = sunnySide === "left" ? "LEFT" : "RIGHT";
    return {
      side: sunnySide,
      confidence,
      reason: `The ${side} side is sunny - perfect for catching rays`,
      wantsSun,
    };
  } else {
    const side = shadedSide === "left" ? "LEFT" : "RIGHT";
    return {
      side: shadedSide,
      confidence,
      reason: `The ${side} side is shaded - stay cool and protected`,
      wantsSun,
    };
  }
}

/**
 * Generate a sun profile for a route over time
 * 
 * @param route - Array of route segments with positions
 * @param startTime - Start time of the journey
 * @param intervalMinutes - Interval between profile points
 * @returns Array of sun profile points
 */
export function generateRouteSunProfile(
  route: RouteSegment[],
  startTime: Date,
  intervalMinutes: number = 5
): SunProfilePoint[] {
  const profile: SunProfilePoint[] = [];
  const totalMinutes = 60; // Default 1 hour profile
  const intervals = Math.floor(totalMinutes / intervalMinutes);

  for (let i = 0; i <= intervals; i++) {
    const time = new Date(startTime.getTime() + i * intervalMinutes * 60 * 1000);
    
    // Find the approximate position on the route
    const segmentIndex = Math.min(
      Math.floor((i / intervals) * route.length),
      route.length - 1
    );
    
    const segment = route[segmentIndex];
    const position: Coordinates = {
      latitude: segment.start.latitude + 
                (segment.end.latitude - segment.start.latitude) * (i / intervals),
      longitude: segment.start.longitude + 
                 (segment.end.longitude - segment.start.longitude) * (i / intervals),
    };

    const solarPos = getSolarPosition(position, time);
    const exposure = getSolarExposure(
      solarPos.azimuth,
      segment.bearing,
      solarPos.elevation
    );

    profile.push({
      time,
      sunnySide: exposure.sunnySide,
      intensity: exposure.intensity,
      description: exposure.recommendation,
    });
  }

  return profile;
}

/**
 * Calculate UV intensity based on elevation and cloud cover
 * 
 * @param sunElevation - Sun elevation in degrees
 * @param cloudCover - Cloud cover percentage (0-100)
 * @returns UV intensity (0-1 scale)
 */
export function calculateUVIndex(sunElevation: number, cloudCover: number = 0): number {
  if (sunElevation < 0) return 0;
  
  // Base UV from elevation (stronger when higher)
  const elevationFactor = Math.sin(toRadians(Math.max(0, sunElevation)));
  
  // Cloud cover reduces UV
  const cloudFactor = 1 - (cloudCover / 100) * 0.7;
  
  return Math.max(0, Math.min(1, elevationFactor * cloudFactor));
}

/**
 * Check if current time is during golden hour
 * 
 * @param sunrise - Sunrise time
 * @param sunset - Sunset time
 * @param date - Current time to check
 * @returns Whether it's golden hour and which one (morning/evening)
 */
export function isGoldenHour(sunrise: Date, sunset: Date, date: Date): { isGolden: boolean; type: "morning" | "evening" | "none" } {
  const goldenHourDuration = 60 * 60 * 1000; // 1 hour
  
  const morningStart = new Date(sunrise.getTime());
  const morningEnd = new Date(sunrise.getTime() + goldenHourDuration);
  
  const eveningStart = new Date(sunset.getTime() - goldenHourDuration);
  const eveningEnd = new Date(sunset.getTime());
  
  const now = date.getTime();
  
  if (now >= morningStart.getTime() && now <= morningEnd.getTime()) {
    return { isGolden: true, type: "morning" };
  }
  
  if (now >= eveningStart.getTime() && now <= eveningEnd.getTime()) {
    return { isGolden: true, type: "evening" };
  }
  
  return { isGolden: false, type: "none" };
}

/**
 * Calculate distance between two coordinates in kilometers
 */
export function calculateDistance(from: Coordinates, to: Coordinates): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ============== Helper Functions ==============

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function calculateIntensity(elevation: number): number {
  // Calculate intensity based on sun elevation
  // Intensity is 0 at horizon, 1 at 90° (directly overhead)
  // Using a curve that gives meaningful values even at lower elevations
  const normalizedElevation = Math.max(0, Math.min(90, elevation));
  return Math.sin(toRadians(normalizedElevation * 1.1)); // Multiplier creates faster ramp-up
}

// ============== Exports for Testing ==============

export const solarConstants = SUN_THRESHOLDS;
