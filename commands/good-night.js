module.exports = {
	name: "good-night",
	description: "Send good night message",
	execute(message, args) {
		message.channel.send(
			"Good night Jan\nMiss you Boo Boo\nLove you Princess\nBi",
		);
	},
};
