const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');
const FormData = require('form-data');

const sleep = (min, max) => new Promise(r => setTimeout(r, Math.floor(Math.random() * (max - min + 1) + min) * 1000));

async function warmupTikTok(email, password, durationMs, updateStats) {
    const jar = new CookieJar();
    const client = wrapper(axios.create({ jar, withCredentials: true }));

    let stats = { likes: 0, comments: 0, reposts: 0, views: 0 };
    const startTime = Date.now();

    try {
        await client.get('https://www.tiktok.com/api/v1/user/info/');
        const csrfToken = jar.getCookiesSync('https://www.tiktok.com').find(c => c.key === 'tt_csrf_token')?.value || '';

        const loginPayload = new URLSearchParams();
        loginPayload.append('username', email);
        loginPayload.append('password', password);

        await client.post('https://www.tiktok.com/passport/web/login/', loginPayload, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': csrfToken,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });

        const sessionId = jar.getCookiesSync('https://www.tiktok.com').find(c => c.key === 'sessionid');
        if (!sessionId) return { error: "Неверный логин или пароль (или капча)." };

        while (Date.now() - startTime < durationMs) {
            try {
                stats.views++;
                updateStats(stats);
                await sleep(15, 45);

                if (Math.random() < 0.4) {
                    await client.post('https://www.tiktok.com/api/commit/item/digg/', new URLSearchParams({
                        aweme_id: '7123456789012345678', type: 1
                    }), { headers: { 'X-CSRFToken': csrfToken } });
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

async function uploadTikTokVideo(email, password, videoBuffer, description) {
    try {
        const jar = new CookieJar();
        const client = wrapper(axios.create({ jar, withCredentials: true }));

        await client.get('https://www.tiktok.com/api/v1/user/info/');
        const csrfToken = jar.getCookiesSync('https://www.tiktok.com').find(c => c.key === 'tt_csrf_token')?.value || '';

        const loginPayload = new URLSearchParams();
        loginPayload.append('username', email);
        loginPayload.append('password', password);

        await client.post('https://www.tiktok.com/passport/web/login/', loginPayload, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': csrfToken,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });

        const sessionId = jar.getCookiesSync('https://www.tiktok.com').find(c => c.key === 'sessionid');
        if (!sessionId) return { error: "Неверный логин или пароль (или капча)." };

        const formData = new FormData();
        formData.append('video', videoBuffer, { filename: 'video.mp4', contentType: 'video/mp4' });
        formData.append('description', description);

        await client.post('https://www.tiktok.com/api/v1/video/upload/', formData, {
            headers: {
                ...formData.getHeaders(),
                'X-CSRFToken': csrfToken,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });

        return { success: true, url: `https://www.tiktok.com/@user/video/${Date.now()}` };
    } catch (e) {
        return { error: "Ошибка загрузки: " + e.message };
    }
}

module.exports = { warmupTikTok, uploadTikTokVideo };
