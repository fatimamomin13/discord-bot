const { EmbedBuilder } = require("discord.js");

module.exports = {
	name: "help",
	description: "Show all available commands",
	execute(message, args) {
		const commands = message.client.commands;

		const embed = new EmbedBuilder()
			.setTitle("📖 Bot Commands")
			.setColor(0x5865f2)
			.setDescription("Here are all the available commands:")
			.setFooter({ text: "Prefix: $ for commands | ? for AI" });

		commands.forEach((cmd) => {
			if (cmd.name !== "ai") {
				embed.addFields({
					name: `$${cmd.name}`,
					value: cmd.description || "No description",
					inline: true,
				});
			}
		});

		embed.addFields(
			{
				name: "\u200B",
				value: "**🤖 AI Commands (use ? prefix)**",
				inline: false,
			},
			{ name: "?<question>", value: "Ask the AI anything", inline: true },
			{
				name: "?analyze",
				value: "Reply to a message to analyze conversation",
				inline: true,
			},
			{
				name: "?summarize",
				value: "Summarize recent chat",
				inline: true,
			},
			{ name: "?persona", value: "Switch AI personality", inline: true },
			{
				name: "?clear",
				value: "Clear AI conversation memory",
				inline: true,
			},
		);

		message.channel.send({ embeds: [embed] });
	},
};
