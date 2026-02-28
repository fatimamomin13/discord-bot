require("dotenv/config");
const fs = require("fs");
const path = require("path");
const { Client, Collection } = require("discord.js");

const client = new Client({
	intents: [
		"Guilds",
		"GuildMembers",
		"GuildMessages",
		"MessageContent",
		"GuildMessageReactions",
	],
});

client.commands = new Collection();

const commandFiles = fs
	.readdirSync(path.join(__dirname, "commands"))
	.filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}
console.log("Loaded commands:", [...client.commands.keys()]);


client.on("ready", () => {
	console.log(`✅ ${client.user.tag} is online`);
	console.log(`📌 Bot prefix: $`);
	console.log(`🤖 AI prefix: ?`);
	console.log(`🔇 Ignore prefix: !`);
});

const IGNORE_PREFIX = "!";
const AI_PREFIX = "?";
const BOT_PREFIX = "$";

client.on("messageCreate", async (message) => {
	if (message.author.bot) return;
	if (message.content.startsWith(IGNORE_PREFIX)) return;

	const content = message.content.trim();
	const prefix = content.charAt(0);

	// Handle bot commands ($command)
	if (prefix === BOT_PREFIX) {
		const args = content.slice(1).split(/ +/);
		const commandName = args.shift().toLowerCase();

		// Try exact match first, then try matching just the base name (e.g. "sad" from "sad-100")
		let command = client.commands.get(commandName);
		if (!command) {
			const baseName = commandName.split("-")[0];
			command = client.commands.get(baseName);
		}
		if (command) {
			try {
				await command.execute(message, args);
			} catch (error) {
				console.error(
					`Error executing command "${commandName}":`,
					error,
				);
				message.channel.send(
					"❌ There was an error executing the command.",
				);
			}
		} else {
			message.channel.send(
				`❌ Unknown command: \`$${commandName}\`. Use \`$help\` to see available commands.`,
			);
		}
		return;
	}

	// Handle AI queries (?query)
	if (prefix === AI_PREFIX) {
		const aiCommand = client.commands.get("ai");
		if (aiCommand) {
			try {
				await aiCommand.execute(message, content.slice(1).trim());
			} catch (error) {
				console.error("Error executing AI command:", error);
				message.channel.send("❌ AI command failed. Please try again.");
			}
		}
		return;
	}
});

client.login(process.env.TOKEN);
