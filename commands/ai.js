const Bottleneck = require("bottleneck");
const NodeCache = require("node-cache");
const { OpenAI } = require("openai");

// Configure OpenAI client to use DeepInfra
const openai = new OpenAI({
	apiKey: process.env.DEEPINFRA_API_KEY,
	baseURL: "https://api.deepinfra.com/v1/openai",
});

const limiter = new Bottleneck({
	minTime: 3000,
	maxConcurrent: 1,
});

const cache = new NodeCache({ stdTTL: 600 });

// Per-channel conversation history (last N messages for context)
const conversationHistory = new Map();
const MAX_HISTORY = 10;

// AI Personas users can switch between
const PERSONAS = {
	default: {
		name: "Assistant",
		prompt: "You are a helpful AI assistant that provides brief, accurate summaries and explanations. Keep your responses concise and informative, typically 2-3 sentences unless more detail is specifically needed.",
	},
	funny: {
		name: "Comedian",
		prompt: "You are a witty and humorous AI. You answer questions accurately but always with a comedic twist. Use puns, jokes, and playful language. Keep responses concise.",
	},
	poet: {
		name: "Poet",
		prompt: "You are a poetic AI. You respond in a lyrical, expressive style. Use metaphors and vivid imagery. Keep it short but beautiful.",
	},
	savage: {
		name: "Savage",
		prompt: "You are a brutally honest but lovable AI with a sarcastic edge. You roast gently while still being helpful. Keep it playful, never mean-spirited.",
	},
	therapist: {
		name: "Therapist",
		prompt: "You are a warm, empathetic AI therapist. You listen carefully, validate feelings, and offer gentle guidance. Keep responses supportive and concise.",
	},
};

// Per-channel persona selection
const channelPersonas = new Map();

async function requestWithRetry(requestFunc, retries = 5, delay = 1000) {
	for (let attempt = 0; attempt < retries; attempt++) {
		try {
			return await requestFunc();
		} catch (error) {
			if (attempt >= retries - 1) throw error;
			const backoffDelay = delay * Math.pow(2, attempt);
			console.log(
				`Retrying in ${backoffDelay}ms... (attempt ${attempt + 1}/${retries})`,
			);
			await new Promise((r) => setTimeout(r, backoffDelay));
		}
	}
}

function getHistory(channelId) {
	if (!conversationHistory.has(channelId)) {
		conversationHistory.set(channelId, []);
	}
	return conversationHistory.get(channelId);
}

function addToHistory(channelId, role, content) {
	const history = getHistory(channelId);
	history.push({ role, content });
	if (history.length > MAX_HISTORY * 2) {
		history.splice(0, 2); // Remove oldest pair
	}
}

async function sendLongMessage(channel, text) {
	if (text.length <= 2000) {
		return channel.send(text);
	}
	// Split at newlines or spaces, respecting 2000 char limit
	const parts = text.match(/[\s\S]{1,1950}/g) || [];
	for (const part of parts) {
		await channel.send(part);
	}
}

async function fetchConversationHistory(message, targetMessage, limit = 30) {
	try {
		const messages = await message.channel.messages.fetch({
			limit,
			before: message.id,
		});

		const sorted = Array.from(messages.values()).sort(
			(a, b) => a.createdTimestamp - b.createdTimestamp,
		);

		const targetIndex = sorted.findIndex((m) => m.id === targetMessage.id);
		const relevant =
			targetIndex !== -1 ? sorted.slice(targetIndex) : sorted;

		const conversationText = relevant
			.filter((m) => !m.author.bot)
			.map((m) => {
				const time = m.createdAt.toLocaleTimeString();
				return `[${time}] ${m.author.username}: ${m.content}`;
			})
			.join("\n");

		return {
			conversationText,
			messageCount: relevant.length,
			participants: [...new Set(relevant.map((m) => m.author.username))],
		};
	} catch (error) {
		console.error("Error fetching conversation history:", error);
		return null;
	}
}

async function handleAnalyze(message) {
	try {
		const repliedMessage = await message.channel.messages.fetch(
			message.reference.messageId,
		);

		const thinkingMsg = await message.channel.send(
			"🔍 Analyzing the conversation...",
		);

		const history = await fetchConversationHistory(
			message,
			repliedMessage,
			30,
		);

		if (!history?.conversationText) {
			return thinkingMsg.edit(
				"❌ Could not retrieve conversation history.",
			);
		}

		console.log(
			`Analyzing ${history.messageCount} messages from ${history.participants.join(", ")}`,
		);

		await limiter.schedule(async () => {
			try {
				const response = await requestWithRetry(async () => {
					return openai.chat.completions.create({
						model: "meta-llama/Meta-Llama-3.1-70B-Instruct",
						messages: [
							{
								role: "system",
								content: `You are a thoughtful relationship counselor and communication expert. Analyze conversations between couples with empathy, fairness, and wisdom. Your goal is to:
1. Identify the core issues and misunderstandings
2. Acknowledge valid points from both sides
3. Avoid assigning blame, but gently point out communication patterns that could improve
4. Provide actionable advice for better understanding
5. Be warm, supportive, and constructive

Format your response with:
📊 **Situation Overview**
💭 **Each Person's Perspective**
🎯 **Key Insights**
💡 **Suggestions for Better Communication**
❤️ **Moving Forward Together**`,
							},
							{
								role: "user",
								content: `Please analyze this conversation and provide helpful insights:\n\n${history.conversationText}\n\nParticipants: ${history.participants.join(", ")}\n\nHelp them understand each other better and suggest how they can communicate more effectively.`,
							},
						],
						max_tokens: 1500,
						temperature: 0.8,
					});
				});

				const analysis = response.choices[0].message.content;
				await thinkingMsg.delete();
				await sendLongMessage(message.channel, analysis);
			} catch (error) {
				console.error("Analysis error:", error.message);
				await thinkingMsg.edit(
					"❌ Could not complete the analysis. Please try again.",
				);
			}
		});
	} catch (error) {
		console.error("Error with analyze command:", error);
		message.channel.send(
			"❌ Could not analyze. Make sure you're replying to a message.",
		);
	}
}

