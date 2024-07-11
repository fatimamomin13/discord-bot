const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "poll",
    description: "Creating a poll",
    async execute(message, args) {
        const filter = (m) => m.author.id === message.author.id;
        message.channel.send("Please enter the poll question:");

        const questionCollector = await message.channel.awaitMessages({
            filter,
            max: 1,
            time: 60000,
        });
        if (!questionCollector.size)
            return message.channel.send("You did not enter any question!");

        const question = questionCollector.first().content;

        message.channel.send(
            "Please enter poll options separated by commas (e.g., Option 1, Option 2, Option 3, etc)"
        );

        const optionCollector = await message.channel.awaitMessages({
            filter,
            max: 1,
            time: 60000,
        });

        if (!optionCollector.size)
            return message.channel.send("You did not enter any option!");

        const options = optionCollector
            .first()
            .content.split(",")
            .map((opt) => opt.trim());
        if (options.length < 2)
            return message.channel.send("You must enter atleast two options!");

        const reactionEmojis = ["🟥", "🟪", "🟦", "🟩", "🟨", "🟧"];
        
        const pollEmbd = new EmbedBuilder()
            .setTitle("Poll")
            .setDescription(question)
            .setColor(0x00ae86);
        options.forEach((option, index) => {
            pollEmbd.addFields({
                name: `Option ${index + 1} ${reactionEmojis[index]}`,
                value: option,
                inline: false,
            });
        });

        const pollMsg = await message.channel.send({ embeds: [pollEmbd] });

        for (let i = 0; i < options.length && i < reactionEmojis.length; i++) {
            await pollMsg.react(reactionEmojis[i]);
        }
    },
};
