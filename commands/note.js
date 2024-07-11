const getRandomElement = require("../utils/getRandomElement");

module.exports = {
    name: "note",
    description: "send a random note",
    execute(message, args) {
        const notes = [
            "my fav place is inside your hug 💚",
            "I can't stop smiling around you, you make me so happy 💙",
            "Thank you for putting up with me 🧡",
            "You are my home 💜",
            "I feel so safe in your arms ❤️",
            "I can't wait until I can see you again 💚",
            "I'd do anything to see you smile 💙",
            "I appreciate you for working so hard 🧡",
            "I am so grateful for everything we have together 💜",
            "Thank you for being understanding and supportive ❤️",
            "I am so grateful for everything we have together 💙",
        ];
        const randomNote = getRandomElement(notes);
        message.channel.send(randomNote);
    },
};
