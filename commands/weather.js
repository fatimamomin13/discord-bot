const axios = require("axios");
const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "weather",
    description: "Show Weather Update",
    async execute(message, args) {
        if (args.length === 0) {
            return message.channel.send("Please specify city with command.");
        }

        const city = args.join(" ");
        const geoApiKey = process.env.OPENWEATHER_KEY;
        const apiKey = process.env.OPENWEATHER_KEY;
        try {
            const geoResponse = await axios.get(
                `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${geoApiKey}`
            );
            if (geoResponse.data.length == 0) {
                return message.channel.send("City not found.");
            } else {
                console.log("Lat and Lon fetched successfully");
            }

            const { lat, lon, name } = geoResponse.data[0];
            console.log(lat, lon);
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
            const response = await axios.get(url);
            const weather = response.data;
            const temp = weather.main.temp;
            const description = weather.weather[0].description;
            const humidity = weather.main.humidity;
            const windSpeed = weather.wind.speed;
            const weatherEmbed = new EmbedBuilder()
                .setTitle(`Weather in ${name}`)
                .addFields(
                    {
                        name: `Temperature`,
                        value: `${temp} °C`,
                        inline: true,
                    },
                    {
                        name: `Description`,
                        value: description,
                        inline: true,
                    },
                    {
                        name: `Humidity`,
                        value: `${humidity} %`,
                        inline: false,
                    },
                    {
                        name: `Wind Speed`,
                        value: `${windSpeed} m/s`,
                        inline: true,
                    }
                )
                .setFooter({
                    text: "Weather data provided by open weather map",
                }).setTimestamp()
            message.channel.send({ embeds: [weatherEmbed] });
        } catch (error) {
            console.error(`Error while fetching weather data:`, error);
            message.channel.send(
                `Sorry I couldn't fetch the weather for you city.`
            );
        }
    },
};
