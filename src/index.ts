import { ButtonStyle, ChannelType, Client, ComponentType, Events, GatewayIntentBits, GuildMember, TextChannel } from 'discord.js';
import { createTicket, createTicketChannel, db, getTicketChannel, incrementTicketNumber } from './db';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on(Events.ClientReady, readyClient => {
    console.log(`Logged in as ${readyClient.user.tag}!`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.guildId !== Bun.env.GUILD_ID) return;

    if (interaction.isChatInputCommand()) {
        switch (interaction.commandName) {
            case "setup_ticket_channel": {
                // basic checks
                const invoker = interaction.member as GuildMember | null;
                if (!invoker) return interaction.reply({
                    content: "You must be in a guild to use this command",
                    flags: "Ephemeral"
                });

                if (!invoker.permissions.has("ManageGuild")) return interaction.reply({
                    content: "You must have the `Manage Guild` permission to use this command",
                    flags: "Ephemeral"
                });

                // channel check
                const channel = interaction.options.getChannel("entrypoint_channel", true);

                const isChannelAlreadySetup = getTicketChannel(channel.id);
                if (!!isChannelAlreadySetup) return interaction.reply({
                    content: "Tickets are already setup in this channel. Use the `remove_ticket_channel` command to remove tickets in this channel.",
                    flags: "Ephemeral"
                });

                // reasons check
                const reasons = interaction.options.getString("ticket_reasons", true).split(",").map(r => r.trim());
                const uniqueReasons = [...new Set(reasons)];
                if (uniqueReasons.length < reasons.length) return interaction.reply({
                    content: "Duplicate ticket reasons are not allowed. Please provide unique reasons.",
                    flags: "Ephemeral"
                });
                if (uniqueReasons.length < 1 || uniqueReasons.length > 25) return interaction.reply({
                    content: "You must provide between one and 25 ticket reasons",
                    flags: "Ephemeral"
                });


                // saving in db
                const role = interaction.options.getRole("role_to_ping", true);
                const ticketEmbedTitle = interaction.options.getString("ticket_embed_title") || "Ticket Created";
                const ticketEmbedContent = interaction.options.getString("ticket_embed_content") || "Welcome to your ticket! A moderator will be with you shortly. Please be patient.";
                const ticketEmbedColor = interaction.options.getString("ticket_embed_color") || "0x2F3136";

                createTicketChannel(channel.id, role.id, uniqueReasons.join(","), ticketEmbedTitle, ticketEmbedContent, ticketEmbedColor);
                
                // sending embed
                const embedTitle = interaction.options.getString("embed_title");
                const embedContent = interaction.options.getString("embed_content");
                const embedColor = interaction.options.getString("embed_color");

                const fetchedChannel = await client.channels.fetch(channel.id);

                fetchedChannel?.isSendable() && await fetchedChannel.send({
                    embeds: [
                        {
                            title: embedTitle || "Ticket Creation",
                            description: embedContent || "Click on the button below to create a ticket",
                            color: parseInt(embedColor || "0x2F3136", 16)
                        }
                    ],
                    components: [
                        {
                            type: ComponentType.ActionRow,
                            components: [
                                {
                                    type: ComponentType.Button,
                                    label: "Create Ticket",
                                    style: ButtonStyle.Primary,
                                    customId: "create_ticket"
                                }
                            ]
                        }
                    ]
                });

                return interaction.reply({
                    content: `Successfully setup tickets in this channel. It will ping the ${role.toString()} role when a ticket is created.`,
                    flags: "Ephemeral"
                });
            }
            default: {
                return interaction.reply("Unknown command");
            }
        }
    }

    if (interaction.isButton()) {
        switch (interaction.customId) {
            case "create_ticket": {
                const ticketChannel = getTicketChannel(interaction.channelId);
                if (!ticketChannel) return interaction.reply({
                    content: "Tickets are not setup in this channel. How?",
                    flags: "Ephemeral"
                });

                const reasons = ticketChannel.ticket_reasons.split(",");
                const options = reasons.map(r => ({ label: r, value: r }));

                return interaction.reply({
                    content: "Select a reason for your ticket",
                    components: [
                        {
                            type: ComponentType.ActionRow,
                            components: [
                                {
                                    type: ComponentType.StringSelect,
                                    placeholder: "Select a reason",
                                    customId: "create_ticket_with_reason",
                                    options,
                                }
                            ]
                        }
                    ],
                    flags: "Ephemeral"
                });
            }
        }
    }

    if (interaction.isStringSelectMenu()) {
        if (interaction.customId !== "create_ticket_with_reason") return;

        const ticketChannel = getTicketChannel(interaction.channelId);
        if (!ticketChannel) return interaction.reply({
            content: "Tickets are not setup in this channel. How?",
            flags: "Ephemeral"
        });

        if (!interaction.channel || interaction.channel.isDMBased()) return interaction.reply({
            content: "????",
            flags: "Ephemeral"
        });

        const ticketNumber = incrementTicketNumber(interaction.channelId);

        const thread = await (interaction.channel as TextChannel).threads.create({
            name: `${ticketNumber}-${interaction.user.username}`,
            type: ChannelType.PrivateThread
        });

        const selectedReason = interaction.values[0];
        createTicket(interaction.channelId, thread.id, interaction.user.id, new Date().toISOString(), selectedReason);

        const pingMessage = await thread.send(`<@&${ticketChannel.role_to_ping_id}> <@${interaction.user.id}>`);
        await pingMessage.delete();
    
        await thread.send({
            embeds: [
                {
                    title: `Ticket #${ticketNumber}`,
                    description: `Ticket created by <@${interaction.user.id}>`,
                    color: 0x2F3136
                }
            ]
        })
    
        return interaction.reply({
            content: `Ticket created! You can view it here: ${thread.toString()}`,
            flags: "Ephemeral"
        });
    }
});

client.login(Bun.env.TOKEN);