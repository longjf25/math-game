const VALID_GAMES = ['typing', 'math'];

function getGameKey(game) {
    return VALID_GAMES.includes(game) ? `scores:${game}` : 'scores:typing';
}

export async function onRequestGet(context) {
    const { env, request } = context;
    
    try {
        const url = new URL(request.url);
        const game = url.searchParams.get('game') || 'typing';
        const key = getGameKey(game);
        
        const data = await env.LEADERBOARD_KV.get(key, { type: 'json' });
        const scores = data || [];
        
        const top10 = scores.slice(0, 10);
        
        return new Response(JSON.stringify({ scores: top10 }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ scores: [], error: e.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const url = new URL(request.url);
        const game = url.searchParams.get('game') || 'typing';
        const key = getGameKey(game);
        
        const { username, score, dateTime } = await request.json();
        
        if (!username || typeof score !== 'number' || score <= 0) {
            return new Response(JSON.stringify({ error: 'Invalid payload' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const existingData = await env.LEADERBOARD_KV.get(key, { type: 'json' });
        let scores = existingData || [];
        
        const existingIndex = scores.findIndex(s => s.username === username);
        
        if (existingIndex >= 0) {
            if (score > scores[existingIndex].score) {
                scores[existingIndex] = { username, score, dateTime };
            }
        } else {
            scores.push({ username, score, dateTime });
        }
        
        scores.sort((a, b) => b.score - a.score);
        
        if (scores.length > 50) {
            scores = scores.slice(0, 50);
        }
        
        await env.LEADERBOARD_KV.put(key, JSON.stringify(scores));
        
        const top10 = scores.slice(0, 10);
        
        return new Response(JSON.stringify({ scores: top10 }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
