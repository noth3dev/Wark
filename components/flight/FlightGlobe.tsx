"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
// @ts-ignore - Missing type definitions for topojson-client, bypass for Vercel
import * as topojson from "topojson-client";
import { Airport, HOME_AIRPORT, AIRPORTS } from "../../lib/flight/airports";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

interface FlightGlobeProps {
    selectedAirport?: Airport | null;
    reachableAirports: Airport[];
    unlockedCodes: string[];
    onSelectAirport?: (airport: Airport) => void;
    flightProgress?: number;
    isFlying?: boolean;
    flyingTo?: Airport | null;
    tagColor?: string;
}

// Apple-inspired Minimalist Dark Theme
const THEME = {
    bg: "rgba(0, 0, 0, 0)",
    globe: "#000000",
    atmosphere: "rgba(255, 255, 255, 0.08)",
    land: "#0d0d0d",
    borders: "rgba(255, 255, 255, 0.2)",
    text: "rgba(255, 255, 255, 0.95)",
    textDim: "rgba(255, 255, 255, 0.4)",
    home: "#ffffff",
    reachable: "#22d3ee", // Cyan 400
    locked: "rgba(255, 255, 255, 0.1)",
    unlocked: "#fbbf24", // Amber 400
    arc: "#22d3ee",
    selected: "#fbbf24",
};

// @ts-ignore - Missing type definitions for three
import * as THREE from "three";

