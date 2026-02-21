module.exports = {
	name: "stop",
	description: "Stop any active loop command (e.g. sorry, miss)",
	execute(message, args) {
		const loopCommands = ["sorry", "miss"];
		let stopped = false;

		for (const name of loopCommands) {
			const cmd = message.client.commands.get(name);
			if (cmd?.activeLoops?.get(message.channel.id)) {
				cmd.activeLoops.set(message.channel.id, false);
				stopped = true;
			}
		}

		if (stopped) {
			message.channel.send("⏹️ Stopped!");
		} else {
			message.channel.send("Nothing running to stop.");
		}
	},
};
