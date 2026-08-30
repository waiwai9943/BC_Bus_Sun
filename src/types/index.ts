export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface BusData {
  id: string;
  routeId: string;
  routeName: string;
  destination: string;
  currentStop: string;
  nextStop: string;
  position: Coordinates;
  heading: number; // bearing in degrees (0-360)
  speed: number; // km/h
  delay: number; // minutes (positive = late, negative = early)
  timestamp: Date;
  passengerLoad: "empty" | "low" | "medium" | "high";
}

export interface TransitStop {
  id: string;
  name: string;
  position: Coordinates;
  routes: string[];
}

export interface RouteSegment {
  start: Coordinates;
  end: Coordinates;
  bearing: number;
}

export interface SolarPosition {
  azimuth: number; // degrees from north (0-360)
  elevation: number; // degrees above horizon (-90 to 90)
  isNight: boolean;
  sunrise: Date;
  sunset: Date;
  solarNoon: Date;
}

export interface SolarExposure {
  sunnySide: "left" | "right" | "none";
  shadedSide: "left" | "right" | "none";
  relativeAngle: number; // degrees
  intensity: number; // 0-1 scale
  recommendation: string;
}

export interface SeatRecommendation {
  side: "left" | "right" | "either";
  confidence: number; // 0-1
  reason: string;
  wantsSun: boolean;
}

export interface SunProfilePoint {
  time: Date;
  sunnySide: "left" | "right" | "none";
  intensity: number;
  description: string;
}
