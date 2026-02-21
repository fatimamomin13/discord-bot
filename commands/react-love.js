module.exports = {
	name: "react-love",
	description: "Reply to a message to react with all heart emojis",
	async execute(message, args) {
		if (!message.reference) {
			return message.channel.send(
				"❌ Reply to a message with `$react-love` to react with hearts.",
			);
		}

		try {
			const targetMessage = await message.channel.messages.fetch(
				message.reference.messageId,
			);

			const hearts = [
				"❤️",
				"😘",
				"😍",
				"🥵",
				"🤯",
				"😻",
				"💖",
				"💝",
				"💘",
				"💕",
				"❤️‍🔥",
				"💐",
				"💋",
				"💓",
				"💗",
				"💟",
				"💞",
				"❣️",
			];

			for (const heart of hearts) {
				await targetMessage.react(heart);
			}

			// Delete the command message to keep it clean
			await message.delete().catch(() => {});
		} catch (error) {
			console.error("Error reacting with hearts:", error);
			message.channel.send(
				"❌ Could not react. Make sure I have the right permissions.",
			);
		}
	},
};
