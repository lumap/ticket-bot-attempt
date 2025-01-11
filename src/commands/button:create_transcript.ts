import type { ButtonInteraction, Message, TextChannel } from "discord.js";
import { getTicket, type Ticket } from "../db";
import AdmZip from "adm-zip";

function formatDate(date: Date) {
    const options = { year: 'numeric' as const, month: 'long' as const, day: 'numeric' as const, hour: '2-digit' as const, minute: '2-digit' as const };
    return new Date(date).toLocaleString('en-US', options).replace(',', '');
}

interface FormattedMessage {
    id: string,
    createdAt: string,
    displayName: string,
    avatar: string,
    isBot: boolean,
    isThreadCreator: boolean,
    content: string,
    attachments: string,
    stickers: string
}

function getFormattedMessageJSON(message: Message, ticket: Ticket): FormattedMessage {
    return {
        id: message.id,
        createdAt: formatDate(message.createdAt),
        displayName: message.author.displayName || message.author.username,
        avatar: message.author.displayAvatarURL({ forceStatic: false, extension: "png", size: 1024 }),
        isBot: message.author.bot,
        isThreadCreator: message.author.id === ticket.created_by,
        content: message.cleanContent,
        attachments: message.attachments.map(attachment => attachment.url).join(","),
        stickers: message.stickers.map(sticker => sticker.url).join(",")
    };
}

function makeMessageHTML(message: FormattedMessage) {
    return `
        <div class="flex flex-row gap-4">
            <img class="size-14 rounded-full"
                src="${message.avatar}"
                alt="">
            <div class="flex flex-col">
                <div class="flex flex-row gap-2">
                    <span>${message.displayName}</span>
                    <span class="text-gray-300">${message.createdAt}</span>
                    ${message.isBot ? `<div class="bg-blue-600 px-1 rounded-md">Bot</div>` : ""}
                    ${message.isThreadCreator ? `<div class="bg-green-600 px-1 rounded-md">OP</div>` : ""}
                    ${!message.isThreadCreator && !message.isBot ? `<div class="bg-red-600 px-1 rounded-md">Mod</div>` : ""}
                </div>
                ${message.content ? `<p>${message.content}</p>` : ""}
                ${message.stickers ?
                    message.stickers.split(",").map(sticker => {
                        return `<img class="max-w-64 max-h-64" src="${sticker}" alt="">`;
                    }).join("\n")
                : ""}
                ${message.attachments ?
                    message.attachments.split(",").map(attachment => {
                        return `<img class="max-w-96 max-h-96" src="${attachment}" alt="">`;
                    }).join("\n")
                : ""}
            </div>
        </div>
    `
}

export async function button_create_transcript(interaction: ButtonInteraction) {
    const ticketThreadId = interaction.customId.split(":")[1];

    const ticket = getTicket(ticketThreadId);
    if (!ticket || !interaction.guild) return interaction.reply({
        content: "Ticket not found. How??????",
        ephemeral: true
    });

    const ticketChannel = await interaction.guild.channels.fetch(ticket.parent_channel_id) as TextChannel | null;
    if (!ticketChannel) return interaction.reply({
        content: "Ticket channel not found. How??????",
        ephemeral: true
    });

    const ticketThread = await ticketChannel.threads.fetch(ticketThreadId);
    if (!ticketThread) return interaction.reply({
        content: "Ticket thread not found. How??????",
        ephemeral: true
    });

    await interaction.deferReply({
        flags: "Ephemeral"
    })

    const threadMessages: Message[] = [];
    let lastMessageId = null;

    do {
        const messages: any = await ticketThread.messages.fetch({ limit: 100, before: lastMessageId });
        threadMessages.push(...messages.values());
        lastMessageId = messages.last()?.id;
    } while (lastMessageId);

    threadMessages.reverse();

    // csv
    const csvContent = "id,createdAt,displayName,avatar,isBot,isThreadCreator,content,attachments\n" + threadMessages.map(message => {
        return Object.values(getFormattedMessageJSON(message,ticket)).map(value => typeof value === "string" ? `"${value.replace(/"/g, '""')}"` : value).join(",");
    }).join("\n");


    // txt
    const txtContent = threadMessages.map(message => {
        return `[${message.createdAt.toISOString()}] ${message.author.tag}: ${message.cleanContent}`;
    }).join("\n");


    // html 
    const html = (await Bun.file("src/transcript-html/index.html").text())
        .replace("{{ ticket }}", `<a class="text-blue-400 underline" href="https://discord.com/channels/${interaction.guild!.id}/${ticketChannel.id}/${ticketThread.id}">#${ticketThread.name}</a>`)
        .replace("{{ messages }}", threadMessages.map(message => makeMessageHTML(getFormattedMessageJSON(message, ticket))).join("\n"));

    const css = await Bun.file("src/transcript-html/tw.css").text();

    // zip it all
    const zip = new AdmZip();
    zip.addFile("transcript.csv", Buffer.from(csvContent));
    zip.addFile("transcript.txt", Buffer.from(txtContent));
    zip.addFile("transcript.html", Buffer.from(html));
    zip.addFile("tw.css", Buffer.from(css));

    return await interaction.editReply({
        content: "Here's the transcript.",
        files: [{
            name: "transcript.zip",
            attachment: zip.toBuffer()
        }]
    });
}