async function handleSummarize(message) {
	try {
		const thinkingMsg = await message.channel.send(
			"📝 Summarizing recent conversation...",
		);

		const messages = await message.channel.messages.fetch({
			limit: 50,
			before: message.id,
		});
		const sorted = Array.from(messages.values())
			.sort((a, b) => a.createdTimestamp - b.createdTimestamp)
			.filter((m) => !m.author.bot)
			.map((m) => `${m.author.username}: ${m.content}`)
			.join("\n");

		if (!sorted) {
			return thinkingMsg.edit("❌ No messages to summarize.");
		}

		await limiter.schedule(async () => {
			try {
				const response = await requestWithRetry(async () => {
					return openai.chat.completions.create({
						model: "meta-llama/Meta-Llama-3.1-70B-Instruct",
						messages: [
							{
								role: "system",
								content:
									"Summarize the following Discord conversation concisely. Highlight key topics, decisions, and action items. Use bullet points.",
							},
							{ role: "user", content: sorted },
						],
						max_tokens: 800,
						temperature: 0.5,
					});
				});

				await thinkingMsg.delete();
				await sendLongMessage(
					message.channel,
					`📋 **Conversation Summary**\n\n${response.choices[0].message.content}`,
				);
			} catch (error) {
				console.error("Summarize error:", error.message);
				await thinkingMsg.edit(
					"❌ Could not summarize. Please try again.",
				);
			}
		});
	} catch (error) {
		console.error("Summarize error:", error);
		message.channel.send("❌ Failed to summarize conversation.");
	}
}

module.exports = {
	name: "ai",
	description:
		"AI assistant with conversation memory, personas, and analysis",
	async execute(message, query) {
		if (!query) {
			return message.channel.send(
				"**🤖 AI Commands:**\n" +
					"`?<question>` — Ask me anything\n" +
					"`?analyze` — Reply to a message to analyze the conversation\n" +
					"`?summarize` — Summarize recent chat\n" +
					"`?persona <name>` — Switch AI personality (default, funny, poet, savage, therapist)\n" +
					"`?persona` — Show current persona\n" +
					"`?clear` — Clear conversation memory\n",
			);
		}

		const lowerQuery = query.toLowerCase();

		// Handle special sub-commands
		if (message.reference && lowerQuery === "analyze") {
			return handleAnalyze(message);
		}

		if (lowerQuery === "summarize") {
			return handleSummarize(message);
		}

		if (lowerQuery === "clear") {
			conversationHistory.delete(message.channel.id);
			return message.channel.send(
				"🧹 Conversation memory cleared for this channel.",
			);
		}

		if (lowerQuery.startsWith("persona")) {
			const personaName = lowerQuery.split(" ")[1];
			if (!personaName) {
				const current =
					channelPersonas.get(message.channel.id) || "default";
				const list = Object.entries(PERSONAS)
					.map(
						([key, val]) =>
							`\`${key}\` — ${val.name}${key === current ? " ✅" : ""}`,
					)
					.join("\n");
				return message.channel.send(
					`**🎭 AI Personas:**\n${list}\n\nUse \`?persona <name>\` to switch.`,
				);
			}
			if (!PERSONAS[personaName]) {
				return message.channel.send(
					`❌ Unknown persona. Available: ${Object.keys(PERSONAS).join(", ")}`,
				);
			}
			channelPersonas.set(message.channel.id, personaName);
			conversationHistory.delete(message.channel.id); // Reset history on persona change
			return message.channel.send(
				`🎭 Switched to **${PERSONAS[personaName].name}** persona!`,
			);
		}

		// Regular AI query with conversation context
		const cachedResponse = cache.get(query);
		if (cachedResponse) {
			return message.channel.send(cachedResponse);
		}

		const personaKey = channelPersonas.get(message.channel.id) || "default";
		const persona = PERSONAS[personaKey];

		// Build messages with history
		addToHistory(message.channel.id, "user", query);
		const history = getHistory(message.channel.id);

		const apiMessages = [
			{ role: "system", content: persona.prompt },
			...history,
		];

		await limiter.schedule(async () => {
			try {
				const response = await requestWithRetry(async () => {
					return openai.chat.completions.create({
						model: "meta-llama/Meta-Llama-3.1-70B-Instruct",
						messages: apiMessages,
						max_tokens: 200,
						temperature: 0.7,
					});
				});

				const reply = response.choices[0].message.content;
				addToHistory(message.channel.id, "assistant", reply);
				cache.set(query, reply);
				await sendLongMessage(message.channel, reply);
			} catch (error) {
				console.error("AI error:", error.message);

				if (error.status === 401) {
					message.channel.send(
						"❌ Authentication failed. Check the API key.",
					);
				} else if (error.status === 429) {
					message.channel.send(
						"⏳ Rate limited. Try again in a moment.",
					);
				} else {
					message.channel.send(
						`❌ Error: ${error.message || "Unknown error"}`,
					);
				}
			}
		});
	},
};
