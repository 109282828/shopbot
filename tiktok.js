const axios = require('axios');
const sleep = (min, max) => new Promise(r => setTimeout(r, Math.floor(Math.random() * (max - min + 1) + min) * 1000));

async function warmupTikTok(sessionId, durationMs, updateStats) {
    let stats = { likes: 0, comments: 0, reposts: 0, views: 0 };
    const startTime = Date.now();
    
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Cookie': `sessionid=${sessionId}`
    };

    try {
        while (Date.now() - startTime < durationMs) {
            try {
                stats.views++;
                updateStats(stats);
                await sleep(15, 45);

                if (Math.random() < 0.4) {
                    await axios.post('https://www.tiktok.com/api/commit/item/digg/', new URLSearchParams({
                        aweme_id: '7123456789012345678', type: 1
                    }), { headers });
                    stats.likes++;
                    updateStats(stats);
                    await sleep(5, 15);
                }

                if (Math.random() < 0.1) await sleep(60, 180);
            } catch (e) {
                await sleep(30, 60);
            }
        }
        return stats;
    } catch (e) {
        return { error: "Ошибка сети: " + e.message };
    }
}

module.exports = { warmupTikTok };
