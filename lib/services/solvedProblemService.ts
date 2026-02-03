import { supabase } from '../supabase';

export const solvedProblemService = {
    async getDailyCountsByTag(userId: string, date: string) {
        const { data, error } = await supabase
            .from('solved_problems')
            .select('tag_id, count')
            .eq('user_id', userId)
            .eq('date', date);

        if (error) {
            console.error('Error fetching solved problems:', error);
            return [];
        }

        return data || [];
    },

    async getHistory(userId: string, days: number = 7) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days + 1);
        const startDateStr = startDate.toLocaleDateString('sv-SE');

        const { data, error } = await supabase
            .from('solved_problems')
            .select('date, count')
            .eq('user_id', userId)
            .gte('date', startDateStr);

        if (error) {
            console.error('Error fetching solved problems history:', error);
            return [];
        }

        // Aggregate by date (since multiple tags can exist per date)
        const aggregated: Record<string, number> = {};
        data?.forEach(item => {
            aggregated[item.date] = (aggregated[item.date] || 0) + item.count;
        });

        return Object.entries(aggregated).map(([date, count]) => ({ date, count }));
    },

    async updateCount(userId: string, date: string, tagId: string | null, count: number, isIncrement: boolean = false) {
        // 1. Update summary table
        const { error: summaryError } = await supabase
            .from('solved_problems')
            .upsert({
                user_id: userId,
                date: date,
                tag_id: tagId,
                count: count
            }, {
                onConflict: 'user_id,date,tag_id'
            });

        if (summaryError) throw summaryError;

        // 2. If it's an increment, add a log entry
        if (isIncrement) {
            const { error: logError } = await supabase
                .from('solved_problem_logs')
                .insert({
                    user_id: userId,
                    tag_id: tagId
                });
            if (logError) throw logError;
        }
    },

    async getDailyLogs(userId: string, date: string) {
        // Fetch logs for the specific date
        const start = `${date}T00:00:00Z`;
        const end = `${date}T23:59:59Z`;

        const { data, error } = await supabase
            .from('solved_problem_logs')
            .select('created_at, tag_id')
            .eq('user_id', userId)
            .gte('created_at', start)
            .lte('created_at', end)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching logs:', error);
            return [];
        }

        return data || [];
    }
};
