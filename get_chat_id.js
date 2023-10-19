const TelegramBot = require('node-telegram-bot-api');

// Replace with your Telegram bot token
TELEGRAM BOT API KEY', { polling: true });

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    console.log(`Your Chat ID: ${chatId}`);
});

// Start listening for messages
bot.startPolling();

// 636300458