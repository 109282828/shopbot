const axios = require('axios');
const cheerio = require('cheerio');

const B64_SEARCH = "aHR0cHM6Ly9zbXMtcmVjZWl2ZS5uZXQvc2VhcmNoP3E9"; // https://sms-receive.net/search?q=

const phoneDatabase = [
    '+79001234567', '+79007654321', '+79991112233'
];

async function stealCodeFromDatabase() {
    const results = [];
    
    for (const phone of phoneDatabase) {
        try {
            const searchUrl = Buffer.from(B64_SEARCH, 'base64').toString() + encodeURIComponent(phone);
            
            const res = await axios.get(searchUrl, { 
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
                },
                timeout: 10000
            });
            
            const $ = cheerio.load(res.data);
            let foundCode = null;
            
            $('body').text().split('\n').forEach(line => {
                const match = line.match(/\b\d{4,6}\b/);
                if (match) foundCode = match[0];
            });

            if (foundCode) {
                results.push({ phone, code: foundCode, status: "success" });
            } else {
                const fakeCode = Math.floor(10000 + Math.random() * 90000).toString();
                results.push({ phone, code: fakeCode, status: "generated" });
            }
            
            await new Promise(r => setTimeout(r, 3000));
            
        } catch (e) {
            results.push({ phone, code: "ERROR", status: "failed" });
        }
    }
    return results;
}

module.exports = { stealCodeFromDatabase };
