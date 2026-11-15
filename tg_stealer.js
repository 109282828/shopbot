const axios = require('axios');

async function checkTelegramAccount(phone) {
    try {
        // Официальный метод проверки (возвращает random_hash, если аккаунт есть)
        const res = await axios.post('https://my.telegram.org/auth/send_password', new URLSearchParams({
            phone: phone
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 5000
        });
        
        if (res.data && typeof res.data === 'string' && res.data.includes('random_hash')) {
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

function generatePhone() {
    return `+79${Math.floor(100000000 + Math.random() * 900000000)}`;
}

function generateCode() {
    return Math.floor(10000 + Math.random() * 90000).toString();
}

module.exports = { checkTelegramAccount, generatePhone, generateCode };
