const fetch = require('node-fetch');
const axios = require('axios');
const fs = require('fs');
const sharp = require('sharp');
const cheerio = require('cheerio');
const { Telegraf } = require('telegraf');
const { scheduleJob } = require('node-schedule');
const { error } = require('console');

const BOT_TOKEN = '6530554561:AAF1sBxbXbJzrDDRS1N4M99Xq27PJlLRfl0';
//const subreddit = 'Kurisutina';
const subreddit = 'ChurchOfRyo';
// const subreddit = 'hentai';
const CHAT_ID_LIST_FILE = 'chatIdList.json';

const bot = new Telegraf(BOT_TOKEN);
let chatIdList = [];

try {
    const data = fs.readFileSync(CHAT_ID_LIST_FILE, 'utf8');
    chatIdList = JSON.parse(data);
    console.log('Loaded chat ID list:', chatIdList);
} catch (err) {
    console.error('Error loading chat ID list:', err);
}

function saveChatIdList() {
    fs.writeFileSync(CHAT_ID_LIST_FILE, JSON.stringify(chatIdList), 'utf8');
    console.log('Saved chat ID list:', chatIdList);
}

bot.start((ctx) => {
    const chatId = ctx.message.chat.id;
    console.log(chatIdList)
    if (!chatIdList.includes(chatId)) {
        chatIdList.push(chatId);
        saveChatIdList();
        console.log(chatIdList);
    }
    ctx.reply(`Welcome to the ${subreddit} Bot! Send /getimage to get a random image from /r/${subreddit}. Or wait till 8 p.m. GMT+1 to get an image`);
    console.log(chatIdList)
});

async function getRandomImage() {
    try {
        while (true) {
            const response = await fetch(`https://www.reddit.com/r/${subreddit}/random.json`);
            const data = await response.json();

            if (data && data[0] && data[0].data && data[0].data.children && data[0].data.children.length > 0) {
                const post = data[0].data.children[0].data;

                if (post.url && (post.url.endsWith('.jpg') || post.url.endsWith('.png'))) {
                    return {
                        imageUrl: post.url,
                        title: `${post.title}\nImage URL: ${post.url}`,
                    };
                }
            }
        }
    } catch (error) {
        console.error('Error fetching or processing the random post:', error);
        throw error;
    }
}


async function sendTopPost() {
    try {
        const response = await axios.get(`https://www.reddit.com/r/${subreddit}/top.json?limit=1`);
        const topPost = response.data.data.children[0].data;

        if (topPost.url && (topPost.url.endsWith('.jpg') || topPost.url.endsWith('.png'))) {
            const imageUrl = topPost.url;
            const title = `${topPost.title}\nImage URL: ${imageUrl}`;
            return { imageUrl, title };
        } else {
            console.error('No top post found or missing URL.');
        }
    } catch (error) {
        console.error('Error fetching or sending the top post:', error);
    }
}

async function resizeImage(imageUrl) {
    try {
        const resizedImageBuffer = await sharp({
            create: {
                width: 1000,
                height: 100,
                channels: 4, // 4 channels for RGBA
                background: { r: 255, g: 255, b: 255, alpha: 1 }, // White background
            },
        })
            .composite([{ input: imageUrl }])
            .toBuffer();

        return `data:image/jpeg;base64,${resizedImageBuffer.toString('base64')}`;
    } catch (error) {
        console.error('Error resizing the image:', error);
        return null;
    }
}

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
        sendTopPost()
            .then(async ({ imageUrl, title }) => {
                const resizedImageUrl = await resizeImage(imageUrl);
                bot.telegram.sendMessage(chatId, "Hey there, catch a photo and it'll make your day better :)");
                bot.telegram.sendPhoto(chatId, { url: resizedImageUrl }, { caption: title });
                console.log(`Image URL (${imageUrl}) sent to chat ID: ${chatId}`);
            })
            .catch((error) => {
                console.error(error);
                bot.telegram.sendMessage(chatId, 'An error occurred while fetching the image for the scheduled message.');
            });
    });
});

bot.launch();