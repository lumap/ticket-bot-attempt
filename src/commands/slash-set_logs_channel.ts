import type { ChatInputCommandInteraction, GuildMember } from "discord.js";
import { setLogsChannel } from "../db";

export async function slash_set_logs_channel(interaction: ChatInputCommandInteraction) {
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

    const channel = interaction.options.getChannel("logs_channel", true);

    const fetchedChannel = await interaction.guild.channels.fetch(channel.id);
    if (!fetchedChannel || !fetchedChannel.isSendable()) return interaction.reply({
        content: "I can't send messages in that channel. Might need to check perms on that one...",
        flags: "Ephemeral"
    });

    setLogsChannel(interaction.guild.id, channel.id);

    interaction.reply({
        content: `Logs channel set to <#${channel.id}>`,
        flags: "Ephemeral"
    });
}