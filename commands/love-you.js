const getRandomElement = require("../utils/getRandomElement");

module.exports = {
    name: "love-you",
    description: "send love you message and gif",
    execute(message, args) {
        const data = {
            message: [
                "I love you ❤️",
                "I love you 💜",
                "I love you 💞",
                "I love you 💙",
                "I love you 💘",
            ],
            gif: [
                "https://media.tenor.com/tO85mO366xYAAAAi/amore-love-you.gif",
                "https://media.tenor.com/iFXnOUD2D7oAAAAi/milk-and-mocha.gif",
                "https://media.tenor.com/l387R18yzSUAAAAi/cosytales-flirt.gif",
                "https://media.tenor.com/OzNPe52enwwAAAAi/mochi-cat-love.gif",
                "https://media.tenor.com/nIZyihQNicAAAAAi/cosytales-cute.gif",
                "https://media.tenor.com/0oox4ceUlJsAAAAi/mochi-cat-hi.gif",
            ],
        };

        const randomMessage = getRandomElement(data.message);
        const randomGif = getRandomElement(data.gif);
        message.channel.send(randomMessage);
        message.channel.send(randomGif);
    },
};