export function FlightGlobe({
    selectedAirport,
    reachableAirports,
    unlockedCodes,
    onSelectAirport,
    flightProgress = 0,
    isFlying = false,
    flyingTo = null,
    tagColor = "#22d3ee",
}: FlightGlobeProps) {
    const globeRef = useRef<any>(null);
    const [globeReady, setGlobeReady] = useState(false);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [countries, setCountries] = useState<any>({ features: [] });
    const [hoveredAirport, setHoveredAirport] = useState<Airport | null>(null);

    // Interpolate plane position along a Great Circle path
    const currentPlanePos = useMemo(() => {
        if (!isFlying || !flyingTo) return null;
        
        const lat1 = HOME_AIRPORT.lat * (Math.PI / 180);
        const lon1 = HOME_AIRPORT.lng * (Math.PI / 180);
        const lat2 = flyingTo.lat * (Math.PI / 180);
        const lon2 = flyingTo.lng * (Math.PI / 180);
        
        const dLon = lon2 - lon1;
        const dLat = lat2 - lat1;
        const a = Math.sin(dLat/2)**2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon/2)**2;
        const d = 2 * Math.asin(Math.sqrt(Math.max(0, Math.min(1, a))));
        
        if (d === 0) return { lat: HOME_AIRPORT.lat, lng: HOME_AIRPORT.lng, bearing: 0 };
        
        // Ensure progress is capped cleanly
        const f = Math.max(0, Math.min(1, flightProgress));
        
        const A = Math.sin((1-f)*d) / Math.sin(d);
        const B = Math.sin(f*d) / Math.sin(d);
        
        const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
        const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
        const z = A * Math.sin(lat1) + B * Math.sin(lat2);
        
        const lat3 = Math.atan2(z, Math.sqrt(x*x + y*y));
        const lon3 = Math.atan2(y, x);
        
        // Exact tangent bearing
        const y_bearing = Math.sin(lon2 - lon3) * Math.cos(lat2);
        const x_bearing = Math.cos(lat3) * Math.sin(lat2) - Math.sin(lat3) * Math.cos(lat2) * Math.cos(lon2 - lon3);
        const bearing = (Math.atan2(y_bearing, x_bearing) * 180 / Math.PI + 360) % 360;

        return {
            lat: lat3 * (180 / Math.PI),
            lng: lon3 * (180 / Math.PI),
            bearing
        };
    }, [isFlying, flyingTo, flightProgress]);

    // Solid Plane Geometric Object (Perfectly embedded in WebGL space)
    const objectsData = useMemo(() => {
        if (!isFlying || !currentPlanePos) return [];
        // Track the plane on the map with a parabolic altitude
        // Peek at 0.1 altitude in the middle of flight
        const altitude = 0.1 * Math.sin(Math.PI * flightProgress);
        
        return [{
            lat: currentPlanePos.lat,
            lng: currentPlanePos.lng,
            altitude: Math.max(0.015, altitude), // Minimum 0.015 to stay above ground
            rotation: currentPlanePos.bearing
        }];
    }, [isFlying, currentPlanePos]);

    // Load GeoJSON Map Data
    useEffect(() => {
        fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
            .then(res => res.json())
            .then(topoData => {
                const geoJson = topojson.feature(topoData, topoData.objects.countries as any);
                setCountries(geoJson);
            })
            .catch(() => {
                fetch("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson")
                    .then(r => r.json())
                    .then(data => setCountries(data))
                    .catch(() => {});
            });
    }, []);

    // Resize listener
    useEffect(() => {
        const update = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    // Setup Points
    const pointsData = useMemo(() => {
        if (isFlying) return []; 
        const reachableCodes = new Set(reachableAirports.map(a => a.code));
        return AIRPORTS.map(airport => ({
            lat: airport.lat,
            lng: airport.lng,
            code: airport.code,
            isReachable: reachableCodes.has(airport.code),
            isUnlocked: unlockedCodes.includes(airport.code),
            isSelected: selectedAirport?.code === airport.code,
            isHome: airport.code === HOME_AIRPORT.code,
            isHovered: hoveredAirport?.code === airport.code,
            airport
        }));
    }, [reachableAirports, unlockedCodes, selectedAirport, hoveredAirport, isFlying]);

    // Setup Arcs
    const arcsData = useMemo(() => {
        const arcs = [];
        
        if (isFlying && flyingTo && currentPlanePos) {
            // Draw a faint line for the remaining path
            if (flightProgress < 1) {
                arcs.push({
                    startLat: currentPlanePos.lat, startLng: currentPlanePos.lng,
                    endLat: flyingTo.lat, endLng: flyingTo.lng,
                    color: ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"],
                    stroke: 0.4, dashLength: 1, dashGap: 0,
                    altitude: 0.1,
                });
            }
        } else if (selectedAirport) {
            // Preview arc
            arcs.push({
                startLat: HOME_AIRPORT.lat, startLng: HOME_AIRPORT.lng,
                endLat: selectedAirport.lat, endLng: selectedAirport.lng,
                color: ["rgba(255, 255, 255, 0.4)", THEME.arc],
                stroke: 0.6, dashLength: 1, dashGap: 0,
                altitude: 0.1, // Fixed preview altitude
            });
        }
        return arcs;
    }, [selectedAirport, isFlying, flyingTo, currentPlanePos, flightProgress]);

    // Setup Labels
    const labelsData = useMemo(() => {
        if (isFlying) return []; 
        const items: any[] = [];
        
        // Always show HOME
        items.push({ lat: HOME_AIRPORT.lat, lng: HOME_AIRPORT.lng, text: HOME_AIRPORT.city, color: THEME.home, size: 0.8, weight: 800 });

        // Show selected or hovered
        if (selectedAirport) {
            items.push({ 
                lat: selectedAirport.lat, lng: selectedAirport.lng, 
                text: selectedAirport.city, 
                color: THEME.selected, size: 0.9, weight: 800 
            });
        }

        if (hoveredAirport && hoveredAirport.code !== selectedAirport?.code && hoveredAirport.code !== HOME_AIRPORT.code) {
            items.push({ 
                lat: hoveredAirport.lat, lng: hoveredAirport.lng, 
                text: hoveredAirport.city, 
                color: THEME.text, size: 0.7, weight: 600 
            });
        }

        return items;
    }, [selectedAirport, hoveredAirport, isFlying]);

    // Rings (Pulse markers)
    const ringsData = useMemo(() => {
        const rings = [];
        if (!isFlying) {
            rings.push({ lat: HOME_AIRPORT.lat, lng: HOME_AIRPORT.lng, color: THEME.home, type: 'home' });
            if (selectedAirport) {
                rings.push({ lat: selectedAirport.lat, lng: selectedAirport.lng, color: THEME.arc, type: 'selected' });
            }
        }
        return rings;
    }, [isFlying, selectedAirport]);

    // Camera Logic
    // We only change the point of view when a new airport is selected or when a flight INITIALLY starts.
    // We deliberately avoid binding this closely to flightProgress to allow the user to freely spin and zoom the globe!
    useEffect(() => {
        if (!globeRef.current || !globeReady) return;

        if (isFlying && flyingTo) {
            // Jump to a view encompassing both home and destination ONCE at flight start
            const midLat = (HOME_AIRPORT.lat + flyingTo.lat) / 2;
            const midLng = (HOME_AIRPORT.lng + flyingTo.lng) / 2;
            globeRef.current.pointOfView({
                lat: midLat,
                lng: midLng,
                altitude: 1.2, 
            }, 1200); 
        } else if (selectedAirport) {
            globeRef.current.pointOfView({ lat: selectedAirport.lat, lng: selectedAirport.lng, altitude: 1.5 }, 1200);
        } else if (!isFlying) {
            globeRef.current.pointOfView({ lat: HOME_AIRPORT.lat, lng: HOME_AIRPORT.lng, altitude: 2.2 }, 0);
        }
    // Note: Do NOT include currentPlanePos so it doesn't hijack user interaction
    }, [isFlying, selectedAirport, flyingTo, globeReady]);

    // Initial config
    useEffect(() => {
        if (globeRef.current && globeReady) {
            const controls = globeRef.current.controls();
            if (controls) {
                controls.autoRotate = false;
                controls.enableZoom = true;
                controls.zoomSpeed = 0.5;
                controls.enablePan = false;
                controls.dampingFactor = 0.05; 
            }
        }
    }, [globeReady]);

    const handlePointClick = useCallback((point: any) => {
        if (!isFlying && point.airport && onSelectAirport) {
            onSelectAirport(point.airport);
        }
    }, [onSelectAirport, isFlying]);

    const handlePointHover = useCallback((point: any) => {
        setHoveredAirport(point?.airport || null);
    }, []);

    // Live Orientation Sync
    useEffect(() => {
        if (!globeRef.current || !isFlying || !currentPlanePos) return;
        
        try {
            const scene = globeRef.current.scene();
            scene.traverse((obj: any) => {
                if (obj.userData?.isPlaneGroup) {
                    const mesh = obj.children[0];
                    if (mesh) {
                        // Dynamically update the rotation every frame to follow the curve perfectly
                        // If it faces perpendicular temporarily, the 90 degree offset can be appended here
                        const rad = -currentPlanePos.bearing * (Math.PI / 180);
                        mesh.rotation.z = rad;
                    }
                }
            });
        } catch (e) {}
    }, [currentPlanePos, isFlying]);

    return (
        <div className="absolute inset-0 z-0 bg-transparent">
            <Globe
                ref={globeRef}
                onGlobeReady={() => setGlobeReady(true)}
                backgroundColor={THEME.bg}
                showGlobe={true}
                showAtmosphere={true}
                atmosphereColor={THEME.atmosphere}
                atmosphereAltitude={0.25}
                
                // Solid dark globe — no texture, infinite zoom quality
                globeImageUrl=""
                
                // Borders only — transparent caps prevent black holes
                polygonsData={countries.features || []}
                polygonCapColor={() => "transparent"}
                polygonSideColor={() => "transparent"}
                polygonStrokeColor={() => THEME.borders}
                polygonAltitude={0}

                // Natively rendered beautiful 2D geometric jet
                objectsData={objectsData}
                objectLat="lat"
                objectLng="lng"
                objectAltitude="altitude"
                objectThreeObject={(d: any) => {
                    const planeGroup = new THREE.Group();
                    planeGroup.userData.isPlaneGroup = true; // Tag for real-time tracking

                    // Create a perfect 2D silhouette of a fast jet
                    const shape = new THREE.Shape();
                    shape.moveTo(0, 6);
                    shape.lineTo(1.2, 2);
                    shape.lineTo(4.5, -2); // right wing tip
                    shape.lineTo(4.5, -2.8);
                    shape.lineTo(1.2, -1.2);
                    shape.lineTo(1.2, -4);
                    shape.lineTo(2.5, -5.5); // right tail
                    shape.lineTo(2.5, -6);
                    shape.lineTo(0, -5); // center back
                    shape.lineTo(-2.5, -6);
                    shape.lineTo(-2.5, -5.5); // left tail
                    shape.lineTo(-1.2, -4);
                    shape.lineTo(-1.2, -1.2);
                    shape.lineTo(-4.5, -2.8); // left wing tip
                    shape.lineTo(-4.5, -2);
                    shape.lineTo(-1.2, 2);
                    shape.lineTo(0, 6); // nose

                    const geometry = new THREE.ShapeGeometry(shape);
                    const material = new THREE.MeshBasicMaterial({ 
                        color: 0xffffff, 
                        side: THREE.DoubleSide,
                        polygonOffset: true, // Forces plane to render robustly on top of surfaces
                        polygonOffsetFactor: -4,
                        polygonOffsetUnits: -4
                    });
                    const mesh = new THREE.Mesh(geometry, material);
                    
                    // Initial Rotation (will be overridden by the live sync loop)
                    mesh.rotation.z = -d.rotation * (Math.PI / 180);
                    mesh.scale.set(0.08, 0.08, 1);
                    planeGroup.add(mesh);

                    return planeGroup;
                }}
                
                // Premium HTML markers for cleaner UI and better performance
                htmlElementsData={pointsData}
                htmlLat="lat"
                htmlLng="lng"
                htmlElement={(d: any) => {
                    const isFocus = d.isSelected || d.isHome || d.isHovered;
                    const color = d.isHome ? THEME.home : d.isSelected ? THEME.selected : d.isReachable ? THEME.reachable : THEME.locked;
                    
                    const el = document.createElement('div');
                    el.className = 'group flex items-center justify-center';
                    
                    // Core dot and pulse with CSS
                    const size = d.isHome ? 8 : d.isSelected ? 10 : d.isHovered ? 8 : d.isReachable ? 6 : 4;
                    const opacity = d.isReachable || isFocus ? 1 : 0.3;
                    
                    el.innerHTML = `
                        <div class="relative flex items-center justify-center">
                            ${isFocus || d.isReachable ? `
                                <div class="absolute w-full h-full rounded-full animate-ping opacity-20" style="background-color: ${color}; animation-duration: 2s;"></div>
                                <div class="absolute w-[250%] h-[250%] rounded-full opacity-10" style="background-color: ${color}; filter: blur(4px);"></div>
                            ` : ''}
                            <div class="rounded-full shadow-lg transition-all duration-300" style="
                                width: ${size}px; 
                                height: ${size}px; 
                                background-color: ${color}; 
                                opacity: ${opacity};
                                border: ${isFocus ? '2px solid white' : 'none'};
                            "></div>
                        </div>
                    `;
                    
                    el.style.pointerEvents = 'auto';
                    el.style.cursor = 'pointer';
                    el.onclick = () => handlePointClick(d);
                    el.onmouseenter = () => handlePointHover(d);
                    el.onmouseleave = () => handlePointHover(null);
                    
                    return el;
                }}
                
                // Elegant thin solid lines
                arcsData={arcsData}
                arcStartLat="startLat" arcStartLng="startLng" arcEndLat="endLat" arcEndLng="endLng"
                arcColor="color" arcStroke="stroke" arcDashLength="dashLength" arcDashGap="dashGap"
                arcAltitude="altitude"
                arcAltitudeAutoScale={0.2} // Makes longer flights fly higher
                
                // Crisp labels
                labelsData={labelsData}
                labelLat="lat" labelLng="lng" labelText="text" labelColor="color" labelSize="size"
                labelDotRadius={0.1} labelAltitude={0.015} labelResolution={3}
                
                // Pulse markers
                ringsData={ringsData}
                ringLat="lat" ringLng="lng"
                ringColor={(d: any) => d.color}
                ringMaxRadius={1.0}
                ringPropagationSpeed={0.5}
                ringRepeatPeriod={2000}
                
                width={dimensions.width}
                height={dimensions.height}
            />
        </div>
    );
}
