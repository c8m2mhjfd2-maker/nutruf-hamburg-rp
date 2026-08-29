import { ChannelType, Guild, PermissionFlagsBits, OverwriteResolvable } from 'discord.js';
import { saveSetting, rememberManagedChannel, saveRoleMap } from './db.js';

type Entry = { name: string; type: ChannelType; setting?: string; public?: boolean };
type Group = { name: string; visibility: 'public' | 'team' | 'mod' | 'admin'; channels: Entry[] };

export const structure: Group[] = [
 { name:'📢 INFORMATION', visibility:'public', channels:['📜・regeln','📢・ankündigungen','📋・server-infos','📰・neuigkeiten','❓・faq','📖・rp-regeln','🔗・wichtige-links'].map((name,i)=>({name,type:ChannelType.GuildText,public:i>1})) },
 { name:'👋 COMMUNITY', visibility:'public', channels:['💬・allgemeiner-chat','😂・memes','📸・bilder','🎮・gaming','💡・vorschläge','🐛・bug-meldungen'].map(name=>({name,type:ChannelType.GuildText})) },
 { name:'🎫 SUPPORT', visibility:'public', channels:[...['🎫・ticket-erstellen','📌・support-info','⭐・support-bewertungen'].map(name=>({name,type:ChannelType.GuildText})),{name:'🔊・support-warteraum',type:ChannelType.GuildVoice,setting:'team_lobby_channel'},{name:'🔊・team-warteraum',type:ChannelType.GuildVoice}] },
 { name:'👥 TEAM', visibility:'team', channels:[...['💬・team-chat','📢・team-ankündigungen','📋・team-infos','🟢・team-status','🕐・schicht-system','📊・team-statistiken','📝・team-protokolle'].map(name=>({name,type:ChannelType.GuildText})),...['🔊・team-besprechung','🔊・team-support'].map(name=>({name,type:ChannelType.GuildVoice}))] },
 { name:'🛡️ MODERATION', visibility:'mod', channels:['📜・mod-logs','⚠️・verwarnungen','🔨・moderations-aktionen','🚫・automod-logs','🔤・verbotene-wörter'].map(name=>({name,type:ChannelType.GuildText})) },
 { name:'📋 BEWERBUNGEN', visibility:'team', channels:['👮・team-bewerbungen','🏴・gang-bewerbungen','🏠・grundstück-bewerbungen','📄・sonstige-bewerbungen','📊・bewerbungs-logs'].map(name=>({name,type:ChannelType.GuildText})) },
 { name:'🏴 GANGS', visibility:'public', channels:[...['🏴・gang-anmeldung','📜・gang-regeln','📋・gang-informationen','🔫・lizenzen','📊・gang-übersicht'].map(name=>({name,type:ChannelType.GuildText})),{name:'🔊・gang-besprechung',type:ChannelType.GuildVoice}] },
 { name:'🏠 IMMOBILIEN', visibility:'public', channels:['🗺️・grundstücke','🏠・haus-kaufen','📋・immobilien-infos','📊・grundstück-status','📝・kauf-anträge','📜・immobilien-logs'].map(name=>({name,type:ChannelType.GuildText})) },
 { name:'📊 RP-SYSTEME', visibility:'public', channels:['👤・rp-profile','📋・rp-informationen','🎫・lizenzen','🏴・fraktionen','📊・rp-statistiken','🏆・rangliste'].map(name=>({name,type:ChannelType.GuildText})) },
 { name:'🚨 FRAKTIONEN', visibility:'team', channels:[...['🚓・polizei','🚑・rettungsdienst','🚒・feuerwehr','🚕・verkehr','📢・fraktions-ankündigungen','📋・dienst-informationen'].map(name=>({name,type:ChannelType.GuildText})),...['🔊・polizei-funk','🔊・rettungsdienst-funk','🔊・feuerwehr-funk','🔊・fraktions-besprechung'].map(name=>({name,type:ChannelType.GuildVoice}))] },
 { name:'🎙️ VOICE', visibility:'public', channels:['🔊・lobby','🔊・community-1','🔊・community-2','🔊・afk'].map(name=>({name,type:ChannelType.GuildVoice})) },
 { name:'🤖 BOT', visibility:'public', channels:['🤖・bot-befehle','📊・bot-status','📜・bot-logs'].map(name=>({name,type:ChannelType.GuildText})) },
 { name:'🔒 ADMIN', visibility:'admin', channels:['⚙️・bot-setup','📋・admin-chat','📊・admin-statistiken','📜・admin-logs'].map(name=>({name,type:ChannelType.GuildText})) },
 { name:'🗂️ ARCHIV', visibility:'team', channels:['📁・archiv-tickets','📁・archiv-bewerbungen','📁・archiv-gangs','📁・archiv-sonstiges'].map(name=>({name,type:ChannelType.GuildText})) },
 { name:'🎧 SUPPORT-RÄUME', visibility:'team', channels:[] }
];

