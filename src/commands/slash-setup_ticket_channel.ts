import { ButtonStyle, ComponentType, type ChatInputCommandInteraction, type Client, type GuildMember } from "discord.js";
import { createTicketChannel, getTicketChannel } from "../db";

export async function slash_setup_ticket_channel(interaction: ChatInputCommandInteraction, client: Client) {
    // basic checks
    const invoker = interaction.member as GuildMember | null;
    if (!invoker || !interaction.guild) return interaction.reply({
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
    const ticketEmbedContent = interaction.options.getString("ticket_embed_content")?.replace(/\\n/g, "\n") || "Welcome to your ticket! A moderator will be with you shortly. Please be patient.";
    const ticketEmbedColor = parseInt("0x"+interaction.options.getString("ticket_embed_color")).toString() ||parseInt("0x2F3136").toString();

    createTicketChannel(channel.id, interaction.guild.id, role.id, uniqueReasons.join(","), ticketEmbedTitle, ticketEmbedContent, ticketEmbedColor);

    // sending embed
    const embedTitle = interaction.options.getString("entrypoint_embed_title");
    const embedContent = interaction.options.getString("entrypoint_embed_content");
    const embedColor = interaction.options.getString("entrypoint_embed_color");

    const fetchedChannel = await client.channels.fetch(channel.id);

    if (!fetchedChannel || !fetchedChannel.isSendable()) return interaction.reply({
        content: "I can't send messages in that channel. Might need to check perms on that one...",
        flags: "Ephemeral"
    });

    await fetchedChannel.send({
        embeds: [
            {
                title: embedTitle || "Ticket Creation",
                description: embedContent?.replace(/\\n/g, "\n") || "Click on the button below to create a ticket",
                color: parseInt("0x"+embedColor) || parseInt("0x2F3136")
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
                        customId: "create_ticket",
                        emoji: {
                            name: "📨"
                        }
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