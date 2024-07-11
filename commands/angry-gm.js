module.exports = {
    name: "angry-gm",
    description: "Send good morning message when angry",
    execute(message, args) {
        message.channel.send("Good morning, have a nice day");
    },
};
