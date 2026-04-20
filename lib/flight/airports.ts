// Real-world airports with coordinates and approximate flight times from Seoul (ICN)
export interface Airport {
    code: string;
    city: string;
    country: string;
    lat: number;
    lng: number;
    emoji: string;
    /** Approximate one-way flight time in minutes from ICN */
    flightMinutes: number;
}

// Home base
export const HOME_AIRPORT: Airport = {
    code: "ICN",
    city: "Seoul",
    country: "South Korea",
    lat: 37.4602,
    lng: 126.4407,
    emoji: "🇰🇷",
    flightMinutes: 0,
};

export const AIRPORTS: Airport[] = [
    // ~25 min (short focus)
    { code: "CJU", city: "Jeju", country: "South Korea", lat: 33.5104, lng: 126.4914, emoji: "🏝️", flightMinutes: 25 },
    // ~30 min
    { code: "PUS", city: "Busan", country: "South Korea", lat: 35.1796, lng: 128.9382, emoji: "🇰🇷", flightMinutes: 30 },
    // ~60 min
    { code: "FUK", city: "Fukuoka", country: "Japan", lat: 33.5902, lng: 130.4017, emoji: "🇯🇵", flightMinutes: 60 },
    { code: "KIX", city: "Osaka", country: "Japan", lat: 34.4347, lng: 135.2440, emoji: "🇯🇵", flightMinutes: 70 },
    // ~90 min
    { code: "NRT", city: "Tokyo", country: "Japan", lat: 35.7647, lng: 140.3864, emoji: "🇯🇵", flightMinutes: 90 },
    { code: "TPE", city: "Taipei", country: "Taiwan", lat: 25.0777, lng: 121.2328, emoji: "🇹🇼", flightMinutes: 90 },
    // ~120 min
    { code: "PVG", city: "Shanghai", country: "China", lat: 31.1434, lng: 121.8052, emoji: "🇨🇳", flightMinutes: 120 },
    { code: "MNL", city: "Manila", country: "Philippines", lat: 14.5086, lng: 121.0198, emoji: "🇵🇭", flightMinutes: 120 },
    // ~150 min
    { code: "HKG", city: "Hong Kong", country: "China", lat: 22.3080, lng: 113.9185, emoji: "🇭🇰", flightMinutes: 150 },
    { code: "BKK", city: "Bangkok", country: "Thailand", lat: 13.6900, lng: 100.7501, emoji: "🇹🇭", flightMinutes: 180 },
    // ~180–240 min
    { code: "SGN", city: "Ho Chi Minh", country: "Vietnam", lat: 10.8185, lng: 106.6519, emoji: "🇻🇳", flightMinutes: 200 },
    { code: "SIN", city: "Singapore", country: "Singapore", lat: 1.3644, lng: 103.9915, emoji: "🇸🇬", flightMinutes: 240 },
    { code: "KUL", city: "Kuala Lumpur", country: "Malaysia", lat: 2.7456, lng: 101.7099, emoji: "🇲🇾", flightMinutes: 240 },
    // ~300–360 min
    { code: "DEL", city: "Delhi", country: "India", lat: 28.5562, lng: 77.1000, emoji: "🇮🇳", flightMinutes: 360 },
    { code: "SYD", city: "Sydney", country: "Australia", lat: -33.9461, lng: 151.1772, emoji: "🇦🇺", flightMinutes: 360 },
    // ~420–600 min
    { code: "DXB", city: "Dubai", country: "UAE", lat: 25.2532, lng: 55.3657, emoji: "🇦🇪", flightMinutes: 420 },
    { code: "IST", city: "Istanbul", country: "Turkey", lat: 41.2753, lng: 28.7519, emoji: "🇹🇷", flightMinutes: 480 },
    { code: "CDG", city: "Paris", country: "France", lat: 49.0097, lng: 2.5479, emoji: "🇫🇷", flightMinutes: 540 },
    { code: "LHR", city: "London", country: "UK", lat: 51.4700, lng: -0.4543, emoji: "🇬🇧", flightMinutes: 540 },
    { code: "FCO", city: "Rome", country: "Italy", lat: 41.8003, lng: 12.2389, emoji: "🇮🇹", flightMinutes: 550 },
    // ~600–780 min (long focus)
    { code: "JFK", city: "New York", country: "USA", lat: 40.6413, lng: -73.7781, emoji: "🇺🇸", flightMinutes: 660 },
    { code: "LAX", city: "Los Angeles", country: "USA", lat: 33.9416, lng: -118.4085, emoji: "🇺🇸", flightMinutes: 600 },
    { code: "SFO", city: "San Francisco", country: "USA", lat: 37.6213, lng: -122.3790, emoji: "🇺🇸", flightMinutes: 620 },
    { code: "GRU", city: "São Paulo", country: "Brazil", lat: -23.4356, lng: -46.4731, emoji: "🇧🇷", flightMinutes: 720 },
];

/**
 * Get airports reachable within the given focus duration (minutes).
 * Returns airports with flight time <= focusMinutes, sorted by distance.
 */
export function getReachableAirports(focusMinutes: number): Airport[] {
    return AIRPORTS
        .filter(a => a.flightMinutes <= focusMinutes)
        .sort((a, b) => b.flightMinutes - a.flightMinutes);
}

/**
 * Get flight phase based on elapsed ratio (0-1).
 */
export type FlightPhase = "boarding" | "takeoff" | "cruise" | "descent" | "landing" | "arrived";

export function getFlightPhase(progress: number): FlightPhase {
    if (progress <= 0) return "boarding";
    if (progress < 0.1) return "takeoff";
    if (progress < 0.85) return "cruise";
    if (progress < 0.95) return "descent";
    if (progress < 1) return "landing";
    return "arrived";
}

export function getFlightPhaseLabel(phase: FlightPhase): string {
    switch (phase) {
        case "boarding": return "탑승 중";
        case "takeoff": return "이륙";
        case "cruise": return "순항";
        case "descent": return "하강";
        case "landing": return "착륙 중";
        case "arrived": return "도착 완료";
    }
}

/**
 * Interpolate position between two airports based on progress (0-1).
 */
export function interpolatePosition(from: Airport, to: Airport, progress: number): { lat: number; lng: number } {
    const clamped = Math.max(0, Math.min(1, progress));
    return {
        lat: from.lat + (to.lat - from.lat) * clamped,
        lng: from.lng + (to.lng - from.lng) * clamped,
    };
}
