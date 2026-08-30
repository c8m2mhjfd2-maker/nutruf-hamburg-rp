# Firework Factory Tycoon

Ein Roblox-Tycoon-MVP, in dem jeder Spieler eine eigene Fabrik besitzt und an einer virtuellen Werkbank individuelle Feuerwerke konfiguriert. Die Spieler wählen Rakete, Single Shot, Vulkan, Batterie oder Böller, stellen Farben, Funken und Muster zusammen, testen das Ergebnis, produzieren es und verkaufen es für Coins.

## Enthaltene Systeme

| System | Umsetzung |
|---|---|
| Eigene Fabrik | Automatisches Grundstück pro Spieler mit Fabrikschild und Spawnpunkt |
| Freie Werkbank | Produkttyp, virtuelle Pulvermenge, mehrere Farben, Funken und Muster |
| Testshow | Bewertungswert von 10 bis 100 Punkten mit zufälliger Varianz |
| Produktion | Rezept wird im virtuellen Lager gespeichert |
| Verkauf | Preis hängt vom Produkttyp und Qualitätswert ab |
| Fortschritt | Level, XP, Coins und Werkbank-Kapazitätsupgrades |
| Multiplayer-Grundlage | Serverautorität für Rezeptprüfung, Inventar und Währung |

## Installation in Roblox Studio

Die Dateien sind für einen Rojo-Workflow vorbereitet. Installiere Rojo für Roblox Studio, öffne `default.project.json` und synchronisiere das Projekt in eine neue Baseplate. Alternativ kannst du die beiden Lua-Dateien manuell kopieren: `FireworkFactory.server.lua` gehört nach `ServerScriptService`, `FireworkFactory.client.lua` nach `StarterPlayer > StarterPlayerScripts`.

Starte anschließend den Play-Test in Roblox Studio. Die Werkbank-Oberfläche erscheint automatisch links auf dem Bildschirm. Zuerst werden Produkttyp, virtuelle Pulvermenge, Farben, Funken und Muster ausgewählt. Danach wird das Rezept gespeichert, getestet, produziert und aus dem Lager verkauft.

## Sicherheitsdesign

Die Feuerwerkskomponenten sind reine Spielparameter. Es gibt keine echten Stoffnamen, realen Mischungsverhältnisse, Bauanleitungen oder Hinweise zur Herstellung von Pyrotechnik. Die Testshow wird als Spielwertung simuliert. Für ein öffentliches Spiel sollte zusätzlich ein Alters- und Inhaltscheck in Roblox sowie eine Moderation der Chat- und Namensfelder eingerichtet werden.

## Nächste sinnvolle Ausbaustufen

Als nächstes können 3D-Werkbänke mit ProximityPrompts, eine sichtbare Testarena mit Partikel-Effekten, echte Fabrikgebäude, NPC-Kunden, Aufträge, tägliche Belohnungen, Speicherung über DataStore und ein globales Leaderboard ergänzt werden.
