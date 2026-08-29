import { ChannelType, Guild, PermissionFlagsBits } from 'discord.js';
import { saveSetting } from './db.js';

const structure = [
  { key:'information', name:'INFORMATION', channels:[['willkommen', 'Willkommen und Serverregeln'], ['ankuendigungen', 'Wichtige Server-Ankündigungen']] },
  { key:'support', name:'SUPPORT', channels:[['ticket-panel', 'Ticket-Panel'], ['team-warteraum', 'Team Warteraum'], ['team-chat', 'Interner Team-Chat'], ['support-infos', 'Support-Informationen']] },
  { key:'roleplay', name:'ROLEPLAY', channels:[['notrufe', 'Notruf- und Einsatzkanal'], ['einsatz-dokumentation', 'Einsatzdokumentation'], ['dienststatus', 'Dienststatus und Teamübersicht'], ['rp-profile', 'RP-Profile'], ['lizenzen', 'RP-Lizenzen'], ['gang-antraege', 'Gang-Anträge'], ['grundstuecke', 'Grundstücke und Karte']] },
  { key:'applications', name:'BEWERBUNGEN', channels:[['team-bewerbungen', 'Team-Bewerbungen'], ['fraktions-antraege', 'Fraktions- und Gang-Anträge']] },
  { key:'logs', name:'LOGS', channels:[['moderations-logs', 'Moderationslogs'], ['ticket-logs', 'Ticket-Logs'], ['bot-logs', 'Bot-Logs']] }
] as const;

export async function buildServer(guild: Guild, teamRoleId?: string, ondutyRoleId?: string) {
  const roles = { team_role_id: teamRoleId ?? '', onduty_role_id: ondutyRoleId ?? '' };
  if (teamRoleId && !guild.roles.cache.has(teamRoleId)) throw new Error('Die angegebene Team-Rolle wurde auf diesem Server nicht gefunden.');
  if (ondutyRoleId && !guild.roles.cache.has(ondutyRoleId)) throw new Error('Die angegebene On-Duty-Rolle wurde auf diesem Server nicht gefunden.');
  const ids: Record<string,string> = {};
  for (const group of structure) {
    let category = guild.channels.cache.find(c=>c.type===ChannelType.GuildCategory && c.name===group.name);
    if (!category) category = await guild.channels.create({name:group.name,type:ChannelType.GuildCategory});
    for (const [slug, description] of group.channels) {
      let channel = guild.channels.cache.find(c=>c.parentId===category!.id && c.name===slug);
      if (!channel) channel = await guild.channels.create({name:slug,type:ChannelType.GuildText,parent:category.id,topic:description});
      ids[slug] = channel.id;
    }
  }
  let lobby = guild.channels.cache.get(ids['team-warteraum']);
  if (!lobby || lobby.type!==ChannelType.GuildVoice) { if (lobby) await lobby.delete().catch(()=>{}); lobby=await guild.channels.create({name:'team-warteraum',type:ChannelType.GuildVoice,parent:guild.channels.cache.find(c=>c.name==='SUPPORT' && c.type===ChannelType.GuildCategory)?.id}); }
  if (teamRoleId) await lobby.permissionOverwrites.edit(teamRoleId,{ViewChannel:true,Connect:true});
  if (ondutyRoleId) await lobby.permissionOverwrites.edit(ondutyRoleId,{ViewChannel:true,Connect:true});
  saveSetting(guild.id,'team_role_id',roles.team_role_id); saveSetting(guild.id,'onduty_role_id',roles.onduty_role_id);
  saveSetting(guild.id,'emergency_channel',ids['notrufe']); saveSetting(guild.id,'log_channel',ids['bot-logs']); saveSetting(guild.id,'application_channel',ids['team-bewerbungen']); saveSetting(guild.id,'team_lobby_channel',lobby.id); saveSetting(guild.id,'team_list_channel',ids['dienststatus']); saveSetting(guild.id,'gang_channel',ids['gang-antraege']); saveSetting(guild.id,'property_channel',ids['grundstuecke']);
  return { categories: structure.length, channels: Object.keys(ids).length+1, ids };
}
