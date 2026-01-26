"use client"

import { useState, useEffect } from 'react'

interface BatteryManager extends EventTarget {
    charging: boolean;
    chargingTime: number;
    dischargingTime: number;
    level: number;
    onchargingchange: ((this: BatteryManager, ev: Event) => any) | null;
    onchargingtimechange: ((this: BatteryManager, ev: Event) => any) | null;
    ondischargingtimechange: ((this: BatteryManager, ev: Event) => any) | null;
    onlevelchange: ((this: BatteryManager, ev: Event) => any) | null;
}

interface NavigatorWithBattery extends Navigator {
    getBattery?: () => Promise<BatteryManager>;
}

export function useBattery() {
    const [battery, setBattery] = useState<{
        level: number;
        charging: boolean;
        supported: boolean;
    }>({
        level: 0,
        charging: false,
        supported: false,
    })

    useEffect(() => {
        const nav = navigator as NavigatorWithBattery;
        if (!nav.getBattery) {
            setBattery(prev => ({ ...prev, supported: false }));
            return;
        }

        let batteryManager: BatteryManager | null = null;

        const handleChange = () => {
            if (batteryManager) {
                setBattery({
                    level: batteryManager.level,
                    charging: batteryManager.charging,
                    supported: true,
                });
            }
        };

        nav.getBattery().then((m) => {
            batteryManager = m;
            setBattery({
                level: m.level,
                charging: m.charging,
                supported: true,
            });

            m.addEventListener('levelchange', handleChange);
            m.addEventListener('chargingchange', handleChange);
        });

        return () => {
            if (batteryManager) {
                batteryManager.removeEventListener('levelchange', handleChange);
                batteryManager.removeEventListener('chargingchange', handleChange);
            }
        };
    }, []);

    return battery;
}