const roleDefinitions = [
 { key:'admin', name:'👑 Serverleitung', color:0xf1c40f }, { key:'management', name:'🛠️ Administration', color:0xe67e22 }, { key:'moderation', name:'🛡️ Moderation', color:0xe74c3c }, { key:'team', name:'🎫 Support-Team', color:0x3498db }, { key:'onduty', name:'🟢 On Duty', color:0x2ecc71 }, { key:'police', name:'👮 Polizei', color:0x2980b9 }, { key:'fire', name:'🚒 Feuerwehr', color:0xc0392b }, { key:'ems', name:'🚑 Rettungsdienst', color:0x1abc9c }, { key:'traffic', name:'🚕 Verkehr', color:0xf39c12 }, { key:'gang', name:'🏴 Gang-Leitung', color:0x8e44ad }, { key:'property', name:'🏠 Immobilien-Team', color:0x9b59b6 }, { key:'member', name:'👤 Bürger', color:0x95a5a6 }
] as const;

export function setupPreview() { return structure.map(g=>`**${g.name}**\n${g.channels.length?g.channels.map(c=>`${c.type===ChannelType.GuildVoice?'🔊':'#'} ${c.name}`).join('\n'):'(leer, für temporäre Support-Räume)'}`).join('\n\n'); }

function overwrites(guild: Guild, visibility: Group['visibility'], teamRoleId?: string, modRoleId?: string): OverwriteResolvable[] | undefined {
 const everyone = { id:guild.roles.everyone.id, deny: visibility==='public' ? [] : [PermissionFlagsBits.ViewChannel] };
 const rows: OverwriteResolvable[] = [everyone];
 if (visibility==='team' && teamRoleId) rows.push({id:teamRoleId,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.Connect]});
 if (visibility==='mod' && modRoleId) rows.push({id:modRoleId,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages]});
 if (visibility==='admin') rows.push({id:guild.roles.everyone.id,deny:[PermissionFlagsBits.ViewChannel]});
 rows.push({id:guild.client.user!.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ManageChannels]});
 return rows;
}

export async function buildServer(guild: Guild, teamRoleId?: string, ondutyRoleId?: string, modRoleId?: string) {
 const roleIds: Record<string,string> = {};
 for (const definition of roleDefinitions) { let role=guild.roles.cache.find(r=>r.name===definition.name); if (!role) role=await guild.roles.create({name:definition.name,color:definition.color,reason:'Nutruf Hamburg RP Server-Setup'}); roleIds[definition.key]=role.id; }
 if (teamRoleId && guild.roles.cache.has(teamRoleId)) roleIds.team=teamRoleId;
 if (ondutyRoleId && guild.roles.cache.has(ondutyRoleId)) roleIds.onduty=ondutyRoleId;
 if (modRoleId && guild.roles.cache.has(modRoleId)) roleIds.moderation=modRoleId;
 teamRoleId=roleIds.team; ondutyRoleId=roleIds.onduty; modRoleId=roleIds.moderation;
 saveRoleMap(guild.id,roleIds);
 const created:string[]=[]; const existing:string[]=[]; const incompatible:string[]=[]; const ids:Record<string,string>={};
 for (const group of structure) {
  let category=guild.channels.cache.find(c=>c.type===ChannelType.GuildCategory && c.name===group.name);
  if (!category) { category=await guild.channels.create({name:group.name,type:ChannelType.GuildCategory,permissionOverwrites:overwrites(guild,group.visibility,teamRoleId,modRoleId)}); rememberManagedChannel(guild.id,category.id); created.push(group.name); } else existing.push(group.name);
  for (const entry of group.channels) {
   const found=guild.channels.cache.find(c=>c.parentId===category!.id && c.name===entry.name);
   if (found) { if(found.type!==entry.type) incompatible.push(`${group.name} / ${entry.name}`); else { existing.push(entry.name); ids[entry.name]=found.id; if (entry.setting) saveSetting(guild.id,entry.setting,found.id); } continue; }
   const channel=await guild.channels.create({name:entry.name,type:entry.type as ChannelType.GuildText | ChannelType.GuildVoice,parent:category.id,permissionOverwrites:overwrites(guild,group.visibility,teamRoleId,modRoleId),topic:entry.type===ChannelType.GuildText?`Nutruf Hamburg RP — ${entry.name}`:undefined});
   created.push(entry.name); rememberManagedChannel(guild.id,channel.id); ids[entry.name]=channel.id; if (entry.setting) saveSetting(guild.id,entry.setting,channel.id);
  }
 }
 const supportCategory=guild.channels.cache.find(c=>c.type===ChannelType.GuildCategory && c.name==='🎧 SUPPORT-RÄUME');
 if (supportCategory) saveSetting(guild.id,'team_lobby_channel',guild.channels.cache.find(c=>c.name==='🔊・support-warteraum')?.id??'');
 const map=(name:string,key:string)=>{ const c=guild.channels.cache.find(x=>x.name===name); if(c) saveSetting(guild.id,key,c.id); };
 map('🚨・polizei','emergency_channel'); map('📜・bot-logs','log_channel'); map('👮・team-bewerbungen','application_channel'); map('🟢・team-status','team_list_channel'); map('🏴・gang-bewerbungen','gang_channel'); map('🗺️・grundstücke','property_channel');
 saveSetting(guild.id,'team_role_id',teamRoleId??''); saveSetting(guild.id,'onduty_role_id',ondutyRoleId??'');
 return { categories:structure.length, created, existing, incompatible, ids };
}
