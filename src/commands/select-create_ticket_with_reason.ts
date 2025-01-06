import { ButtonStyle, ChannelType, ComponentType, type StringSelectMenuInteraction, type TextChannel } from "discord.js";
import { createTicket, getLogsChannel, getTicketChannel, incrementTicketNumber } from "../db";

export async function select_create_ticket_with_reason(interaction: StringSelectMenuInteraction) {
    const ticketChannel = getTicketChannel(interaction.channelId);
    if (!ticketChannel) return interaction.reply({
        content: "Tickets are not setup in this channel. How?",
        flags: "Ephemeral"
    });

    if (!interaction.channel || interaction.channel.isDMBased() || !interaction.guild) return interaction.reply({
        content: "????",
        flags: "Ephemeral"
    });

    const ticketNumber = incrementTicketNumber(interaction.channelId);

    const thread = await (interaction.channel as TextChannel).threads.create({
        name: `${ticketNumber}-${interaction.user.username}`,
        type: ChannelType.PrivateThread
    });

    const selectedReason = interaction.values[0];

    await thread.send({
        content: interaction.user.toString(),
        embeds: [
            {
                title: ticketChannel.ticket_embed_title,
                description: ticketChannel.ticket_embed_content,
                color: parseInt(ticketChannel.ticket_embed_color)
            },
            {
                title: "Reason",
                description: selectedReason,
                color: parseInt(ticketChannel.ticket_embed_color)
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
                        customId: "close_ticket",
                        emoji: {
                            name: "🔒"
                        }
                    }
                ]
            }
        ]
    })

    const ticketClaimMessage = await thread.send({
        content: `<@&${ticketChannel.role_to_ping_id}>, a new ticket has been opened. Click below to claim it.`,
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.Button,
                        label: "Claim Ticket",
                        style: ButtonStyle.Success,
                        customId: "claim_ticket",
                        emoji: {
                            name: "✋"
                        }
                    }
                ]
            }
        ]
    })

    createTicket(interaction.channelId, interaction.guild.id, thread.id, interaction.user.id, new Date().toISOString(), selectedReason, ticketClaimMessage.id);

    const logsChannelId = getLogsChannel(interaction.guild.id);
    if (logsChannelId) {
        const logsChannel = await interaction.guild.channels.fetch(logsChannelId);
        if (logsChannel) {
            logsChannel.isSendable() && await logsChannel.send({
                content: thread.toString(),
                embeds: [
                    {
                        title: "Ticket Created",
                        description: `Ticket created by ${interaction.user} for reason: ${selectedReason}`,
                        color: parseInt("0x0000FF")
                    }
                ]
            });
        }
    }

    return interaction.update({
        content: `Ticket created! You can view it here: ${thread.toString()}`,
        components: []
    });
}