const fetch = require('node-fetch');
const { Telegraf } = require('telegraf');
const { scheduleJob } = require('node-schedule');

const BOT_TOKEN = '6530554561:AAF1sBxbXbJzrDDRS1N4M99Xq27PJlLRfl0';
const subreddit = 'ChurchOfRyo';

const bot = new Telegraf(BOT_TOKEN);

// Initialize an array to store chat IDs
const chatIdList = [];

bot.start((ctx) => {
    const chatId = ctx.message.chat.id;

    if (!chatIdList.includes(chatId)) {
        chatIdList.push(chatId);
    }
    ctx.reply('Welcome to the Church Of Ryo Bot! Send /getimage to get a random image from /r/ChurchOfRyo. Or wait till 8 p.m. GMT+1 to get an image');
});

async function getRandomImage() {
    while (true) {
        const response = await fetch(`https://www.reddit.com/r/${subreddit}/random.json`);
        const data = await response.json();

        if (
            data[0].data.children[0].data.url.endsWith('.jpg') ||
            data[0].data.children[0].data.url.endsWith('.png')
        ) {
            const post = data[0].data.children[0].data;
            return {
                imageUrl: post.url,
                title: `${post.title}\nImage URL: ${post.url}`,
            }
}}}

bot.command('getimage', async (ctx) => {
    try {
        const { imageUrl, title } = await getRandomImage();
        ctx.replyWithPhoto({ url: imageUrl }, { caption: title });
    } catch (error) {
        console.error(error);
        ctx.reply('An error occurred while fetching the image. Please try again later.');
    }
});

// Schedule a message to be sent every day at 8 p.m. to users in the chat ID list
const job = scheduleJob('0 20 * * *', () => {
    chatIdList.forEach((chatId) => {
        getRandomImage()
            .then(({ imageUrl, title }) => {
                bot.telegram.sendMessage(chatId, "Hey there, catch a photo and it'll make your day better :)");
                bot.telegram.sendPhoto(chatId, { url: imageUrl }, { caption: title });
                console.log(imageUrl + ' was sent to ' + chatId);
            })
            .catch((error) => {
                console.error(error);
                bot.telegram.sendMessage(chatId, 'An error occurred while fetching the image for the scheduled message.');
            });
    });
});

bot.launch();