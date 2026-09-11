#!/usr/bin/env bash
# Legt den netlify-Shim in ~/.local/bin (oder in $1) ab. Idempotent.
# Prueft danach, dass der Shim im PATH vor dem echten CLI liegt.
set -euo pipefail
here=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
dest_dir=${1:-$HOME/.local/bin}
mkdir -p "$dest_dir"
install -m 755 "$here/netlify-shim.sh" "$dest_dir/netlify"
first=$(type -P netlify || true)
if [ "$first" != "$dest_dir/netlify" ]; then
  echo "WARNUNG: '$first' liegt im PATH vor $dest_dir/netlify. PATH anpassen, sonst greift der Shim nicht." >&2
  exit 1
fi
real=$(type -aP netlify | grep -vx "$dest_dir/netlify" | head -1 || true)
if [ -z "$real" ]; then echo "WARNUNG: kein echtes netlify-CLI im PATH gefunden" >&2; exit 1; fi
echo "Shim aktiv: $dest_dir/netlify, leitet weiter an $real"
