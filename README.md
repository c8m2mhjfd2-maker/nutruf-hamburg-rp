# Nutruf Hamburg RP Bot

Moderner TypeScript-Discord-Bot für den deutschen RP-Server **Nutruf Hamburg RP**. Der Bot nutzt Slash Commands, Buttons, Select Menüs, Discord-Embeds und eine persistente SQLite-Datenbank.

## Enthaltenes MVP

Das erste stabile Modul umfasst Notrufe mit Einsatznummern, Kategorien, Status und Übernahme-Buttons, Dienststatus für Polizei/Feuerwehr/Rettungsdienst, RP-Profile, Punkte-Leaderboard, Ticket-Menü, Serverstatistiken, Moderation und konfigurierbare Protokollkanäle. Die Architektur ist modular erweiterbar für Bewerbungsformulare, detaillierte Einheitenverwaltung und weitere RP-Aktionen.

## Lokal starten

```bash
cp .env.example .env
npm install
npm run build
npm start
```

Trage in `.env` den Bot-Token, die Application-ID und optional die Testserver-ID ein. Der Token gehört ausschließlich in Railway Variables oder die lokale `.env` und niemals in GitHub.

## Discord Developer Portal

Erstelle eine Bot-Anwendung, aktiviere die benötigten Gateway-Intents und lade den Bot mit den Scopes `bot` und `applications.commands` auf den Server ein. Für Moderationsfunktionen werden unter anderem die Discord-Berechtigungen „Moderate Members“, „Manage Messages“, „Kick Members“ und „Ban Members“ benötigt. Vergib nur die Rechte, die der Bot tatsächlich braucht.

## Railway Deployment

1. Repository nach GitHub pushen.
2. In Railway ein neues Projekt aus dem GitHub-Repository erstellen.
3. Unter **Variables** setzen: `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID` und optional `DATABASE_PATH=/app/data/nutruf.sqlite`.
4. Ein Railway Volume unter `/app/data` mounten, damit SQLite-Neutraldaten bei Deployments erhalten bleiben.
5. Railway verwendet automatisch `npm install`, `npm run build` und `npm start` über die Projektkonfiguration.
6. Nach dem ersten Start in Discord zunächst `/setup server` ausführen. Der Bot erstellt die vorgesehenen Kategorien und Kanäle, verwendet dabei keine automatisch erfundenen Rollen und akzeptiert optional die IDs vorhandener Team- und On-Duty-Rollen. Einzelne Kanal-IDs können anschließend über `/setup kanaele` hinterlegt werden.

## Wichtige Commands

| Command | Zweck |
|---|---|
| `/notruf` | Notruf mit Kategorie, Ort und Beschreibung erstellen |
| `/einsatz status` | Einsatzstatus ändern |
| `/einsatz uebernehmen` | Einsatz übernehmen |
| `/einsatz melden` | Sich zu einem Einsatz melden |
| `/dienst status` | Dienststatus setzen |
| `/dienst liste` | Aktive Einsatzkräfte anzeigen |
| `/rp profil` | RP-Profil speichern |
| `/rp anzeigen` | RP-Profil anzeigen |
| `/punkte anzeigen` / `/punkte leaderboard` | Punkte und Rangliste |
| `/ticket` | Ticket-Auswahlmenü posten |
| `/info` | Serverstatistiken |
| `/setup server` | Serverstruktur aus Kategorien und Kanälen einrichten; vorhandene Rollen optional zuweisen |
| `/setup kanaele` | Einzelne vorhandene Kanal-ID konfigurieren |
| `/moderation timeout` / `/moderation clear` | Moderation |

## Sicherheit

Die Bot-Rolle sollte möglichst weit unten in der Rollenhierarchie liegen. Stelle `DISCORD_GUILD_ID` für sofortige Testserver-Commands ein; ohne diese Variable werden globale Commands registriert, deren Aktualisierung länger dauern kann. Vor dem produktiven Einsatz sollten zusätzlich automatische Backups des Railway-Volumes eingerichtet werden.
