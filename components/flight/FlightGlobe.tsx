"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
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
}

// Apple-inspired Minimalist Dark Theme
const THEME = {
    bg: "rgba(0, 0, 0, 0)",
    globe: "#000000",
    atmosphere: "rgba(255, 255, 255, 0.05)",
    land: "#0a0a0a",
    borders: "rgba(255, 255, 255, 0.15)",
    text: "rgba(255, 255, 255, 0.9)",
    textDim: "rgba(255, 255, 255, 0.3)",
    home: "#ffffff",
    reachable: "#0ea5e9", // Sleek Sky Blue
    locked: "rgba(255, 255, 255, 0.1)",
    unlocked: "#f59e0b", // Warm Amber
    arc: "#0ea5e9",
};

import * as THREE from "three";

export function FlightGlobe({
    selectedAirport,
    reachableAirports,
    unlockedCodes,
    onSelectAirport,
    flightProgress = 0,
    isFlying = false,
    flyingTo = null,
}: FlightGlobeProps) {
    const globeRef = useRef<any>(null);
    const [globeReady, setGlobeReady] = useState(false);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [countries, setCountries] = useState<any>({ features: [] });

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
        return [{
            lat: currentPlanePos.lat,
            lng: currentPlanePos.lng,
            altitude: 0.005, // Raised safely above the arc
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
        if (isFlying) return []; // Hide clutter during flight
        const reachableCodes = new Set(reachableAirports.map(a => a.code));
        return AIRPORTS.map(airport => ({
            lat: airport.lat,
            lng: airport.lng,
            code: airport.code,
            isReachable: reachableCodes.has(airport.code),
            isUnlocked: unlockedCodes.includes(airport.code),
            isSelected: selectedAirport?.code === airport.code,
            airport
        }));
    }, [reachableAirports, unlockedCodes, selectedAirport, isFlying]);

    // Setup Arcs
    const arcsData = useMemo(() => {
        const arcs = [];
        
        if (isFlying && flyingTo && currentPlanePos) {
            // Draw a solid line from HOME to current position to show trajectory
            if (flightProgress > 0) {
                arcs.push({
                    startLat: HOME_AIRPORT.lat, startLng: HOME_AIRPORT.lng,
                    endLat: currentPlanePos.lat, endLng: currentPlanePos.lng,
                    color: [THEME.arc, THEME.arc],
                    stroke: 0.4, dashLength: 1, dashGap: 0,
                });
            }
            // Draw a faint line for the remaining path
            if (flightProgress < 1) {
                arcs.push({
                    startLat: currentPlanePos.lat, startLng: currentPlanePos.lng,
                    endLat: flyingTo.lat, endLng: flyingTo.lng,
                    color: ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.08)"],
                    stroke: 0.4, dashLength: 1, dashGap: 0,
                });
            }
        } else if (selectedAirport) {
            // Preview arc
            arcs.push({
                startLat: HOME_AIRPORT.lat, startLng: HOME_AIRPORT.lng,
                endLat: selectedAirport.lat, endLng: selectedAirport.lng,
                color: ["rgba(255, 255, 255, 0.4)", THEME.arc],
                stroke: 0.4, dashLength: 1, dashGap: 0,
            });
        }
        return arcs;
    }, [selectedAirport, isFlying, flyingTo, currentPlanePos, flightProgress]);

    // Setup Labels
    const labelsData = useMemo(() => {
        if (isFlying) return []; // Clean look during flight
        const reachableCodes = new Set(reachableAirports.map(a => a.code));
        const items = [{ lat: HOME_AIRPORT.lat, lng: HOME_AIRPORT.lng, text: HOME_AIRPORT.code, color: THEME.home, size: 0.8 }];
        
        AIRPORTS.forEach(a => {
            if (reachableCodes.has(a.code) || unlockedCodes.includes(a.code) || selectedAirport?.code === a.code) {
                const color = selectedAirport?.code === a.code ? THEME.text 
                            : reachableCodes.has(a.code) ? THEME.reachable 
                            : THEME.unlocked;
                items.push({
                    lat: a.lat, lng: a.lng, text: a.code,
                    color: color,
                    size: selectedAirport?.code === a.code ? 0.8 : 0.5
                });
            }
        });
        return items;
    }, [reachableAirports, unlockedCodes, selectedAirport, isFlying]);

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
        if (!isFlying && point.airport && onSelectAirport && point.isReachable) {
            onSelectAirport(point.airport);
        }
    }, [onSelectAirport, isFlying]);

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
                globeImageUrl=""
                backgroundColor={THEME.bg}
                showGlobe={true}
                showAtmosphere={true}
                atmosphereColor={THEME.atmosphere}
                atmosphereAltitude={0.25}
                
                // Fine, minimalist landmasses
                polygonsData={countries.features || []}
                polygonCapColor={() => THEME.land}
                polygonSideColor={() => "transparent"}
                polygonStrokeColor={() => THEME.borders}
                polygonAltitude={0.001}

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
                
                // Tiny sleek points
                pointsData={pointsData}
                pointLat="lat"
                pointLng="lng"
                pointColor={(d: any) =>
                    d.isSelected ? THEME.home
                    : d.isReachable ? THEME.reachable
                    : d.isUnlocked ? THEME.unlocked
                    : THEME.locked
                }
                pointAltitude={(d: any) => d.isSelected ? 0.01 : 0.005}
                pointRadius={(d: any) => d.isSelected ? 0.2 : d.isReachable ? 0.15 : 0.08}
                onPointClick={handlePointClick}
                
                // Elegant thin solid lines
                arcsData={arcsData}
                arcStartLat="startLat" arcStartLng="startLng" arcEndLat="endLat" arcEndLng="endLng"
                arcColor="color" arcStroke="stroke" arcDashLength="dashLength" arcDashGap="dashGap"
                arcAltitude={0.002} // Sits precisely between land (0.001) and plane (0.005)
                
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
