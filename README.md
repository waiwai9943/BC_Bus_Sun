# BC Bus Solar Tracker

A real-time transit bus tracking web application with solar position analysis to help passengers find the best seat based on sun exposure.

## Features

### 🚌 Interactive Transit Map
- Real-time bus location tracking with direction indicators
- Route visualization with custom styling
- Bus details modal with route info, speed, and delay status

### ☀️ Solar Position Analysis ("Sun Side / Shade Side" Detector)
- Calculates sun azimuth and elevation based on location and time
- Determines which side of the bus is exposed to sunlight
- Provides seat recommendations based on user preference (sun vs shade)

### 🎯 Key Features
- **Bus Seat Indicator**: Visual UI showing sunny/shaded sides
- **Toggle Preference**: Choose to sit in the sun or avoid it
- **Real-time Updates**: Bus positions refresh every 5 seconds
- **Confidence Score**: Shows the reliability of the recommendation

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Map**: MapLibre GL JS (open-source, no API key required)
- **State Management**: TanStack Query (React Query)
- **Solar Calculations**: SunCalc library

## Getting Started

### Prerequisites
- Node.js 18.17 or later
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/waiwai9943/BC_Bus_Sun.git
cd BC_Bus_Sun
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main page
│   └── globals.css        # Global styles
├── components/
│   ├── BusSeatIndicator.tsx    # Seat recommendation UI
│   ├── BusDetailsModal.tsx      # Bus details popup
│   ├── TransitMap.tsx          # Map component
│   ├── icons.tsx                # SVG icons
│   └── providers/
│       └── QueryProvider.tsx    # React Query provider
├── hooks/
│   ├── useBusData.ts            # Bus data fetching
│   └── useSolarAnalysis.ts      # Solar calculations hook
├── lib/
│   ├── solar/
│   │   ├── solarCalculator.ts   # Core solar math
│   │   └── solarCalculator.test.ts
│   └── mockData.ts              # Mock bus data generator
└── types/
    └── index.ts                 # TypeScript types
```

## Solar Calculator Logic

The `solarCalculator.ts` module handles:

1. **Bearing Calculation**: Using Haversine formula for accurate heading
2. **Solar Position**: Azimuth and elevation from `suncalc`
3. **Relative Angle**: Difference between sun position and bus heading
4. **Side Detection**: Determines sunny/shaded sides
5. **Seat Recommendation**: Suggests best seat based on preference

### Key Formulas

- **Bearing**: `θ = atan2(sin(Δλ) * cos(φ2), cos(φ1) * sin(φ2) - sin(φ1) * cos(φ2) * cos(Δλ))`
- **Relative Angle**: `Δθ = θ_sun - θ_bus` (normalized to -180° to 180°)
- **Sunny Side**: Right if `Δθ > 0`, Left if `Δθ < 0`

## Development

### Run Tests
```bash
npm test
```

### Build for Production
```bash
npm run build
```

### Lint
```bash
npm run lint
```

## License

MIT
