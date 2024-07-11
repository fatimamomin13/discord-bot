module.exports = {
    name: "goodmorning",
    description: "Send goodmorning message",
    execute(message, args) {
        message.channel.send("Good morning babe! ❤️ \n Have a nice day🌻");
    },
};
