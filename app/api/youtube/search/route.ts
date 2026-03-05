import { NextRequest, NextResponse } from 'next/server';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "AIzaSyDhjIZh1xAGfghUrUZkA8vzX5iYDPxgLm8";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const maxResults = searchParams.get('maxResults') || '15';

    if (!query) {
        return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
    }

    try {
        // Step 1: Search for videos
        const searchRes = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${maxResults}&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`
        );
        const searchData = await searchRes.json();

        if (!searchData.items || searchData.items.length === 0) {
            return NextResponse.json({ items: [] });
        }

        // Step 2: Get video details (duration, viewCount, etc.)
        const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
        const detailsRes = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics,snippet&id=${videoIds}&key=${YOUTUBE_API_KEY}`
        );
        const detailsData = await detailsRes.json();

        // Create a map of video details
        const detailsMap: Record<string, any> = {};
        (detailsData.items || []).forEach((item: any) => {
            detailsMap[item.id] = {
                duration: parseDuration(item.contentDetails?.duration || ''),
                durationText: formatDuration(item.contentDetails?.duration || ''),
                viewCount: formatViewCount(item.statistics?.viewCount || '0'),
                channelTitle: item.snippet?.channelTitle || '',
                publishedAt: item.snippet?.publishedAt || '',
            };
        });

        // Step 3: Merge search results with details
        const enrichedItems = searchData.items.map((item: any) => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
            thumbnailHigh: item.snippet.thumbnails?.high?.url,
            publishedAt: item.snippet.publishedAt,
            ...(detailsMap[item.id.videoId] || {}),
        }));

        return NextResponse.json({ items: enrichedItems });
    } catch (error) {
        console.error('YouTube API error:', error);
        return NextResponse.json({ error: 'Failed to search YouTube' }, { status: 500 });
    }
}

function parseDuration(iso8601: string): number {
    const match = iso8601.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    return hours * 3600 + minutes * 60 + seconds;
}

function formatDuration(iso8601: string): string {
    const totalSec = parseDuration(iso8601);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatViewCount(count: string): string {
    const n = parseInt(count);
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return count;
}
