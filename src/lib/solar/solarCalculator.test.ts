import {
  calculateBearing,
  getSolarPosition,
  getRelativeSunAngle,
  getSolarExposure,
  getSeatRecommendation,
  calculateDistance,
  isGoldenHour,
} from "../solarCalculator";

describe("Solar Calculator", () => {
  describe("calculateBearing", () => {
    it("should calculate bearing north correctly", () => {
      const from = { latitude: 0, longitude: 0 };
      const to = { latitude: 1, longitude: 0 };
      const bearing = calculateBearing(from, to);
      expect(bearing).toBeCloseTo(0, 0);
    });

    it("should calculate bearing east correctly", () => {
      const from = { latitude: 0, longitude: 0 };
      const to = { latitude: 0, longitude: 1 };
      const bearing = calculateBearing(from, to);
      expect(bearing).toBeCloseTo(90, 0);
    });

    it("should calculate bearing south correctly", () => {
      const from = { latitude: 1, longitude: 0 };
      const to = { latitude: 0, longitude: 0 };
      const bearing = calculateBearing(from, to);
      expect(bearing).toBeCloseTo(180, 0);
    });

    it("should calculate bearing west correctly", () => {
      const from = { latitude: 0, longitude: 1 };
      const to = { latitude: 0, longitude: 0 };
      const bearing = calculateBearing(from, to);
      expect(bearing).toBeCloseTo(270, 0);
    });
  });

  describe("getRelativeSunAngle", () => {
    it("should return 0 when sun and bus are aligned", () => {
      const angle = getRelativeSunAngle(180, 180);
      expect(angle).toBe(0);
    });

    it("should return positive angle when sun is to the right", () => {
      const angle = getRelativeSunAngle(270, 180); // Sun at west, bus facing south
      expect(angle).toBe(90);
    });

    it("should return negative angle when sun is to the left", () => {
      const angle = getRelativeSunAngle(90, 180); // Sun at east, bus facing south
      expect(angle).toBe(-90);
    });

    it("should handle wrap-around correctly", () => {
      const angle = getRelativeSunAngle(10, 350);
      expect(Math.abs(angle)).toBeLessThan(30);
    });
  });

  describe("getSolarExposure", () => {
    it("should return none for night time", () => {
      const exposure = getSolarExposure(180, 90, -10);
      expect(exposure.sunnySide).toBe("none");
      expect(exposure.shadedSide).toBe("none");
    });

    it("should identify sun on the right side", () => {
      // Bus heading east (90°), sun at south (180°)
      // Relative angle = 90°, positive = right side
      const exposure = getSolarExposure(180, 90, 45);
      expect(exposure.sunnySide).toBe("right");
      expect(exposure.shadedSide).toBe("left");
    });

    it("should identify sun on the left side", () => {
      // Bus heading west (270°), sun at south (180°)
      // Relative angle = -90°, negative = left side
      const exposure = getSolarExposure(180, 270, 45);
      expect(exposure.sunnySide).toBe("left");
      expect(exposure.shadedSide).toBe("right");
    });

    it("should return none when sun is overhead", () => {
      const exposure = getSolarExposure(180, 90, 85);
      expect(exposure.sunnySide).toBe("none");
      expect(exposure.shadedSide).toBe("none");
    });

    it("should return none when sun is directly ahead", () => {
      // Bus heading south (180°), sun at south (180°)
      // Relative angle = 0°
      const exposure = getSolarExposure(180, 180, 45);
      expect(exposure.sunnySide).toBe("none");
    });
  });

  describe("getSeatRecommendation", () => {
    it("should recommend shaded side when user wants to avoid sun", () => {
      const exposure = getSolarExposure(180, 90, 45);
      const recommendation = getSeatRecommendation(exposure, false);
      expect(recommendation.side).toBe("left"); // Left is shaded when sun is right
      expect(recommendation.wantsSun).toBe(false);
    });

    it("should recommend sunny side when user wants sun", () => {
      const exposure = getSolarExposure(180, 90, 45);
      const recommendation = getSeatRecommendation(exposure, true);
      expect(recommendation.side).toBe("right"); // Right is sunny when sun is right
      expect(recommendation.wantsSun).toBe(true);
    });

    it("should return either side at night", () => {
      const exposure = getSolarExposure(180, 90, -10);
      const recommendation = getSeatRecommendation(exposure, false);
      expect(recommendation.side).toBe("either");
      expect(recommendation.confidence).toBeLessThan(0.5);
    });
  });

  describe("calculateDistance", () => {
    it("should calculate distance between two points", () => {
      // Roughly 111 km per degree of latitude
      const from = { latitude: 0, longitude: 0 };
      const to = { latitude: 1, longitude: 0 };
      const distance = calculateDistance(from, to);
      expect(distance).toBeCloseTo(111, 0);
    });

    it("should return 0 for same point", () => {
      const point = { latitude: 45, longitude: -122 };
      const distance = calculateDistance(point, point);
      expect(distance).toBe(0);
    });
  });

  describe("getSolarPosition", () => {
    it("should return valid solar position data", () => {
      const position = { latitude: 45.5, longitude: -122.5 };
      const date = new Date("2024-06-21T12:00:00"); // Summer solstice noon
      const solarPos = getSolarPosition(position, date);
      
      expect(solarPos).toHaveProperty("azimuth");
      expect(solarPos).toHaveProperty("elevation");
      expect(solarPos).toHaveProperty("isNight");
      expect(solarPos).toHaveProperty("sunrise");
      expect(solarPos).toHaveProperty("sunset");
      
      expect(solarPos.azimuth).toBeGreaterThanOrEqual(0);
      expect(solarPos.azimuth).toBeLessThanOrEqual(360);
      expect(solarPos.elevation).toBeGreaterThanOrEqual(-90);
      expect(solarPos.elevation).toBeLessThanOrEqual(90);
    });
  });

  describe("isGoldenHour", () => {
    it("should detect morning golden hour", () => {
      const sunrise = new Date("2024-06-21T05:30:00");
      const sunset = new Date("2024-06-21T21:00:00");
      const during = new Date("2024-06-21T06:00:00");
      
      const result = isGoldenHour(sunrise, sunset, during);
      expect(result.isGolden).toBe(true);
      expect(result.type).toBe("morning");
    });

    it("should detect evening golden hour", () => {
      const sunrise = new Date("2024-06-21T05:30:00");
      const sunset = new Date("2024-06-21T21:00:00");
      const during = new Date("2024-06-21T20:30:00");
      
      const result = isGoldenHour(sunrise, sunset, during);
      expect(result.isGolden).toBe(true);
      expect(result.type).toBe("evening");
    });

    it("should return false outside golden hour", () => {
      const sunrise = new Date("2024-06-21T05:30:00");
      const sunset = new Date("2024-06-21T21:00:00");
      const during = new Date("2024-06-21T12:00:00");
      
      const result = isGoldenHour(sunrise, sunset, during);
      expect(result.isGolden).toBe(false);
      expect(result.type).toBe("none");
    });
  });
});
