#!/usr/bin/env python3
# Prueft deploy-guard.py gegen typische Kommandos. Aufruf:
#   python3 test-deploy-guard.py <pfad/zu/deploy-guard.py> <repo-mit-marker> <repo-ohne-marker>
# Die Muster werden erst zur Laufzeit zusammengesetzt, damit der Workspace-Hook diesen
# Testlauf selbst nicht blockt.
import json, os, subprocess, sys

guard, repo, other = sys.argv[1], os.path.abspath(sys.argv[2]), os.path.abspath(sys.argv[3])
ws, name = os.path.dirname(repo), os.path.basename(repo)
N = "net" + "lify"
P = "--" + "prod"
cases = [
    (2, repo, f"{N} deploy {P}"),
    (2, ws, f"cd {name} && npm run build && {N} deploy {P} --site 7176"),
    (2, ws, f"(cd {repo} && {N} deploy -p)"),
    (2, ws, f"cd {repo}; {N} deploy {P}; echo done"),
    (2, ws, f'cd "{repo}" && ntl deploy -p'),
    (2, os.path.join(repo, "src"), f"npx {N}-cli deploy {P}-if-unlocked"),
    (2, repo, f"{N} deploy {P}|tail -3"),
    (0, repo, f"{N} deploy --alias test"),
    (0, repo, f"{N} status"),
    (0, ws, f"cd {os.path.basename(other)} && {N} deploy {P}"),
    (0, repo, "npm run deploy"),
    (0, ws, f"grep -r '{N} deploy' docs/"),
    (0, ws, f'cd {name} && git commit -m "Rohes {N} deploy {P} blockt der Hook"'),
    (2, repo, f"FUNNEL_DEPLOY_VIA_SCRIPT=1 {N} deploy {P}"),
    (2, repo, f"env FUNNEL_DEPLOY_VIA_SCRIPT=1 {N} deploy -p"),
    (2, ws, f"cd {name}\n{N} deploy {P}"),
    (2, ws, f"cd {name} && {{ {N} deploy {P}; }}"),
]
fails = 0
for want, cwd, cmd in cases:
    payload = json.dumps({"cwd": cwd, "tool_name": "Bash", "tool_input": {"command": cmd}})
    r = subprocess.run([sys.executable, guard], input=payload, capture_output=True, text=True)
    ok = r.returncode == want and (want != 2 or "CHANGELOG-PFLICHT" in r.stderr)
    fails += 0 if ok else 1
    print(f"{'ok  ' if ok else 'FAIL'} exit {r.returncode} (soll {want}) <- {cmd}")
r = subprocess.run([sys.executable, guard], input="{kaputt", capture_output=True, text=True)
ok = r.returncode == 0
fails += 0 if ok else 1
print(f"{'ok  ' if ok else 'FAIL'} exit {r.returncode} (soll 0) <- kaputtes JSON")
print(f"{len(cases) + 1 - fails} von {len(cases) + 1} bestanden")
sys.exit(1 if fails else 0)
