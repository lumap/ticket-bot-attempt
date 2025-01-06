import type { ChatInputCommandInteraction, GuildMember } from "discord.js";
import { deleteTicketChannel, getTicketChannel } from "../db";

export async function slash_delete_ticket_channel_setup(interaction: ChatInputCommandInteraction) {
    // basic checks
    const invoker = interaction.member as GuildMember | null;
    if (!invoker || !interaction.guild) return interaction.reply({
        content: "You must be in a guild to use this command",
        ephemeral: true
    });

    if (!invoker.permissions.has("ManageGuild")) return interaction.reply({
        content: "You must have the `Manage Guild` permission to use this command",
        ephemeral: true
    });

    // channel check
    const channelId = interaction.options.getChannel("channel", true).id;

    const ticketChannel = getTicketChannel(channelId);
    if (!ticketChannel) return interaction.reply({
        content: "No ticket setup found in this channel",
        ephemeral: true
    });

    // delete the ticket setup
    const fetchedTicketChannel = await interaction.guild.channels.fetch(ticketChannel.entrypoint_channel_id);
    if (!fetchedTicketChannel) return interaction.reply({
        content: "I can't find the channel where the ticket setup was created",
        ephemeral: true
    });

    fetchedTicketChannel.isTextBased() && fetchedTicketChannel.messages.fetch(ticketChannel.entrypoint_message_id).then(msg => msg.delete().catch(() => {}));

    deleteTicketChannel(channelId);

    interaction.reply({
        content: "Ticket setup deleted from this channel",
        ephemeral: true
    });
}