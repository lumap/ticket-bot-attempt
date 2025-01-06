import { Client, Events, GatewayIntentBits } from 'discord.js';

import { slash_setup_ticket_channel } from './commands/slash-setup_ticket_channel';
import { button_create_ticket } from './commands/button-create_ticket';
import { select_create_ticket_with_reason } from './commands/select-create_ticket_with_reason';
import { button_claim_ticket } from './commands/button-claim_ticket';
import { button_close_ticket } from './commands/button-close_ticket';
import { button_close_ticket_confirm } from './commands/button-close_ticket_confirm';
import { button_close_ticket_cancel } from './commands/button-close_ticket_cancel';
import { slash_set_logs_channel } from './commands/slash-set_logs_channel';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on(Events.ClientReady, readyClient => {
    console.log(`Logged in as ${readyClient.user.tag}!`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.guildId !== Bun.env.GUILD_ID) return;

    if (interaction.isChatInputCommand()) {
        switch (interaction.commandName) {
            case "setup_ticket_channel": {
                return await slash_setup_ticket_channel(interaction, client);
            }
            case "set_logs_channel": {
                return await slash_set_logs_channel(interaction);
            }
            default: {
                return interaction.reply("Unknown command");
            }
        }
    }

    if (interaction.isButton()) {
        switch (interaction.customId) {
            case "create_ticket": {
                return await button_create_ticket(interaction);
            }
            case "claim_ticket": {
                return await button_claim_ticket(interaction);
            }
            case "close_ticket": {
                return await button_close_ticket(interaction);
            }
            case "close_ticket_confirm": {
                return await button_close_ticket_confirm(interaction);
            }
            case "close_ticket_cancel": {
                return await button_close_ticket_cancel(interaction);
            }
            default: {
                return interaction.reply("Unknown button");
            }
        }
    }

    if (interaction.isStringSelectMenu()) {
        switch (interaction.customId) {
            case "create_ticket_with_reason": {
                return await select_create_ticket_with_reason(interaction);
            }
            default: {
                return interaction.reply("Unknown select menu");
            }
        }
    }
});

client.login(Bun.env.TOKEN);