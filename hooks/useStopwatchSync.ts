import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useStopwatchSync(userId: string | undefined, onSync: () => void) {
    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel(`stopwatch_sync_${userId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'active_sessions', filter: `user_id=eq.${userId}` },
                () => onSync()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'study_sessions', filter: `user_id=eq.${userId}` },
                () => onSync()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tags', filter: `user_id=eq.${userId}` },
                () => onSync()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, onSync]);
}
