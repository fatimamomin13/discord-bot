const axios = require("axios");

// Track active loops per channel
const activeLoops = new Map();

module.exports = {
	name: "miss",
	description: "Send miss you messages with gifs (e.g. $miss-10)",
	activeLoops,
	async execute(message, args) {
		const match = message.content.match(/\$miss-(\d+)/i);
		const count = match ? parseInt(match[1]) : 1;

		if (!count || count < 1) {
			return message.channel.send(
				"Usage: `$miss-<number>` (e.g. `$miss-10`)",
			);
		}

		const giphyKey = process.env.GIPHY_API_KEY;
		if (!giphyKey) {
			return message.channel.send(
				"❌ GIPHY API key not configured. Add GIPHY_API_KEY to your .env file.",
			);
		}

		const missMessage = "I miss you so much Jan 🥺💔";
		const cap = Math.min(count, 50);

		// Fetch random GIFs from GIPHY API
		let gifs = [];
		try {
			const response = await axios.get(
				"https://api.giphy.com/v1/gifs/search",
				{
					params: {
						api_key: giphyKey,
						q: "miss you cute",
						limit: Math.min(cap, 50),
						rating: "pg",
					},
				},
			);
			gifs = response.data.data || [];
		} catch (error) {
			console.error("GIPHY API error:", error.message);
			return message.channel.send(
				"❌ Could not fetch GIFs. Try again later.",
			);
		}

		if (gifs.length === 0) {
			return message.channel.send("❌ No GIFs found.");
		}

		activeLoops.set(message.channel.id, true);

		for (let i = 0; i < cap; i++) {
			if (!activeLoops.get(message.channel.id)) break;

			const gif = gifs[i % gifs.length];
			const gifUrl = gif.images?.original?.url;

			if (gifUrl) {
				await message.channel.send(missMessage);
				await message.channel.send(gifUrl);
			}
		}

		activeLoops.delete(message.channel.id);
	},
};
