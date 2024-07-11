const { EmbedBuilder } = require("@discordjs/builders");
const getRandomElement = require("../utils/getRandomElement");

module.exports = {
    name: "magic8ball",
    description: "Ask question to know your fortune",
    async execute(message, args) {
        const filter = (m) => m.author.id === message.author.id;
        message.channel.send("Ask you question and trust the future... 🔮");
        const questionCollector = await message.channel.awaitMessages({
            filter,
            max: 1,
            time: 60000,
        });
        if (!questionCollector.size) {
            return message.channel.send("you did not enter any question");
        }

        const answers = [
            "🍀 It is certain",
            "🍀 It is decidedly so",
            "🍀 Without a doubt",
            "🍀 Yes definitely",
            "🍀 You may rely on it",
            "🍀 As I see it, yes",
            "🍀 Most likely",
            "🍀 Outlook good",
            "🍀 Yes",
            "🍀 Signs point to yes",
            "🤞🏼 Reply hazy, try again",
            "🤞🏼 Ask again later",
            "🤞🏼 Better not tell you now",
            "🤞🏼 Cannot predict now",
            "🤞🏼 Concentrate and ask again",
            "☠️ Don't count on it",
            "☠️ My reply is no",
            "☠️ My sources say no",
            "☠️ Outlook not so good",
            "☠️ Very doubtful",
        ];

        const result = getRandomElement(answers);

        const magicEmbed = new EmbedBuilder()
            .setTitle("Magic 8 Ball 🎱 says..")
            .setDescription(result);

        message.channel.send({ embeds: [magicEmbed] });
    },
};
