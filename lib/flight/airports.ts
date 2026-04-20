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
    // --- South Korea (Short focus: 20-60m) ---
    { code: "CJU", city: "Jeju", country: "South Korea", lat: 33.5104, lng: 126.4914, emoji: "🏝️", flightMinutes: 25 },
    { code: "PUS", city: "Busan", country: "South Korea", lat: 35.1796, lng: 128.9382, emoji: "🇰🇷", flightMinutes: 30 },
    { code: "RSU", city: "Yeosu", country: "South Korea", lat: 34.8421, lng: 127.6171, emoji: "🇰🇷", flightMinutes: 35 },
    { code: "USN", city: "Ulsan", country: "South Korea", lat: 35.5935, lng: 129.3514, emoji: "🇰🇷", flightMinutes: 35 },
    { code: "KUV", city: "Gunsan", country: "South Korea", lat: 35.9038, lng: 126.6157, emoji: "🇰🇷", flightMinutes: 30 },

    // --- Japan & East Asia (Short-Mid: 60-120m) ---
    { code: "FUK", city: "Fukuoka", country: "Japan", lat: 33.5859, lng: 130.4507, emoji: "🇯🇵", flightMinutes: 60 },
    { code: "KIX", city: "Osaka", country: "Japan", lat: 34.4347, lng: 135.2440, emoji: "🇯🇵", flightMinutes: 80 },
    { code: "NGO", city: "Nagoya", country: "Japan", lat: 34.8584, lng: 136.8053, emoji: "🇯🇵", flightMinutes: 90 },
    { code: "NRT", city: "Tokyo", country: "Japan", lat: 35.7767, lng: 140.3864, emoji: "🇯🇵", flightMinutes: 110 },
    { code: "HND", city: "Tokyo", country: "Japan", lat: 35.5494, lng: 139.7798, emoji: "🇯🇵", flightMinutes: 100 },
    { code: "CTS", city: "Sapporo", country: "Japan", lat: 42.7752, lng: 141.6923, emoji: "❄️", flightMinutes: 150 },
    { code: "OKA", city: "Okinawa", country: "Japan", lat: 26.2064, lng: 127.6465, emoji: "🏝️", flightMinutes: 130 },
    { code: "KOJ", city: "Kagoshima", country: "Japan", lat: 31.8034, lng: 130.7196, emoji: "🇯🇵", flightMinutes: 70 },
    { code: "KMQ", city: "Komatsu", country: "Japan", lat: 36.3948, lng: 136.4072, emoji: "🇯🇵", flightMinutes: 100 },
    
    { code: "TPE", city: "Taipei", country: "Taiwan", lat: 25.0777, lng: 121.2328, emoji: "🇹🇼", flightMinutes: 140 },
    { code: "KHH", city: "Kaohsiung", country: "Taiwan", lat: 22.5764, lng: 120.3497, emoji: "🇹🇼", flightMinutes: 160 },
    
    { code: "PVG", city: "Shanghai", country: "China", lat: 31.1434, lng: 121.8052, emoji: "🇨🇳", flightMinutes: 110 },
    { code: "PEK", city: "Beijing", country: "China", lat: 40.0799, lng: 116.6031, emoji: "🇨🇳", flightMinutes: 120 },
    { code: "CAN", city: "Guangzhou", country: "China", lat: 23.3924, lng: 113.2988, emoji: "🇨🇳", flightMinutes: 200 },
    { code: "SZX", city: "Shenzhen", country: "China", lat: 22.6393, lng: 113.8107, emoji: "🇨🇳", flightMinutes: 190 },
    { code: "HKG", city: "Hong Kong", country: "China", lat: 22.3080, lng: 113.9185, emoji: "🇭🇰", flightMinutes: 210 },
    { code: "MFM", city: "Macau", country: "China", lat: 22.1495, lng: 113.5915, emoji: "🇲🇴", flightMinutes: 210 },

    // --- SE Asia (Mid-Long: 180-450m) ---
    { code: "BKK", city: "Bangkok", country: "Thailand", lat: 13.6900, lng: 100.7501, emoji: "🇹🇭", flightMinutes: 340 },
    { code: "HKT", city: "Phuket", country: "Thailand", lat: 8.1132, lng: 98.3067, emoji: "🏝️", flightMinutes: 380 },
    { code: "SIN", city: "Singapore", country: "Singapore", lat: 1.3644, lng: 103.9915, emoji: "🇸🇬", flightMinutes: 380 },
    { code: "KUL", city: "Kul Lumpur", country: "Malaysia", lat: 2.7456, lng: 101.7099, emoji: "🇲🇾", flightMinutes: 360 },
    { code: "SGN", city: "Ho Chi Minh", country: "Vietnam", lat: 10.8185, lng: 106.6519, emoji: "🇻🇳", flightMinutes: 300 },
    { code: "HAN", city: "Hanoi", country: "Vietnam", lat: 21.2212, lng: 105.8072, emoji: "🇻🇳", flightMinutes: 270 },
    { code: "DAD", city: "Da Nang", country: "Vietnam", lat: 16.0439, lng: 108.1994, emoji: "🇻🇳", flightMinutes: 290 },
    { code: "MNL", city: "Manila", country: "Philippines", lat: 14.5086, lng: 121.0198, emoji: "🇵🇭", flightMinutes: 240 },
    { code: "CEB", city: "Cebu", country: "Philippines", lat: 10.3075, lng: 123.9794, emoji: "🇵🇭", flightMinutes: 270 },
    { code: "CGK", city: "Jakarta", country: "Indonesia", lat: -6.1256, lng: 106.6559, emoji: "🇮🇩", flightMinutes: 420 },
    { code: "DPS", city: "Bali", country: "Indonesia", lat: -8.7482, lng: 115.1671, emoji: "🏝️", flightMinutes: 420 },

    // --- India & Middle East (Long: 480-600m) ---
    { code: "DEL", city: "Delhi", country: "India", lat: 28.5562, lng: 77.1000, emoji: "🇮🇳", flightMinutes: 480 },
    { code: "BOM", city: "Mumbai", country: "India", lat: 19.0896, lng: 72.8656, emoji: "🇮🇳", flightMinutes: 520 },
    { code: "DXB", city: "Dubai", country: "UAE", lat: 25.2532, lng: 55.3657, emoji: "🇦🇪", flightMinutes: 560 },
    { code: "AUH", city: "Abu Dhabi", country: "UAE", lat: 24.4330, lng: 54.6511, emoji: "🇦🇪", flightMinutes: 580 },
    { code: "DOH", city: "Doha", country: "Qatar", lat: 25.2731, lng: 51.6081, emoji: "🇶🇦", flightMinutes: 600 },
    { code: "IST", city: "Istanbul", country: "Turkey", lat: 41.2753, lng: 28.7519, emoji: "🇹🇷", flightMinutes: 660 },

    // --- Europe (Ultra: 600-800m) ---
    { code: "CDG", city: "Paris", country: "France", lat: 49.0097, lng: 2.5479, emoji: "🇫🇷", flightMinutes: 720 },
    { code: "LHR", city: "London", country: "UK", lat: 51.4700, lng: -0.4543, emoji: "🇬🇧", flightMinutes: 750 },
    { code: "FRA", city: "Frankfurt", country: "Germany", lat: 50.0333, lng: 8.5705, emoji: "🇩🇪", flightMinutes: 720 },
    { code: "MUC", city: "Munich", country: "Germany", lat: 48.3537, lng: 11.7861, emoji: "🇩🇪", flightMinutes: 710 },
    { code: "AMS", city: "Amsterdam", country: "Netherlands", lat: 52.3081, lng: 4.7642, emoji: "🇳🇱", flightMinutes: 720 },
    { code: "FCO", city: "Rome", country: "Italy", lat: 41.8003, lng: 12.2389, emoji: "🇮🇹", flightMinutes: 730 },
    { code: "MAD", city: "Madrid", country: "Spain", lat: 40.4918, lng: -3.5695, emoji: "🇪🇸", flightMinutes: 780 },
    { code: "BCN", city: "Barcelona", country: "Spain", lat: 41.2974, lng: 2.0833, emoji: "🇪🇸", flightMinutes: 770 },
    { code: "ZRH", city: "Zurich", country: "Switzerland", lat: 47.4582, lng: 8.5555, emoji: "🇨🇭", flightMinutes: 730 },
    { code: "VIE", city: "Vienna", country: "Austria", lat: 48.1103, lng: 16.5697, emoji: "🇦🇹", flightMinutes: 700 },
    { code: "CPH", city: "Copenhagen", country: "Denmark", lat: 55.6180, lng: 12.6508, emoji: "🇩🇰", flightMinutes: 680 },
    { code: "OSL", city: "Oslo", country: "Norway", lat: 60.1975, lng: 11.1004, emoji: "🇳🇴", flightMinutes: 690 },
    { code: "HEL", city: "Helsinki", country: "Finland", lat: 60.3172, lng: 24.9633, emoji: "🇫🇮", flightMinutes: 640 },

    // --- North America (Ultra: 600-840m) ---
    { code: "SEA", city: "Seattle", country: "USA", lat: 47.4488, lng: -122.3093, emoji: "🇺🇸", flightMinutes: 580 },
    { code: "SFO", city: "San Francisco", country: "USA", lat: 37.6213, lng: -122.3790, emoji: "🇺🇸", flightMinutes: 620 },
    { code: "LAX", city: "Los Angeles", country: "USA", lat: 33.9416, lng: -118.4085, emoji: "🇺🇸", flightMinutes: 630 },
    { code: "ORD", city: "Chicago", country: "USA", lat: 41.9742, lng: -87.9073, emoji: "🇺🇸", flightMinutes: 780 },
    { code: "JFK", city: "New York", country: "USA", lat: 40.6413, lng: -73.7781, emoji: "🇺🇸", flightMinutes: 840 },
    { code: "YYZ", city: "Toronto", country: "Canada", lat: 43.6777, lng: -79.6248, emoji: "🇨🇦", flightMinutes: 800 },
    { code: "YVR", city: "Vancouver", country: "Canada", lat: 49.1967, lng: -123.1815, emoji: "🇨🇦", flightMinutes: 600 },
    { code: "HNL", city: "Honolulu", country: "USA", lat: 21.3245, lng: -157.9251, emoji: "🏝️", flightMinutes: 520 },
    { code: "MEX", city: "Mexico City", country: "Mexico", lat: 19.4361, lng: -99.0719, emoji: "🇲🇽", flightMinutes: 900 },

    // --- Oceania (Mid-Long: 240-660m) ---
    { code: "SYD", city: "Sydney", country: "Australia", lat: -33.9399, lng: 151.1753, emoji: "🇦🇺", flightMinutes: 580 },
    { code: "MEL", city: "Melbourne", country: "Australia", lat: -37.6690, lng: 144.8410, emoji: "🇦🇺", flightMinutes: 630 },
    { code: "BNE", city: "Brisbane", country: "Australia", lat: -27.3842, lng: 153.1175, emoji: "🇦🇺", flightMinutes: 560 },
    { code: "AKL", city: "Auckland", country: "New Zealand", lat: -37.0081, lng: 174.7850, emoji: "🇳🇿", flightMinutes: 660 },
    { code: "GUM", city: "Guam", country: "USA", lat: 13.4839, lng: 144.7972, emoji: "🇬🇺", flightMinutes: 260 },
    { code: "SPN", city: "Saipan", country: "USA", lat: 15.1197, lng: 145.7291, emoji: "🇲🇵", flightMinutes: 265 },

    // --- Africa & S.America (Extreme: 800-1100m) ---
    { code: "JNB", city: "Johannesburg", country: "S. Africa", lat: -26.1392, lng: 28.2460, emoji: "🇿🇦", flightMinutes: 960 },
    { code: "CAI", city: "Cairo", country: "Egypt", lat: 30.1219, lng: 31.4056, emoji: "🇪🇬", flightMinutes: 720 },
    { code: "GRU", city: "Sao Paulo", country: "Brazil", lat: -23.4356, lng: -46.4731, emoji: "🇧🇷", flightMinutes: 1100 },
    { code: "EZE", city: "Buenos Aires", country: "Argentina", lat: -34.8222, lng: -58.5358, emoji: "🇦🇷", flightMinutes: 1150 },
    { code: "SCL", city: "Santiago", country: "Chile", lat: -33.3930, lng: -70.7858, emoji: "🇨🇱", flightMinutes: 1180 },
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
