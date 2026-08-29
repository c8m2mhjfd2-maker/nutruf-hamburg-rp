import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const file = process.env.DATABASE_PATH ?? './data/nutruf.sqlite';
fs.mkdirSync(path.dirname(file), { recursive: true });
export const db = new Database(file);
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS settings (guild_id TEXT PRIMARY KEY, emergency_channel TEXT, log_channel TEXT, ticket_category TEXT, application_channel TEXT, responder_roles TEXT NOT NULL DEFAULT '{}', team_role_id TEXT, onduty_role_id TEXT, team_lobby_channel TEXT, team_list_channel TEXT, rating_channel TEXT, gang_channel TEXT, property_channel TEXT, map_url TEXT);
CREATE TABLE IF NOT EXISTS emergencies (id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT NOT NULL, category TEXT NOT NULL, location TEXT NOT NULL, description TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Offen', creator_id TEXT NOT NULL, assignee_id TEXT, created_at TEXT NOT NULL, closed_at TEXT);
CREATE TABLE IF NOT EXISTS duty (guild_id TEXT NOT NULL, user_id TEXT NOT NULL, department TEXT NOT NULL, status TEXT NOT NULL, started_at TEXT, ended_at TEXT, PRIMARY KEY (guild_id,user_id,department));
CREATE TABLE IF NOT EXISTS profiles (guild_id TEXT NOT NULL, user_id TEXT NOT NULL, rp_name TEXT NOT NULL, department TEXT, rank TEXT, rp_status TEXT NOT NULL DEFAULT 'Aktiv', PRIMARY KEY (guild_id,user_id));
CREATE TABLE IF NOT EXISTS points (guild_id TEXT NOT NULL, user_id TEXT NOT NULL, value INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (guild_id,user_id));
CREATE TABLE IF NOT EXISTS managed_channels (guild_id TEXT NOT NULL, channel_id TEXT NOT NULL, PRIMARY KEY (guild_id,channel_id));
`);
for (const column of ['team_role_id','onduty_role_id','team_lobby_channel','team_list_channel','rating_channel','gang_channel','property_channel','map_url']) { try { db.exec(`ALTER TABLE settings ADD COLUMN ${column} TEXT`); } catch {} }

export type Settings = { emergency_channel?: string; log_channel?: string; ticket_category?: string; application_channel?: string; responder_roles: Record<string,string> };
export function getSettings(guildId: string): Settings { return (db.prepare('SELECT * FROM settings WHERE guild_id=?').get(guildId) as Settings | undefined) ?? { responder_roles: {} }; }
export function saveSetting(guildId: string, key: string, value: string) { db.prepare(`INSERT INTO settings (guild_id, ${key}) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET ${key}=excluded.${key}`).run(guildId, value); }
export function saveRoleMap(guildId: string, roles: Record<string,string>) { db.prepare("INSERT INTO settings (guild_id,responder_roles) VALUES (?,?) ON CONFLICT(guild_id) DO UPDATE SET responder_roles=excluded.responder_roles").run(guildId, JSON.stringify(roles)); }
export function addLog(guildId: string, text: string, channelId?: string) { return { guildId, text, channelId }; }
export function rememberManagedChannel(guildId: string, channelId: string) { db.prepare('INSERT OR IGNORE INTO managed_channels (guild_id,channel_id) VALUES (?,?)').run(guildId,channelId); }
export function managedChannels(guildId: string) { return db.prepare('SELECT channel_id FROM managed_channels WHERE guild_id=?').all(guildId) as {channel_id:string}[]; }
export function forgetManagedChannel(guildId: string, channelId: string) { db.prepare('DELETE FROM managed_channels WHERE guild_id=? AND channel_id=?').run(guildId,channelId); }
