import { REST, Routes } from 'discord.js';

const commands = [
    {
        name: 'ping',
        description: 'Replies with Pong!',
    },
    {
        name: "setup_ticket_channel",
        description: "Setup a tickets channel",
        options: [
            {
                type: 7,
                name: "entrypoint_channel",
                description: "The channel to setup tickets in",
                required: true,
                channel_types: [0]
            },
            {
                type: 8,
                name: "role_to_ping",
                description: "The role to ping when a ticket is created",
                required: true
            },
            {
                type: 3,
                name: "ticket_reasons",
                description: "The reasons to select when creating a ticket, separated by a comma",
                required: true
            },
            {
                type: 3,
                name: "entrypoint_embed_title",
                description: "The title of the embed that will be sent for ticket creation",
            },
            {
                type: 3,
                name: "entrypoint_embed_content",
                description: "The content of the embed that will be sent for ticket creation",
            },
            {
                type: 3,
                name: "entrypoint_embed_color",
                description: "The color of the embed that will be sent for ticket creation (in hex)", 
            },
            {
                type: 3,
                name: "ticket_embed_title",
                description: "The title of the embed that will be sent when a ticket is created",
            },
            {
                type: 3,
                name: "ticket_embed_content",
                description: "The content of the embed that will be sent when a ticket is created",
            },
            {
                type: 3,
                name: "ticket_embed_color",
                description: "The color of the embed that will be sent when a ticket is created (in hex)",
            }
        ]
    }
];

const rest = new REST({ version: '10' }).setToken(Bun.env.TOKEN as string);

try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationGuildCommands(Bun.env.CLIENT_ID as string, Bun.env.GUILD_ID as string), { body: commands });

    console.log('Successfully reloaded application (/) commands.');
} catch (error) {
    console.error(error);
}