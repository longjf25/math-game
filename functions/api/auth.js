export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const url = new URL(request.url);
        const action = url.searchParams.get('action');
        const body = await request.json();
        
        if (action === 'register') {
            return await handleRegister(body, env);
        } else if (action === 'login') {
            return await handleLogin(body, env);
        } else if (action === 'getUser') {
            return await handleGetUser(body, env);
        } else if (action === 'updateScore') {
            return await handleUpdateScore(body, env);
        }
        
        return jsonResponse({ error: 'Unknown action' }, 400);
    } catch (e) {
        return jsonResponse({ error: e.message }, 500);
    }
}

async function handleRegister({ username, password }, env) {
    if (!username || !password) {
        return jsonResponse({ error: '请填写用户名和密码' }, 400);
    }
    
    if (username.length < 1 || password.length < 3) {
        return jsonResponse({ error: '密码至少需要3位' }, 400);
    }
    
    const users = await env.LEADERBOARD_KV.get('users', { type: 'json' }) || {};
    
    if (users[username]) {
        return jsonResponse({ error: '用户名已存在' }, 400);
    }
    
    users[username] = { password, totalScore: 0 };
    await env.LEADERBOARD_KV.put('users', JSON.stringify(users));
    
    return jsonResponse({ 
        success: true, 
        user: { username, totalScore: 0 } 
    });
}

async function handleLogin({ username, password }, env) {
    if (!username || !password) {
        return jsonResponse({ error: '请输入用户名和密码' }, 400);
    }
    
    const users = await env.LEADERBOARD_KV.get('users', { type: 'json' }) || {};
    const user = users[username];
    
    if (!user || user.password !== password) {
        return jsonResponse({ error: '用户名或密码错误' }, 400);
    }
    
    return jsonResponse({ 
        success: true, 
        user: { username, totalScore: user.totalScore } 
    });
}

async function handleGetUser({ username }, env) {
    if (!username) {
        return jsonResponse({ error: 'Missing username' }, 400);
    }
    
    const users = await env.LEADERBOARD_KV.get('users', { type: 'json' }) || {};
    const user = users[username];
    
    if (!user) {
        return jsonResponse({ error: 'User not found' }, 404);
    }
    
    return jsonResponse({ 
        user: { username, totalScore: user.totalScore } 
    });
}

async function handleUpdateScore({ username, totalScore }, env) {
    if (!username || typeof totalScore !== 'number') {
        return jsonResponse({ error: 'Invalid payload' }, 400);
    }
    
    const users = await env.LEADERBOARD_KV.get('users', { type: 'json' }) || {};
    
    if (users[username]) {
        users[username].totalScore = totalScore;
        await env.LEADERBOARD_KV.put('users', JSON.stringify(users));
    }
    
    return jsonResponse({ success: true });
}

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}
