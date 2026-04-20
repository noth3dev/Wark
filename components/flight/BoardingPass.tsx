"use client";

import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Airport, HOME_AIRPORT } from "../../lib/flight/airports";
import { Plane, Clock, MapPin } from "lucide-react";
import { Tag } from "../../lib/types";

interface BoardingPassProps {
    destination: Airport;
    tag: Tag;
    duration: number; // minutes
    onTear: () => void;
}

export function BoardingPass({ destination, tag, duration, onTear }: BoardingPassProps) {
    const [isTorn, setIsTorn] = useState(false);
    const dragY = useMotionValue(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const tearThreshold = 140;

    // Motion values for vertical tearing of a horizontal ticket
    const rightOpacity = useTransform(dragY, [0, tearThreshold], [1, 0.4]);
    const rightRotate = useTransform(dragY, [0, tearThreshold], [0, 8]);
    const rightX = useTransform(dragY, [0, tearThreshold], [0, 10]);

    const handleDragEnd = () => {
        const current = dragY.get();
        if (current >= tearThreshold) {
            setIsTorn(true);
            animate(dragY, 600, {
                duration: 0.5,
                ease: "easeIn",
                onComplete: () => {
                    setTimeout(onTear, 200);
                },
            });
        } else {
            animate(dragY, 0, { duration: 0.3, ease: "easeOut" });
        }
    };

    const formatTime = (m: number) => {
        const h = Math.floor(m / 60);
        const mins = m % 60;
        return h > 0 ? `${h}h ${mins > 0 ? `${mins}m` : ""}` : `${mins}m`;
    };

    const now = new Date();
    const boardingDate = now;
    const boardingTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    
    // Arrival Time calculation
    const arrivalDate = new Date(now.getTime() + duration * 60000);
    const arrivalTime = `${arrivalDate.getHours().toString().padStart(2, "0")}:${arrivalDate.getMinutes().toString().padStart(2, "0")}`;
    const flightNo = `WK${Math.floor(Math.random() * 900 + 100)}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            className="w-full max-w-lg mx-auto select-none"
        >
            <div ref={containerRef} className="relative flex min-h-[220px]">
                {/* LEFT STUB – Fixed */}
                <div className="relative z-10 w-[35%] bg-neutral-900 border border-white/10 rounded-l-[2rem] p-5 flex flex-col justify-between"
                    style={{ borderRight: "none" }}
                >
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: tag.color || '#22d3ee' }}>
                                <Plane className="w-3 h-3 text-black" />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-neutral-500">WArk</span>
                        </div>
                        <div>
                            <p className="text-[7px] font-bold uppercase text-neutral-600 tracking-widest mb-1">From</p>
                            <p className="text-2xl font-black tracking-tight">{HOME_AIRPORT.code}</p>
                            <p className="text-[9px] text-neutral-500 truncate">{HOME_AIRPORT.city}</p>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[7px] font-bold uppercase text-neutral-600 tracking-widest">Time</p>
                        <p className="text-sm font-black">{boardingTime}</p>
                    </div>
                </div>

                {/* TEAR LINE (Vertical Dotted Line) */}
                <div className="relative z-20 flex flex-col items-center justify-center w-0">
                    <div className="absolute inset-y-4 w-px border-l-2 border-dashed border-white/20" />
                    {/* Notch Top/Bottom */}
                    <div className="absolute top-0 w-6 h-3 bg-black rounded-b-full border border-white/10 border-t-0" />
                    <div className="absolute bottom-0 w-6 h-3 bg-black rounded-t-full border border-white/10 border-b-0" />
                </div>

                {/* RIGHT PORTION – Draggable DOWNWARD to tear */}
                <motion.div
                    drag={isTorn ? false : "y"}
                    dragConstraints={{ top: 0, bottom: 500 }}
                    dragElastic={0.05}
                    onDragEnd={handleDragEnd}
                    style={{
                        y: dragY,
                        opacity: rightOpacity,
                        rotate: rightRotate,
                        x: rightX,
                        borderLeft: "none",
                    }}
                    className="relative z-10 flex-1 bg-neutral-900 border border-white/10 rounded-r-[2rem] p-6 flex flex-col justify-between cursor-grab active:cursor-grabbing shadow-2xl"
                >
                    <div className="flex justify-between items-start">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-600">{flightNo}</span>
                                <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                                    <span className="text-[8px] font-bold text-neutral-400">BOARDING PASS</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-[7px] font-bold uppercase text-neutral-600 tracking-widest mb-1">To Destination</p>
                                <p className="text-4xl font-black tracking-tighter">{destination.code}</p>
                                <p className="text-sm text-neutral-400 font-bold">{destination.city}</p>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                                <Clock className="w-3 h-3 text-neutral-400" />
                                <span className="text-[10px] font-bold tabular-nums text-neutral-300">{formatTime(duration)}</span>
                            </div>
                            <div className="text-right">
                                <p className="text-[7px] font-bold uppercase text-neutral-600 tracking-widest">Arrival (ETA)</p>
                                <p className="text-sm font-black text-amber-400 leading-tight">{arrivalTime}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-6">
                        <div className="space-y-1">
                            <p className="text-[7px] font-bold uppercase text-neutral-600 tracking-widest">Focus Mode / Seat</p>
                            <p className="text-base font-black" style={{ color: tag.color || '#22d3ee' }}>{tag.name}</p>
                        </div>
                        
                        <div className="flex flex-col items-center gap-2">
                            <motion.div
                                animate={{ y: [0, 5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-neutral-600">
                                    ↓ TEAR DOWN ↓
                                </span>
                            </motion.div>
                        </div>
                    </div>

                    {/* Barcode */}
                    <div className="flex items-end gap-[2px] h-8 opacity-20 mt-4">
                        {Array.from({ length: 50 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-sm flex-1" style={{ height: `${30 + Math.random() * 70}%` }} />
                        ))}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
