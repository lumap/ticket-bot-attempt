import { Database } from "bun:sqlite"

export const db = new Database("tickets.sqlite")

let stmt = db.query(`
    CREATE TABLE IF NOT EXISTS ticket_channels (
        entrypoint_channel_id TEXT PRIMARY KEY,
        role_to_ping_id TEXT,
        ticket_number INTEGER,
        ticket_reasons TEXT,
        ticket_embed_title TEXT,
        ticket_embed_content TEXT,
        ticket_embed_color TEXT
    )`);

stmt.run();

stmt = db.query(`
    CREATE TABLE IF NOT EXISTS ticket (
        ticket_id TEXT PRIMARY KEY,
        channel_id TEXT,
        thread_id TEXT,
        created_by TEXT,
        created_at TEXT,
        claimed_by TEXT,
        reason TEXT,
        closed BOOLEAN,

        FOREIGN KEY (channel_id) REFERENCES ticket_channels(channel_id)
    )`);

stmt.run();




export function createTicketChannel(entrypointChannelId: string, roleToPingId: string, ticketReasons: string, ticketEmbedTitle: string, ticketEmbedContent: string, ticketEmbedColor: string) {
    const stmt = db.query(`INSERT INTO ticket_channels (entrypoint_channel_id, role_to_ping_id, ticket_reasons, ticket_embed_title, ticket_embed_content, ticket_embed_color, ticket_number) VALUES (?, ?, ?, ?, ?, ?, 0)`);
    stmt.run(entrypointChannelId, roleToPingId, ticketReasons, ticketEmbedTitle, ticketEmbedContent, ticketEmbedColor);
}

export function getTicketChannel(entrypointChannelId: string) {
    const stmt = db.query(`SELECT * FROM ticket_channels WHERE entrypoint_channel_id = ?`);
    return stmt.get(entrypointChannelId) as {
        role_to_ping_id: string,
        ticket_number: number,
        ticket_reasons: string,
        ticket_embed_title: string,
        ticket_embed_content: string,
        ticket_embed_color: string
    };
}

export function createTicket(channelId: string, threadId: string, createdBy: string, createdAt: string, reason: string) {
    const stmt = db.query(`INSERT INTO ticket (ticket_id, channel_id, thread_id, created_by, created_at, reason, closed) VALUES (?, ?, ?, ?, ?, ?, FALSE)`);
    stmt.run(crypto.randomUUID(), channelId, threadId, createdBy, createdAt, reason)
}

export function incrementTicketNumber(entrypointChannelId: string): number {
    const stmt = db.query(`UPDATE ticket_channels SET ticket_number = ticket_number + 1 WHERE entrypoint_channel_id = ?`);
    stmt.run(entrypointChannelId);

    const result = getTicketChannel(entrypointChannelId);
    return result.ticket_number;
}