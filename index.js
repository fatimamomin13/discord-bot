require("dotenv/config");
const fs = require("fs");
const path = require("path");
const Bottleneck = require("bottleneck");
const NodeCache = require("node-cache");
const { Client, Collection } = require("discord.js");
const { OpenAI } = require("openai");

const client = new Client({
    intents: [
        "Guilds",
        "GuildMembers",
        "GuildMessages",
        "MessageContent",
        "GuildMessageReactions",
    ],
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY,
});

const limiter = new Bottleneck({
    minTime: 3000, // 3 seconds between requests
    maxConcurrent: 1,
});

const cache = new NodeCache({ stdTTL: 600 }); // Cache responses for 10 minutes

client.commands = new Collection();

const commandFiles = fs
    .readdirSync(path.join(__dirname, "commands"))
    .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

client.on("ready", () => {
    console.log("The bot is online");
});

IGNORE_PREFIX = "$";
AI_PREFIX = "?";
BOT_PREFIX = "/";

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (message.content.startsWith(IGNORE_PREFIX)) return;

    const content = message.content.trim(); //This line removes any leading and trailing whitespace from the message content.
    const prefix = content.charAt(0); //This line extracts the first character of the trimmed message content, which is expected to be the prefix.
    const args = content.slice(1).split(/ +/);
    const commandName = args.shift().toLowerCase(); //This line extracts the rest of the message content after the prefix and converts it to lowercase.

    if (prefix == BOT_PREFIX) {
        const command = client.commands.get(commandName);
        if (command) {
            try {
                command.execute(message, args);
            } catch (error) {
                console.log(error);
                message.channel.send(
                    "There was an error executing the command."
                );
            }
        } else {
            message.channel.send("Sorry, no such command exist.");
        }
        return;
    }

    async function requestWithExponentialBackoff(
        requestFunc,
        retries = 5,
        delay = 1000
    ) {
        let attempt = 0;
        while (attempt < retries) {
            try {
                return await requestFunc();
            } catch (error) {
                attempt++;
                if (attempt >= retries) throw error;
                const backoffDelay = delay * Math.pow(2, attempt);
                console.log(`Retrying in ${backoffDelay} ms...`);
                await new Promise((resolve) =>
                    setTimeout(resolve, backoffDelay)
                );
            }
        }
    }

    if (prefix == AI_PREFIX) {
        const cachedResponse = cache.get(message.content);
        if (cachedResponse) {
            message.channel.send(cachedResponse);
            return;
        }

        limiter.schedule(async () => {
            try {
                const response = await requestWithExponentialBackoff(
                    async () => {
                        return await openai.chat.completions.create({
                            model: "gpt-3.5-turbo",
                            messages: [
                                {
                                    role: "system",
                                    content:
                                        "Hi I am know it all, I literally know it all",
                                },
                                {
                                    role: "user",
                                    content: message.content,
                                },
                            ],
                        });
                    }
                );
                const replyContent = response.choices[0].message.content;
                cache.set(message.content, replyContent);
                message.channel.send(replyContent);
            } catch (error) {
                console.error("OpenAI Error :\n", error);
                message.channel.send(
                    "I'm currently experiencing high traffic. Please try again later."
                );
            }
        });
    }
});

client.login(process.env.TOKEN);
