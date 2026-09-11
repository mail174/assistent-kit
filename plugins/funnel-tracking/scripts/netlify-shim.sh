#!/usr/bin/env bash
# CHANGELOG-PFLICHT: PATH-Shim vor dem echten netlify-CLI. Blockt `netlify deploy` mit Prod-Flag
# in Repos mit funnel-changelog-Marker (cwd oder bis fuenf Ordner hoeher), es sei denn
# FUNNEL_DEPLOY_VIA_SCRIPT=1 ist gesetzt (macht scripts/deploy.mjs). Alles andere geht 1:1 durch.
# Installiert vom Skill funnel-tracking ueber scripts/install-shim.sh.
self=$(readlink -f "${BASH_SOURCE[0]}")
real=""
while IFS= read -r c; do
  if [ "$(readlink -f "$c")" != "$self" ]; then real=$c; break; fi
done < <(type -aP netlify)
if [ -z "$real" ]; then echo "netlify-shim: echtes netlify-CLI nicht gefunden" >&2; exit 127; fi

if [ "${1:-}" = "deploy" ] && [ "${FUNNEL_DEPLOY_VIA_SCRIPT:-}" != "1" ]; then
  prod=0
  for a in "$@"; do
    case "$a" in -p|--prod|--prod-if-unlocked|--prod=true) prod=1 ;; esac
  done
  if [ "$prod" = 1 ]; then
    d=$PWD
    for _ in 1 2 3 4 5; do
      if [ -f "$d/CHANGELOG.md" ] && grep -q '<!-- funnel-changelog' "$d/CHANGELOG.md"; then
        echo "CHANGELOG-PFLICHT: $d ist ein Funnel-Repo. Prod-Deploy nur ueber 'npm run deploy' (erst Eintrag oben in CHANGELOG.md). Regeln: $d/AGENTS.md" >&2
        exit 2
      fi
      [ "$d" = "/" ] && break
      d=$(dirname "$d")
    done
  fi
fi
exec "$real" "$@"
