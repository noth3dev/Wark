import { useRef, useState, useEffect, useCallback } from "react";

export type NoiseType = 'none' | 'cabin' | 'cabin_chime' | 'engine' | 'wind' | 'space';

const NOISE_CONFIGS = {
    cabin: { type: 'lowpass', freq: 400, gain: 3.5, label: '기내 소음' },
    cabin_chime: { type: 'lowpass', freq: 400, gain: 3.5, label: '기내 소음 (+방송)' },
    engine: { type: 'lowpass', freq: 150, gain: 4.5, label: '제트 엔진' },
    wind: { type: 'bandpass', freq: 1200, gain: 6.0, label: '비행풍' },
    space: { type: 'lowpass', freq: 800, gain: 2.5, label: '우주선' }
};

export function useAirplaneNoise() {
    const [currentSound, setCurrentSound] = useState<NoiseType>('none');
    
    const audioCtxRef = useRef<AudioContext | null>(null);
    const noiseNodeRef = useRef<ScriptProcessorNode | null>(null);
    const filterNodeRef = useRef<BiquadFilterNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    
    // Space oscillators
    const oscRefs = useRef<OscillatorNode[]>([]);
    
    // Chime loop timer
    const chimeTimerRef = useRef<NodeJS.Timeout | null>(null);

    const initAudio = useCallback(() => {
        if (audioCtxRef.current) return;
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        const bufferSize = 4096;
        const whiteNoise = ctx.createScriptProcessor(bufferSize, 1, 1);
        
        let lastOut = 0;
        whiteNoise.onaudioprocess = (e) => {
            const output = e.outputBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                // Brown noise base
                const white = Math.random() * 2 - 1;
                lastOut = (lastOut + 0.02 * white) / 1.02;
                output[i] = lastOut; 
            }
        };

        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        gain.gain.value = 0;

        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noiseNodeRef.current = whiteNoise;
        filterNodeRef.current = filter;
        gainNodeRef.current = gain;
    }, []);

    const scheduleChime = useCallback((ctx: AudioContext) => {
        // Randomly play a chime between 20s and 60s
        const delayMs = Math.random() * 40000 + 20000;
        chimeTimerRef.current = setTimeout(() => {
            if (ctx.state === 'running') {
                const chimeGain = ctx.createGain();
                chimeGain.gain.value = 0.4;
                chimeGain.connect(ctx.destination);
                
                const t = ctx.currentTime;
                
                // Hi tone (Ding)
                const osc1 = ctx.createOscillator();
                const g1 = ctx.createGain();
                osc1.type = 'sine'; osc1.frequency.value = 880; // A5
                osc1.connect(g1); g1.connect(chimeGain);
                g1.gain.setValueAtTime(0, t);
                g1.gain.linearRampToValueAtTime(1, t + 0.05);
                g1.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
                osc1.start(t); osc1.stop(t + 1.5);

                // Low tone (Dong)
                const osc2 = ctx.createOscillator();
                const g2 = ctx.createGain();
                osc2.type = 'sine'; osc2.frequency.value = 659.25; // E5
                osc2.connect(g2); g2.connect(chimeGain);
                const t2 = t + 0.4; // 0.4s delay for Dong
                g2.gain.setValueAtTime(0, t2);
                g2.gain.linearRampToValueAtTime(1, t2 + 0.05);
                g2.gain.exponentialRampToValueAtTime(0.001, t2 + 1.8);
                osc2.start(t2); osc2.stop(t2 + 2.0);
            }
            // Loop for next chime
            scheduleChime(ctx);
        }, delayMs);
    }, []);

    const playSound = useCallback((type: NoiseType) => {
        if (chimeTimerRef.current) {
            clearTimeout(chimeTimerRef.current);
            chimeTimerRef.current = null;
        }

        if (type === 'none') {
            if (gainNodeRef.current && audioCtxRef.current) {
                gainNodeRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.5);
                setTimeout(() => setCurrentSound('none'), 500);
            } else {
                setCurrentSound('none');
            }
            return;
        }

        if (!audioCtxRef.current) initAudio();
        const ctx = audioCtxRef.current!;
        const filter = filterNodeRef.current!;
        const gain = gainNodeRef.current!;

        if (ctx.state === "suspended") ctx.resume();

        // Stop extra oscillators
        oscRefs.current.forEach(osc => osc.stop());
        oscRefs.current = [];

        // Configure based on type
        const config = NOISE_CONFIGS[type as keyof typeof NOISE_CONFIGS];
        
        filter.type = config.type as BiquadFilterType;
        filter.frequency.setTargetAtTime(config.freq, ctx.currentTime, 0.5);

        // Special additions
        if (type === 'engine') {
            const osc = ctx.createOscillator();
            osc.type = 'sine'; osc.frequency.value = 60;
            osc.connect(gain); osc.start();
            oscRefs.current.push(osc);
            
            const osc2 = ctx.createOscillator();
            osc2.type = 'sine'; osc2.frequency.value = 62;
            osc2.connect(gain); osc2.start();
            oscRefs.current.push(osc2);
        } else if (type === 'space') {
            const osc = ctx.createOscillator();
            osc.type = 'triangle'; osc.frequency.value = 120;
            osc.connect(filter); osc.start();
            oscRefs.current.push(osc);
        } else if (type === 'cabin_chime') {
            // Schedule random seatbelt/announcement chimes for cabin
            scheduleChime(ctx);
        }

        // Fade in or transition volume
        gain.gain.setTargetAtTime(0.3 * config.gain, ctx.currentTime, 1);
        setCurrentSound(type);
    }, [initAudio, scheduleChime]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (chimeTimerRef.current) clearTimeout(chimeTimerRef.current);
            if (audioCtxRef.current) {
                audioCtxRef.current.close().catch(() => {});
            }
        };
    }, []);

    return { 
        currentSound, 
        playSound,
        configs: NOISE_CONFIGS
    };
}
