import type { ButtonInteraction, GuildMember } from "discord.js";
import { getTicket } from "../db";

export async function button_close_ticket_cancel(interaction: ButtonInteraction) {
    const ticket = getTicket(interaction.channelId);
    if (!ticket || !interaction.channel) return interaction.reply({
        content: "Current ticket not found. How??????",
        flags: "Ephemeral"
    });

    if (ticket.closed) return interaction.reply({
        content: "This ticket is already closed.",
        flags: "Ephemeral"
    });

    const invoker = interaction.member as GuildMember | null; // d.js types workaround

    if (!invoker || !invoker.permissions.has("ModerateMembers")) return interaction.reply({
        content: "You must have the `Timeout Members` permission to close a ticket.",
        flags: "Ephemeral"
    });

    await interaction.reply({
        content: "Ticket close cancelled.",
        flags: "Ephemeral"
    });

    const confirmationMessage = await interaction.channel.messages.fetch(interaction.message.id);
    if (!confirmationMessage) return;
    
    await confirmationMessage.delete();
}