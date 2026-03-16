"use client";

import React, { useRef, useEffect } from "react";

interface StickmanRunnerProps {
    speed?: number;
}

export function StickmanRunner({ speed = 2 }: StickmanRunnerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const _ctx = canvas.getContext("2d");
        if (!_ctx) return;
        const ctx = _ctx;

        const W = 680, H = 260, GY = 200;
        const TORSO = 38, THIGH = 34, SHIN = 32, UA = 34, LA = 30, HEAD = 11;
        const LEAN = 0.28;

        function noise(x: number) {
            return Math.sin(x * 1.3) * 0.5 + Math.sin(x * 2.7 + 1.1) * 0.3 + Math.sin(x * 5.1 + 2.3) * 0.2;
        }

        function ik(ax: number, ay: number, tx: number, ty: number, l1: number, l2: number, bd: number) {
            const dx = tx - ax, dy = ty - ay;
            const d = Math.min(Math.sqrt(dx * dx + dy * dy), l1 + l2 - 0.01);
            const ca = Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)));
            const ja = Math.atan2(dy, dx) + bd * Math.acos(ca);
            return { jx: ax + Math.cos(ja) * l1, jy: ay + Math.sin(ja) * l1, ex: tx, ey: ty };
        }

        function pose(t: number, nT: number) {
            const a = t * Math.PI * 2;
            const n1 = noise(nT * 0.8) * 1.8;
            const n2 = noise(nT * 0.9 + 4) * 1.5;
            const n3 = noise(nT * 1.1 + 8) * 1.2;
            const pelvisY = Math.sin(a * 2) * 4 + noise(nT * 1.3) * 1.5;

            const rFx = Math.sin(a) * 42 + n1 * 0.4;
            const rFy = THIGH + SHIN - Math.max(0, Math.sin(a)) * 28 - 2 + n2 * 0.3;
            const lFx = Math.sin(a + Math.PI) * 42 - n1 * 0.4;
            const lFy = THIGH + SHIN - Math.max(0, Math.sin(a + Math.PI)) * 28 - 2 + n2 * 0.3;
            const rLeg = ik(0, 0, rFx, rFy, THIGH, SHIN, -1);
            const lLeg = ik(0, 0, lFx, lFy, THIGH, SHIN, -1);

            const rHx = -Math.sin(a) * 36 + n3 * 0.5;
            const rHy = -TORSO + 20 + Math.sin(a) * 16 + n2 * 0.4;
            const lHx = Math.sin(a) * 36 - n3 * 0.5;
            const lHy = -TORSO + 20 - Math.sin(a) * 16 + n2 * 0.4;
            const rArm = ik(0, -TORSO, rHx, rHy, UA, LA, +1);
            const lArm = ik(0, -TORSO, lHx, lHy, UA, LA, +1);

            const leanNoise = LEAN + noise(nT * 0.5) * 0.018;
            return { pelvisY, rLeg, lLeg, rArm, lArm, leanNoise };
        }

        let phase = 0, noiseT = 0;
        let animationId: number;
        const startTime = Date.now();

        const loop = () => {
            const dark = true;
            ctx.clearRect(0, 0, W, H);

            // Ground Line
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, GY);
            ctx.lineTo(W, GY);
            ctx.stroke();

            ctx.save();
            ctx.globalAlpha = 0.06;
            for (let i = 0; i < W; i += 3) {
                const h = Math.abs(noise(i * 0.1 + noiseT * 0.3)) * 6 + 1;
                ctx.fillStyle = '#fff';
                ctx.fillRect(i, GY, 2, h);
            }
            ctx.restore();

            const p = pose(phase, noiseT);
            const COL = '#fff';
            const BCOL = 'rgba(255,255,255,0.2)';

            // Entry Animation: Run from left to center
            const elapsed = (Date.now() - startTime) / 1000;
            const entryDuration = 1.5; // seconds to reach center
            const targetOx = W / 2;
            const startOx = -50;
            const ox = elapsed < entryDuration 
                ? startOx + (targetOx - startOx) * (elapsed / entryDuration)
                : targetOx;
            
            const oy = GY - (THIGH + SHIN - 2) + p.pelvisY;

            ctx.save();
            ctx.globalAlpha = 0.10;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(ox, GY, 20, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            ctx.save();
            ctx.translate(ox, oy);
            ctx.rotate(p.leanNoise);

            function seg(x1: number, y1: number, x2: number, y2: number, col: string, lw: number) {
                ctx.strokeStyle = col;
                ctx.lineWidth = lw;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }

            seg(0, -TORSO, p.rArm.jx, p.rArm.jy, BCOL, 2.5);
            seg(p.rArm.jx, p.rArm.jy, p.rArm.ex, p.rArm.ey, BCOL, 2.5);

            seg(0, 0, p.lLeg.jx, p.lLeg.jy, BCOL, 3.5);
            seg(p.lLeg.jx, p.lLeg.jy, p.lLeg.ex, p.lLeg.ey, BCOL, 3.5);
            {
                const fa = Math.atan2(p.lLeg.ey - p.lLeg.jy, p.lLeg.ex - p.lLeg.jx);
                seg(p.lLeg.ex, p.lLeg.ey, p.lLeg.ex + Math.cos(fa) * 11, p.lLeg.ey + Math.sin(fa) * 4, BCOL, 3);
            }

            seg(0, 0, 0, -TORSO, COL, 4.5);

            seg(0, 0, p.rLeg.jx, p.rLeg.jy, COL, 3.5);
            seg(p.rLeg.jx, p.rLeg.jy, p.rLeg.ex, p.rLeg.ey, COL, 3.5);
            {
                const fa = Math.atan2(p.rLeg.ey - p.rLeg.jy, p.rLeg.ex - p.rLeg.jx);
                seg(p.rLeg.ex, p.rLeg.ey, p.rLeg.ex + Math.cos(fa) * 11, p.rLeg.ey + Math.sin(fa) * 4, COL, 3);
            }

            seg(0, -TORSO, p.lArm.jx, p.lArm.jy, COL, 2.5);
            seg(p.lArm.jx, p.lArm.jy, p.lArm.ex, p.lArm.ey, COL, 2.5);

            seg(0, -TORSO, 0, -TORSO - 7, COL, 4);
            ctx.strokeStyle = COL;
            ctx.fillStyle = '#000';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, -TORSO - 7 - HEAD, HEAD, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.restore();

            phase += speed * 0.007;
            noiseT += speed * 0.04;
            if (phase >= 1) phase -= 1;
            animationId = requestAnimationFrame(loop);
        };

        loop();
        return () => cancelAnimationFrame(animationId);
    }, [speed]);

    return (
        <canvas
            ref={canvasRef}
            width={680}
            height={260}
            className="w-full h-auto"
        />
    );
}
