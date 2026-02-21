module.exports = {
	name: "send-selfie",
	description: "Ask for a selfie!",
	execute(message, args) {
		message.channel.send(`${message.author} needs some vitamin selfie 📸`);
	},
};
