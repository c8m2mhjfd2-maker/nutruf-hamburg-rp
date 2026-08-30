import fs from 'node:fs';
import path from 'node:path';

const configured = process.env.DATABASE_PATH ?? './data/nutruf.json';
const file = configured.endsWith('.sqlite') ? configured.replace(/\.sqlite$/, '.json') : configured;
fs.mkdirSync(path.dirname(file), { recursive:true });
type AnyRow = Record<string, any>;
type State = { settings:AnyRow[]; emergencies:AnyRow[]; duty:AnyRow[]; profiles:AnyRow[]; points:AnyRow[]; managed_channels:AnyRow[]; nextEmergency:number };
const empty:State = {settings:[],emergencies:[],duty:[],profiles:[],points:[],managed_channels:[],nextEmergency:1};
let state:State = fs.existsSync(file) ? {...empty,...JSON.parse(fs.readFileSync(file,'utf8'))} : empty;
const save=()=>fs.writeFileSync(file,JSON.stringify(state,null,2));
const table=(sql:string)=>sql.includes('settings')?'settings':sql.includes('emergencies')?'emergencies':sql.includes('duty')?'duty':sql.includes('profiles')?'profiles':sql.includes('points')?'points':sql.includes('managed_channels')?'managed_channels':'';
function match(rows:AnyRow[], where:string, args:any[]) { const checks=(where.match(/([a-z_]+)=\?/gi)??[]).map(x=>x.split('=')[0].trim()); return rows.filter(r=>checks.every((k,i)=>String(r[k])===String(args[i]))); }
export const db = {
 exec(_sql:string) {}, pragma(_x:string) {},
 prepare(sql:string) { const normalized=sql.replace(/\s+/g,' ').trim(); const name=table(normalized); return {
  run(...args:any[]) { const rows=(state as any)[name] as AnyRow[]; if(name==='settings') { const guild=args[0]; const key=normalized.match(/settings \(guild_id, ([a-z_]+)/i)?.[1] ?? ''; let r=rows.find(x=>x.guild_id===guild); if(!r){r={guild_id:guild}; rows.push(r);} if(normalized.includes('responder_roles')) r.responder_roles=args[1]; else r[key]=args[1]; save(); return {lastInsertRowid:0}; }
   if(name==='managed_channels'){const [guild,channel]=args; if(!rows.some(r=>r.guild_id===guild&&r.channel_id===channel)) rows.push({guild_id:guild,channel_id:channel}); save(); return {lastInsertRowid:0};}
   if(name==='emergencies'){const [guild,category,location,description,creator,created_at]=args; const id=state.nextEmergency++; rows.push({id,guild_id:guild,category,location,description,status:'Offen',creator_id:creator,assignee_id:null,created_at,closed_at:null}); save(); return {lastInsertRowid:id};}
   if(name==='duty'){const [guild,user,department,status,started]=args; let r=rows.find(x=>x.guild_id===guild&&x.user_id===user&&x.department===department); if(!r){r={guild_id:guild,user_id:user,department}; rows.push(r);} Object.assign(r,{status,started_at:started}); save(); return {lastInsertRowid:0};}
   if(name==='profiles'){const [guild,user,rp,department,rank]=args; let r=rows.find(x=>x.guild_id===guild&&x.user_id===user); if(!r){r={guild_id:guild,user_id:user};rows.push(r);} Object.assign(r,{rp_name:rp,department,rank,rp_status:r.rp_status??'Aktiv'}); save(); return {lastInsertRowid:0};}
   if(name==='points'){const [guild,user,value]=args; let r=rows.find(x=>x.guild_id===guild&&x.user_id===user); if(!r){r={guild_id:guild,user_id:user,value:0};rows.push(r);} r.value=value; save(); return {lastInsertRowid:0};}
   if(normalized.includes('UPDATE emergencies')){const [a,b,c]=args; const r=state.emergencies.find(x=>x.id===Number(b)&&x.guild_id===c); if(r){if(normalized.includes('status=?'))r.status=a; else if(normalized.includes('assignee_id=?'))r.assignee_id=a; else {r.status='Abgeschlossen';r.closed_at=a;}}save();return {lastInsertRowid:0};}
   if(normalized.startsWith('DELETE FROM managed_channels')){state.managed_channels=state.managed_channels.filter(x=>!(x.guild_id===args[0]&&x.channel_id===args[1]));save();return {lastInsertRowid:0};}
   return {lastInsertRowid:0};
  },
  get(...args:any[]) { const rows=(state as any)[name] as AnyRow[]; if(name==='settings') return rows.find(x=>x.guild_id===args[0]); if(name==='profiles') return rows.find(x=>x.guild_id===args[0]&&x.user_id===args[1]); if(name==='points') return rows.find(x=>x.guild_id===args[0]&&x.user_id===args[1]); if(name==='duty') return rows.find(x=>x.guild_id===args[0]); return undefined; },
  all(...args:any[]) { const rows=(state as any)[name] as AnyRow[]; if(name==='duty') return rows.filter(x=>x.guild_id===args[0]&&x.status!=='Nicht im Dienst'); if(name==='points') return rows.filter(x=>x.guild_id===args[0]).sort((a,b)=>b.value-a.value).slice(0,10); return rows.filter(x=>x.guild_id===args[0]); }
 }; }
};

export type Settings = AnyRow & { responder_roles: Record<string,string> };
export function getSettings(guildId:string):Settings { const r=state.settings.find(x=>x.guild_id===guildId); return (r?{...r,responder_roles:typeof r.responder_roles==='string'?JSON.parse(r.responder_roles):r.responder_roles}: {responder_roles:{}}) as Settings; }
export function saveSetting(guildId:string,key:string,value:string) { db.prepare(`INSERT INTO settings (guild_id, ${key}) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET ${key}=excluded.${key}`).run(guildId,value); }
export function saveRoleMap(guildId:string,roles:Record<string,string>) { db.prepare('INSERT INTO settings (guild_id,responder_roles) VALUES (?,?) ON CONFLICT(guild_id) DO UPDATE SET responder_roles=excluded.responder_roles').run(guildId,JSON.stringify(roles)); }
export function addLog(guildId:string,text:string,channelId?:string){return {guildId,text,channelId};}
export function rememberManagedChannel(guildId:string,channelId:string){db.prepare('INSERT OR IGNORE INTO managed_channels (guild_id,channel_id) VALUES (?,?)').run(guildId,channelId);}
export function managedChannels(guildId:string){return db.prepare('SELECT channel_id FROM managed_channels WHERE guild_id=?').all(guildId) as {channel_id:string}[];}
export function forgetManagedChannel(guildId:string,channelId:string){db.prepare('DELETE FROM managed_channels WHERE guild_id=? AND channel_id=?').run(guildId,channelId);}
