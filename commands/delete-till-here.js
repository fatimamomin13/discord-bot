module.exports = {
	name: "delete-till-here",
	description:
		"Reply to a message to delete all messages from that point onwards",
	async execute(message, args) {
		// Check if user has permission to manage messages
		if (!message.member.permissions.has("ManageMessages")) {
			return message.channel.send(
				"❌ You need **Manage Messages** permission to use this.",
			);
		}

		// Must be a reply
		if (!message.reference) {
			return message.channel.send(
				"❌ Reply to a message with `$delete-till-here` to delete from that point.",
			);
		}

		try {
			const targetMessageId = message.reference.messageId;

			// Fetch messages between target and current
			const fetched = await message.channel.messages.fetch({
				after: targetMessageId,
				limit: 100,
			});

			// Include the target message itself
			const targetMessage =
				await message.channel.messages.fetch(targetMessageId);

			const toDelete = [targetMessage, ...fetched.values()];

			// Discord bulkDelete only works on messages < 14 days old
			const now = Date.now();
			const fresh = toDelete.filter(
				(m) => now - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000,
			);
			const old = toDelete.filter(
				(m) => now - m.createdTimestamp >= 14 * 24 * 60 * 60 * 1000,
			);

			// Bulk delete fresh messages (2-100 at a time)
			if (fresh.length >= 2) {
				await message.channel.bulkDelete(fresh, true);
			} else if (fresh.length === 1) {
				await fresh[0].delete();
			}

			// Delete old messages one by one
			for (const msg of old) {
				await msg.delete();
			}
		} catch (error) {
			console.error("Error deleting messages:", error);
			message.channel.send(
				"❌ Failed to delete messages. Make sure I have the right permissions.",
			);
		}
	},
};
