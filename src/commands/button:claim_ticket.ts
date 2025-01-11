import { ButtonStyle, ComponentType, ThreadChannel, type ButtonInteraction, type GuildMember } from "discord.js";
import { claimTicket, getTicket } from "../db";

export async function button_claim_ticket(interaction: ButtonInteraction) {
    const ticket = getTicket(interaction.channelId);
    if (!ticket || !interaction.channel) return interaction.reply({
        content: "Current ticket not found. How??????",
        flags: "Ephemeral"
    });

    if (!interaction.channel.isSendable()) return interaction.reply({
        content: "I can't send messages in this channel. Might need to check perms on that one...",
        flags: "Ephemeral"
    });

    if (ticket.closed) return interaction.reply({
        content: "This ticket is closed.",
        flags: "Ephemeral"
    });

    if (ticket.claimed_by) return interaction.reply({
        content: `This ticket has already been claimed by <@${ticket.claimed_by}>. Sorry!`,
        flags: "Ephemeral"
    }); // This should never happen, but let's be safe

    if (ticket.created_by === interaction.user.id) return interaction.reply({
        content: "You can't claim your own ticket.",
        flags: "Ephemeral"
    });

    const invoker = interaction.member as GuildMember | null; // d.js types workaround

    if (!invoker || !invoker.permissions.has("ModerateMembers")) return interaction.reply({
        content: "You must have the `Timeout Members` permission to claim a ticket.",
        flags: "Ephemeral"
    });

    // claim the ticket
    const claimMessage = await interaction.channel.messages.fetch(ticket.claim_message_id);
    if (!claimMessage) return interaction.reply({
        content: "Claim message not found. Did it get deleted as you clicked this? How unlucky :(",
        flags: "Ephemeral"
    });

    await claimMessage.edit({
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.Button,
                        label: "Claim Ticket",
                        style: ButtonStyle.Success,
                        customId: "claim_ticket",
                        disabled: true
                    }
                ]
            }
        ]
    });

    await (interaction.channel as ThreadChannel).send({
        embeds: [
            {
                description: `<@${interaction.user.id}> claimed this ticket. They will be with you shortly, please be patient.`
            }
        ]
    });

    claimTicket(interaction.channelId, interaction.user.id);

    return interaction.reply({
        content: "Ticket claimed!",
        flags: "Ephemeral"
    });
}