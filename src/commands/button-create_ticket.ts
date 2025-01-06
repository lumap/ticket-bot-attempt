import { ComponentType, type ButtonInteraction } from "discord.js";
import { getTicketChannel } from "../db";

export async function button_create_ticket(interaction: ButtonInteraction) {
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