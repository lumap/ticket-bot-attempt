import { ButtonStyle, ComponentType, type ButtonInteraction, type GuildMember, type ThreadChannel } from "discord.js";
import { closeTicket, getLogsChannel, getTicket } from "../db";

export async function button_close_ticket_confirm(interaction: ButtonInteraction) {
    const ticket = getTicket(interaction.channelId);
    if (!ticket || !interaction.channel || !interaction.guild) return interaction.reply({
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

    await interaction.reply({
        content: "Closing ticket...",
        flags: "Ephemeral"
    });

    (interaction.channel as ThreadChannel).setLocked(true);
    (interaction.channel as ThreadChannel).setArchived(true);

    closeTicket(interaction.channelId, invoker.id);

    const logsChannelId = getLogsChannel(interaction.guild.id);
        if (logsChannelId) {
            const logsChannel = await interaction.guild.channels.fetch(logsChannelId);
            if (logsChannel) {
                logsChannel.isSendable() && await logsChannel.send({
                    content: interaction.channel.toString(),
                    embeds: [
                        {
                            title: "Ticket Closed",
                            description: `Ticket closed by ${interaction.user}`,
                            color: parseInt("0xFF0000")
                        }
                    ],
                    components: [
                        {
                            type: ComponentType.ActionRow,
                            components: [
                                {
                                    type: ComponentType.Button,
                                    style: ButtonStyle.Primary,
                                    label: "Create Transcript",
                                    emoji: {
                                        name: "📜"
                                    },
                                    custom_id: `create_transcript:${interaction.channelId}`
                                }
                            ]
                        }
                    ]
                });
            }
        }

    const ticketCreator = await interaction.guild.members.fetch(ticket.created_by);
    if (ticketCreator) {
        try {
            await ticketCreator.send({
                content: `Your ticket has been closed by ${invoker.toString()}. You can find it here: ${interaction.channel.toString()}`
            });
        } catch {
            // ignore, couldn't send dm
        }
    }
}