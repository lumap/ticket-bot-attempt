import { ButtonStyle, ComponentType, type ButtonInteraction, type GuildMember, type ThreadChannel } from "discord.js";
import { getTicket } from "../db";

export async function button_close_ticket(interaction: ButtonInteraction) {
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
        content: "This ticket is already closed.",
        flags: "Ephemeral"
    });

    const invoker = interaction.member as GuildMember | null; // d.js types workaround

    if (!invoker || !invoker.permissions.has("ModerateMembers")) return interaction.reply({
        content: "You must have the `Timeout Members` permission to close a ticket.",
        flags: "Ephemeral"
    });

    return interaction.reply({
        embeds: [
            {
                title: "Close Ticket",
                description: "Are you sure you want to close this ticket? This action can't be undone.",
                color: 0x00FF00
            }
        ],
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.Button,
                        label: "Close Ticket",
                        style: ButtonStyle.Danger,
                        customId: "close_ticket_confirm"
                    },
                    {
                        type: ComponentType.Button,
                        label: "Cancel",
                        style: ButtonStyle.Secondary,
                        customId: "close_ticket_cancel"
                    }
                ]
            }
        ]
    });
}