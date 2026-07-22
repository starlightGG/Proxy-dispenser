require('dotenv').config()

const { Client, GatewayIntentBits, REST, Routes, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ActivityType, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
});
const fs = require('node:fs');

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require("./commands/" + file);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
	try {
		const data = await rest.put(
			Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
			{ body: commands },
		);
	} catch (error) {
		console.error(error);
	}
})();

client.on("ready", () => {
	client.user.setPresence({
		activities: [{ name: "with proxies", type: ActivityType.Playing }],
		status: "online"
	});
})

client.on('interactionCreate', async interaction => {
	if (interaction.isChatInputCommand()) {
	if (interaction.commandName == "panel") {
        var row = new ActionRowBuilder()
        row.addComponents(
            new ButtonBuilder()
                .setCustomId("link")
                .setLabel("Get Link")
                .setStyle(ButtonStyle.Primary),
        )

		var panelEmbed = new EmbedBuilder()
			.setColor(0xF47FFF)
			.setTitle("NovaGG Dispenser")
			.setDescription("Click the button below to get a new proxy link")
			.setFooter({ text: "Made by NovaGG", iconURL: "https://avatars.githubusercontent.com/u/153460070?v=4&size=64" })

        await interaction.reply({ embeds: [ panelEmbed ], components: [ row ] })
	} else if (interaction.commandName == "admin") {
	    var row = new ActionRowBuilder()
        row.addComponents(
			new ButtonBuilder()
                .setCustomId("links")
                .setLabel("Links")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("add")
                .setLabel("Add")
                .setStyle(ButtonStyle.Success),
			new ButtonBuilder()
                .setCustomId("remove")
                .setLabel("Remove")
                .setStyle(ButtonStyle.Danger),
			new ButtonBuilder()
                .setCustomId("reset")
                .setLabel("Reset Limit")
                .setStyle(ButtonStyle.Secondary),
        )

		var panelEmbed = new EmbedBuilder()
			.setColor(0xF47FFF)
			.setTitle("Admin Panel")
			.setDescription("Admin commands for the Proxy Dispenser")
			.setFooter({ text: "Made by NovaGG", iconURL: "https://avatars.githubusercontent.com/u/153460070?v=4&size=64" })

        await interaction.reply({ embeds: [ panelEmbed ], components: [ row ] })
	}
    } else if (interaction.isButton()) {
		if (interaction.customId == "link") {
			var allLinks = JSON.parse(fs.readFileSync("data/links.json"));
			var allRequested = JSON.parse(fs.readFileSync("data/requested.json"))[interaction.user.id]
			if (allRequested) {
				allLinks = allLinks.filter(item => !allRequested.includes(item))
			}

			var randomLink = allLinks[Math.floor(Math.random() * allLinks.length)];

			if (!randomLink) {
				return interaction.reply({ content: "No Proxies Available", ephemeral: true })
			}

			var users = JSON.parse(fs.readFileSync("data/users.json"));

			if (users[interaction.user.id] && users[interaction.user.id] == 3) {
				return interaction.reply({ content: "You can no longer receive sites until the bot is reset", ephemeral: true })
			}

			var remaining = String(remaining = 3 - Number(users[interaction.user.id] || 0) - 1)

			interaction.deferUpdate()

			var proxyEmbed = new EmbedBuilder()
				.setColor(0xF47FFF)
				.setTitle("NovaGG Dispenser")
				.setDescription("Enjoy your new link")
				.addFields(
					{ name: "URL", value: randomLink },
					{ name: "Remaining", value: remaining },
					{ name: "Notice", value: "If the link is blocked click the report button below" }
				)
				.setFooter({ text: "Made by NovaGG", iconURL: "https://avatars.githubusercontent.com/u/153460070?v=4&size=64" })
			
			var row = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setURL(randomLink)
						.setLabel("Open")
						.setStyle(ButtonStyle.Link),
					new ButtonBuilder()
						.setCustomId("report")
						.setLabel("Report")
						.setStyle(ButtonStyle.Danger)
			  )
			client.users.cache.get(interaction.user.id).send({embeds: [ proxyEmbed ], components: [ row ]})	
			
			var newUsers = users;

			if (!users[interaction.user.id]) {
  				newUsers[interaction.user.id] = 1;
			} else {
				newUsers[interaction.user.id] = newUsers[interaction.user.id] + 1;
			}
			fs.writeFileSync("data/users.json", JSON.stringify(newUsers, null, 2));

			var newRequested = JSON.parse(fs.readFileSync("data/requested.json"));
			if (!newRequested[interaction.user.id]) {
				newRequested[interaction.user.id] = []
			}
			newRequested[interaction.user.id].push(randomLink)
			fs.writeFileSync("data/requested.json", JSON.stringify(newRequested, null, 2));
		} else if (interaction.customId == "report") {
			var reportModule = new ModalBuilder()
				.setCustomId("reportModule")
				.setTitle("Report");
			var reportReason = new TextInputBuilder()
				.setCustomId("reportReason")
				.setLabel("Reason")
				.setStyle(TextInputStyle.Paragraph)
				.setMaxLength(500)
  				.setRequired(true)
			
			var firstRow = new ActionRowBuilder().addComponents(reportReason);
			reportModule.addComponents(firstRow);
			await interaction.showModal(reportModule);		
		} else if (interaction.customId == "reset") {
			fs.writeFileSync("data/users.json", "{}");
			return interaction.reply({ content: "Reset bot for all users", ephemeral: true })
		} else if (interaction.customId == "closeReport") {
			var closeReportModule = new ModalBuilder()
				.setCustomId("closeReportModule")
				.setTitle("Report");
			var closeReportReason = new TextInputBuilder()
				.setCustomId("closeReportReason")
				.setLabel("Reason")
				.setStyle(TextInputStyle.Paragraph)
				.setPlaceholder('How was this resolved?')
				.setMaxLength(500)
  				.setRequired(true)
			
			var firstRow = new ActionRowBuilder().addComponents(closeReportReason);
			closeReportModule.addComponents(firstRow);
			await interaction.showModal(closeReportModule);
		} else if (interaction.customId == "add") {
			var addModule = new ModalBuilder()
				.setCustomId("addModule")
				.setTitle("Add Link");
			var linkURL = new TextInputBuilder()
				.setCustomId("linkURL")
				.setLabel("URL")
				.setStyle(TextInputStyle.Short)
				.setMaxLength(500)
  				.setRequired(true)
			
			var firstRow = new ActionRowBuilder().addComponents(linkURL);
			addModule.addComponents(firstRow);
			await interaction.showModal(addModule);	
		} else if (interaction.customId == "remove") {
			var removeModule = new ModalBuilder()
				.setCustomId("removeModule")
				.setTitle("Remove Link");
			var linkURL = new TextInputBuilder()
				.setCustomId("linkURL")
				.setLabel("URL")
				.setStyle(TextInputStyle.Short)
				.setMaxLength(500)
  				.setRequired(true)
			
			var firstRow = new ActionRowBuilder().addComponents(linkURL);
			removeModule.addComponents(firstRow);
			await interaction.showModal(removeModule);	
		} else if (interaction.customId == "links") {
			var allLinks = JSON.parse(fs.readFileSync("data/links.json"));
			if (allLinks == []) {
				allLinks = "No Links Available"
			} else {
				allLinks = allLinks.join("\n")
			}
			var linksEmbed = new EmbedBuilder()
				.setColor(0xF47FFF)
				.setTitle("Links")
				.setDescription("Every link in the database!\n```\n" + allLinks + "\n```")
				.setFooter({ text: "Made by NovaGG", iconURL: "https://avatars.githubusercontent.com/u/153460070?v=4&size=64" })
			return interaction.reply({ embeds: [ linksEmbed ], ephemeral: true })
		}
	} else if (interaction.isModalSubmit()) {
		if (interaction.customId == "reportModule") {
			var reportEmbed = new EmbedBuilder()
				.setColor(0xF47FFF)
				.setTitle("Proxy Report")
				.setDescription("A link has been reported by a user")
				.addFields(
					{ name: "URL", value: interaction.message.embeds[0].data.fields[0].value },
					{ name: "Reason", value: interaction.fields.getTextInputValue("reportReason") },
					{ name: "User", value: "<@" + interaction.user.id + ">" }
				)
				.setFooter({ text: "Made by NovaGG", iconURL: "https://avatars.githubusercontent.com/u/153460070?v=4&size=64" })
			
			var row = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId("closeReport")
						.setLabel("Close")
						.setStyle(ButtonStyle.Danger),
			  )
try {
    const reportChannel = await client.channels.fetch(process.env.REPORTS_ID);
    if (reportChannel) {
        await reportChannel.send({ embeds: [ reportEmbed ], components: [ row ] });
    }
} catch (error) {
    console.error("Failed to send report to logging channel:", error);
}

			// Disable the Report button on the original DM message so it can't be reported again
			try {
				if (!interaction.message) {
					console.error("Cannot disable report button: interaction.message is undefined");
				} else {
					var originalRow = interaction.message.components[0];
					var newRow = new ActionRowBuilder();

					for (const component of originalRow.components) {
						var btn = ButtonBuilder.from(component);
						var customId = component.customId ?? component.custom_id ?? component.data?.custom_id;

						if (customId === "report") {
							btn.setLabel("Reported").setDisabled(true);
						}

						newRow.addComponents(btn);
					}

					var dmChannel = await client.channels.fetch(interaction.channelId);
					await dmChannel.messages.edit(interaction.message.id, { components: [ newRow ] });
				}
			} catch (error) {
				console.error("Failed to disable report button:", error);
			}

			return interaction.reply({ content: "Your report has been submitted", ephemeral: true })
		} else if (interaction.customId == "closeReportModule") {
			var user = interaction.message.embeds[0].data.fields[2].value.replace("<", "").replace(">", "").replace("@", "")
			client.users.fetch(user, false).then((user) => {
			var closedReportEmbed = new EmbedBuilder()
				.setColor(0xF47FFF)
				.setTitle("Closed Report")
				.setDescription("A reported link by you has been resolved")
				.addFields(
					{ name: "URL", value: interaction.message.embeds[0].data.fields[0].value },
					{ name: "Reason", value: interaction.message.embeds[0].data.fields[1].value },
					{ name: "Response", value: interaction.fields.getTextInputValue("closeReportReason") },
					{ name: "Closed By", value: "<@" + interaction.user.id + ">" }
				)
				.setFooter({ text: "Made by NovaGG", iconURL: "https://avatars.githubusercontent.com/u/153460070?v=4&size=64" })
			user.send({ embeds: [ closedReportEmbed ] })
			})
			interaction.message.delete()
			return interaction.reply({content: "Closed and sent response to user", ephemeral: true})
		} else if (interaction.customId == "addModule") {
			var inputURL = interaction.fields.getTextInputValue("linkURL").trim();

			var isValidURL = false;
			try {
				var parsedURL = new URL(inputURL);
				isValidURL = parsedURL.protocol === "http:" || parsedURL.protocol === "https:";
			} catch (error) {
				isValidURL = false;
			}

			if (!isValidURL) {
				return interaction.reply({ content: inputURL + " is not a valid URL. Please include http:// or https:// and try again.", ephemeral: true })
			}

			var newLinks = JSON.parse(fs.readFileSync("data/links.json"));
			newLinks.push(inputURL)
			fs.writeFileSync("data/links.json", JSON.stringify(newLinks, null, 2));
			return interaction.reply({content: inputURL + " was successfully added", ephemeral: true})
		} else if (interaction.customId == "removeModule") {
			var newLinks = JSON.parse(fs.readFileSync("data/links.json"));
			if (newLinks.includes(interaction.fields.getTextInputValue("linkURL"))) {
				newLinks = newLinks.filter(link => link !== interaction.fields.getTextInputValue("linkURL"))
				fs.writeFileSync("data/links.json", JSON.stringify(newLinks, null, 2));
				return interaction.reply({content: interaction.fields.getTextInputValue("linkURL") + " was successfully removed", ephemeral: true})
			} else {
				return interaction.reply({content: interaction.fields.getTextInputValue("linkURL") + " was not found in the database. Click the Links button for a list of all links", ephemeral: true})
			}
		}
	} else if (interaction.isUserContextMenuCommand()) {
		if (interaction.commandName == "Reset") {
			if (!interaction.targetUser.bot) {
				var newUsers = JSON.parse(fs.readFileSync("data/users.json"));
				newUsers[interaction.targetUser.id] = 0
				fs.writeFileSync("data/users.json", JSON.stringify(newUsers, null, 2));
				return interaction.reply({content: "Reset bot limit for <@" + interaction.targetUser.id + ">", ephemeral: true})
			} else {
				return interaction.reply({content: "Cannot reset a bot", ephemeral: true})
			}
		}
	}
});

client.login(process.env.TOKEN);
// Automatically shut down cleanly after 5 hours and 50 minutes (350 minutes)
// This prevents the GitHub 6-hour force-kill and allows a clean hand-off!
setTimeout(() => {
    console.log("5h 50m reached. Shutting down cleanly for the next cron loop...");
    client.destroy(); // Safely closes the Discord gateway connection
    process.exit(0);  // Tells GitHub the job completed successfully with no errors
}, 350 * 60 * 1000);
