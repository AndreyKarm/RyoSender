const TelegramBot = require('node-telegram-bot-api');

// Replace with your Telegram bot token
const bot = new TelegramBot('6530554561:AAF1sBxbXbJzrDDRS1N4M99Xq27PJlLRfl0', { polling: true });

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    console.log(`Your Chat ID: ${chatId}`);
});

// Start listening for messages
bot.startPolling();

// 636300458