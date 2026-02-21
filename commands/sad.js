module.exports = {
	name: "sad",
	description: "Send sad emojis (e.g. $sad-100)",
	async execute(message, args) {
		// The command comes in as "sad-100", so parse the number from the original message
		const match = message.content.match(/\$sad-(\d+)/i);
		const count = match ? parseInt(match[1]) : 0;

		if (!count || count < 1) {
			return message.channel.send(
				"Usage: `$sad-<number>` (e.g. `$sad-100`)",
			);
		}

		const cap = Math.min(count, 2000); // Discord 2000 char limit
		const emojis = "😢".repeat(cap);

		// Split if it exceeds 2000 chars (each emoji is 2 chars in length but unicode may vary)
		if (emojis.length <= 2000) {
			message.channel.send(emojis);
		} else {
			const parts = emojis.match(/.{1,2000}/gs) || [];
			for (const part of parts) {
				await message.channel.send(part);
			}
		}
	},
};
