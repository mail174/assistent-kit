# Assistent-Kit

Knowledge Base und Bausatz fuer einen persoenlichen KI-Assistenten:
24/7 auf einem eigenen Server, erreichbar ueber Telegram, mit Gedaechtnis,
Regeln und Selbstheilung.

Einstieg: Dieses Repo wird nicht von Hand abgearbeitet. Die Start-Datei
(START.md, kommt mit dem persoenlichen Zugang) uebergibt es einem Claude auf
deinem Server, der dich durch alles fuehrt.

## Aufbau

- `wissen/`    Ein Artikel pro Thema. Grammatik: siehe wissen/GRAMMATIK.md
- `vorlagen/`  CLAUDE.md, Bot-Rollen, systemd-Units, Env-Muster
- `skripte/`   Waechter, Transkription, Sprachmemo, Formatierung, Mail-Vorschau
- `skills/`    /setup (Concierge) und Alltags-Ablaeufe

## Updates

Das Kit entwickelt sich weiter. Ein eingerichteter Assistent gleicht sich
woechentlich ab (`git pull`) und schlaegt vor, was uebernommen werden soll.
