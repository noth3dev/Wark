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
    const dragX = useMotionValue(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const tearThreshold = 160;

    // Stub opacity – the right half fades as you drag
    const rightOpacity = useTransform(dragX, [0, tearThreshold], [1, 0.2]);
    const rightRotate = useTransform(dragX, [0, tearThreshold], [0, 8]);
    const rightY = useTransform(dragX, [0, tearThreshold], [0, 30]);

    const handleDragEnd = () => {
        const current = dragX.get();
        if (current >= tearThreshold) {
            setIsTorn(true);
            // Animate tear-away
            animate(dragX, 400, {
                duration: 0.4,
                ease: "easeOut",
                onComplete: () => {
                    setTimeout(onTear, 300);
                },
            });
        } else {
            animate(dragX, 0, { duration: 0.3, ease: "easeOut" });
        }
    };

    const formatTime = (m: number) => {
        const h = Math.floor(m / 60);
        const mins = m % 60;
        return h > 0 ? `${h}h ${mins > 0 ? `${mins}m` : ""}` : `${mins}m`;
    };

    const now = new Date();
    const boardingTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const flightNo = `WK${Math.floor(Math.random() * 900 + 100)}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            className="w-full max-w-md mx-auto select-none"
        >
            <div ref={containerRef} className="relative flex">
                {/* LEFT STUB – stays in place */}
                <div className="relative z-10 w-[40%] bg-neutral-900 border border-white/10 rounded-l-3xl p-5 flex flex-col justify-between min-h-[280px]"
                    style={{ borderRight: "none" }}
                >
                    {/* Top section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: tag.color || '#22d3ee' }}>
                                <Plane className="w-3.5 h-3.5 text-black" />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500">WArk Air</span>
                        </div>

                        <div>
                            <p className="text-[8px] font-semibold uppercase text-neutral-600 tracking-widest">From</p>
                            <p className="text-2xl font-black tracking-tight">{HOME_AIRPORT.code}</p>
                            <p className="text-[10px] text-neutral-500">{HOME_AIRPORT.city}</p>
                        </div>
                    </div>

                    {/* Bottom section */}
                    <div className="space-y-2">
                        <div>
                            <p className="text-[8px] font-semibold uppercase text-neutral-600 tracking-widest">Seat / Focus</p>
                            <p className="text-sm font-bold" style={{ color: tag.color || '#22d3ee' }}>{tag.name}</p>
                        </div>
                        <div>
                            <p className="text-[8px] font-semibold uppercase text-neutral-600 tracking-widest">Boarding</p>
                            <p className="text-sm font-bold">{boardingTime}</p>
                        </div>
                    </div>
                </div>

                {/* TEAR LINE (dotted) */}
                <div className="relative z-20 flex flex-col items-center justify-center w-0">
                    <div className="absolute inset-y-4 w-px border-l-2 border-dashed border-white/20" />
                    {/* Notch top */}
                    <div className="absolute top-0 w-6 h-3 bg-background rounded-b-full" />
                    {/* Notch bottom */}
                    <div className="absolute bottom-0 w-6 h-3 bg-background rounded-t-full" />
                </div>

                {/* RIGHT PORTION – draggable to tear */}
                <motion.div
                    drag={isTorn ? false : "x"}
                    dragConstraints={{ left: 0, right: 400 }}
                    dragElastic={0.05}
                    onDragEnd={handleDragEnd}
                    style={{
                        x: dragX,
                        opacity: rightOpacity,
                        rotate: rightRotate,
                        y: rightY,
                        borderLeft: "none",
                    }}
                    className="relative z-10 flex-1 bg-neutral-900 border border-white/10 rounded-r-3xl p-5 flex flex-col justify-between min-h-[280px] cursor-grab active:cursor-grabbing"
                >
                    {/* Top section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500">{flightNo}</span>
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-neutral-500" />
                                <span className="text-[10px] font-bold text-neutral-400">{formatTime(duration)}</span>
                            </div>
                        </div>

                        <div>
                            <p className="text-[8px] font-semibold uppercase text-neutral-600 tracking-widest">To</p>
                            <p className="text-3xl font-black tracking-tight">{destination.code}</p>
                            <p className="text-sm text-neutral-400 font-medium">
                                {destination.emoji} {destination.city}
                            </p>
                        </div>
                    </div>

                    {/* Tear instruction */}
                    <div className="flex items-center gap-2 justify-center py-3">
                        <motion.div
                            animate={{ x: [0, 10, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            className="flex items-center gap-2"
                        >
                            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                                ← 드래그하여 찢기 →
                            </span>
                        </motion.div>
                    </div>

                    {/* Barcode-like decoration */}
                    <div className="flex items-end gap-[2px] h-8 opacity-30">
                        {Array.from({ length: 30 }).map((_, i) => (
                            <div
                                key={i}
                                className="bg-white rounded-sm"
                                style={{
                                    width: Math.random() > 0.3 ? 2 : 3,
                                    height: `${40 + Math.random() * 60}%`,
                                }}
                            />
                        ))}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
