import { Database } from "bun:sqlite"

export const db = new Database("tickets.sqlite")

let stmt = db.query(`
    CREATE TABLE IF NOT EXISTS ticket_server (
        server_id TEXT PRIMARY KEY NOT NULL,
        logs_channel_id TEXT
    )`);

stmt.run();

stmt = db.query(`
    CREATE TABLE IF NOT EXISTS ticket_channel (
        entrypoint_channel_id TEXT PRIMARY KEY NOT NULL,
        entrypoint_message_id TEXT NOT NULL,
        parent_server_id TEXT NOT NULL,
        role_to_ping_id TEXT NOT NULL,
        ticket_number INTEGER NOT NULL,
        ticket_reasons TEXT NOT NULL,
        ticket_embed_title TEXT NOT NULL,
        ticket_embed_content TEXT NOT NULL,
        ticket_embed_color TEXT NOT NULL,

        FOREIGN KEY (parent_server_id) REFERENCES ticket_server(server_id)
    )`);

stmt.run();

stmt = db.query(`
    CREATE TABLE IF NOT EXISTS ticket (
        thread_id TEXT PRIMARY KEY NOT NULL,
        parent_channel_id TEXT NOT NULL,
        parent_server_id TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        claimed_by TEXT,
        claim_message_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        closed BOOLEAN NOT NULL,
        closed_at TEXT,
        closed_by TEXT,

        FOREIGN KEY (parent_server_id) REFERENCES ticket_server(server_id)
    )`);

stmt.run();


export function setLogsChannel(serverId: string, channelId: string) {
    let stmt = db.query(`SELECT * FROM ticket_server WHERE server_id = ?`);
    const result = stmt.get(serverId);
    if (result) {
        stmt = db.query(`UPDATE ticket_server SET logs_channel_id = ? WHERE server_id = ?`);
        stmt.run(channelId, serverId);
    } else {
        stmt = db.query(`INSERT INTO ticket_server (server_id, logs_channel_id) VALUES (?, ?)`);
        stmt.run(serverId, channelId);
    }
}

export function getLogsChannel(serverId: string) {
    const stmt = db.query(`SELECT * FROM ticket_server WHERE server_id = ?`);
    return (stmt.get(serverId) as {
        server_id: string,
        logs_channel_id: string
    }).logs_channel_id;
}

export function createTicketChannel(entrypointChannelId: string, entrypointMessageId: string, parentServerId: string, roleToPingId: string, ticketReasons: string, ticketEmbedTitle: string, ticketEmbedContent: string, ticketEmbedColor: string, tickerNumber: number) {
    let stmt = db.query(`SELECT * FROM ticket_server WHERE server_id = ?`);
    const result = stmt.get(parentServerId);
    if (!result) {
        stmt = db.query(`INSERT INTO ticket_server (server_id, logs_channel_id) VALUES (?, NULL)`);
        stmt.run(parentServerId);
    }

    stmt = db.query(`INSERT INTO ticket_channel (entrypoint_channel_id, entrypoint_message_id, parent_server_id, role_to_ping_id, ticket_reasons, ticket_embed_title, ticket_embed_content, ticket_embed_color, ticket_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    stmt.run(entrypointChannelId, entrypointMessageId, parentServerId, roleToPingId, ticketReasons, ticketEmbedTitle, ticketEmbedContent, ticketEmbedColor, tickerNumber);
}

export interface TicketChannel {
    entrypoint_channel_id: string,
    entrypoint_message_id: string,
    role_to_ping_id: string,
    ticket_number: number,
    ticket_reasons: string,
    ticket_embed_title: string,
    ticket_embed_content: string,
    ticket_embed_color: string
}

export function getTicketChannel(entrypointChannelId: string) {
    const stmt = db.query(`SELECT * FROM ticket_channel WHERE entrypoint_channel_id = ?`);
    return stmt.get(entrypointChannelId) as TicketChannel;
}

export function deleteTicketChannel(entrypointChannelId: string) {
    const stmt = db.query(`DELETE FROM ticket_channel WHERE entrypoint_channel_id = ?`);
    stmt.run(entrypointChannelId);
}

export function incrementTicketNumber(entrypointChannelId: string): number {
    const stmt = db.query(`UPDATE ticket_channel SET ticket_number = ticket_number + 1 WHERE entrypoint_channel_id = ?`);
    stmt.run(entrypointChannelId);

    const result = getTicketChannel(entrypointChannelId);
    return result.ticket_number;
}



export function createTicket(parentChannelId: string, parentServerId: string, threadId: string, createdBy: string, createdAt: string, reason: string, claimMessageId: string) {
    const stmt = db.query(`INSERT INTO ticket (parent_channel_id, parent_server_id, thread_id, created_by, created_at, reason, claim_message_id, closed) VALUES (?, ?, ?, ?, ?, ?, ?, FALSE)`);
    stmt.run(parentChannelId, parentServerId, threadId, createdBy, createdAt, reason, claimMessageId);
}

export interface Ticket {
    thread_id: string,
    parent_channel_id: string,
    created_by: string,
    created_at: string,
    reason: string,
    claim_message_id: string,
    claimed_by: string,
    closed: boolean
}

export function getTicket(threadId: string) {
    const stmt = db.query(`SELECT * FROM ticket WHERE thread_id = ?`);
    return stmt.get(threadId) as Ticket;
}

export function claimTicket(threadId: string, claimedBy: string) {
    const stmt = db.query(`UPDATE ticket SET claimed_by = ? WHERE thread_id = ?`);
    stmt.run(claimedBy, threadId);
}

export function closeTicket(threadId: string, closedBy: string) {
    const stmt = db.query(`UPDATE ticket SET closed = TRUE, closed_at = ?, closed_by = ? WHERE thread_id = ?`);
    stmt.run(new Date().toISOString(), closedBy, threadId);
}
