import json, sys, datetime, re

SRC = "/root/.claude/projects/-home-user-JKNO/1c1f6884-dfea-52ad-9484-d8fab8e5fe28.jsonl"
OUT = sys.argv[1]
RESULT_CAP = 2500
INPUT_CAP  = 3000

rows = []
for line in open(SRC, encoding="utf-8"):
    line = line.strip()
    if line:
        try: rows.append(json.loads(line))
        except json.JSONDecodeError: pass

meta = next((r for r in rows if r.get("sessionId") and r.get("cwd")), {})
stamps = [r["timestamp"] for r in rows if r.get("timestamp")]

def ts(s):
    try: return datetime.datetime.fromisoformat(s.replace("Z", "+00:00")).strftime("%Y-%m-%d %H:%M UTC")
    except Exception: return s

def clip(s, n):
    s = s.rstrip()
    return s if len(s) <= n else s[:n] + f"\n… [{len(s)-n:,} more characters truncated]"

def strip_reminders(s):
    return re.sub(r"<system-reminder>.*?</system-reminder>", "", s, flags=re.S).strip()

def flatten(c):
    if isinstance(c, str): return c
    if isinstance(c, list):
        out = []
        for b in c:
            if isinstance(b, dict):
                if b.get("type") == "text": out.append(b.get("text", ""))
                elif b.get("type") == "image": out.append("_[image]_")
            elif isinstance(b, str): out.append(b)
        return "\n".join(out)
    return str(c)

def fence(body, lang=""):
    f = "```"
    while f in body: f += "`"
    return f"{f}{lang}\n{body}\n{f}"

L = []
L.append("# Session transcript — Cloud code chat export\n")
L.append("Verbatim record of this Claude Code on the web session, converted from the")
L.append("session's own JSONL log. Assistant reasoning is included and labelled.")
L.append("Long tool outputs are truncated at "
         f"{RESULT_CAP:,} characters; the character count of what was cut is noted inline.\n")
L.append("| | |")
L.append("|---|---|")
L.append(f"| Session | `{meta.get('sessionId','?')}` |")
L.append(f"| Repository | jknojokesss/JKNO |")
L.append(f"| Branch | `{meta.get('gitBranch','?')}` |")
L.append(f"| Working dir | `{meta.get('cwd','?')}` |")
L.append(f"| Started | {ts(min(stamps)) if stamps else '?'} |")
L.append(f"| Last entry | {ts(max(stamps)) if stamps else '?'} |")
L.append(f"| CLI version | {meta.get('version','?')} |")
L.append(f"| Exported | {datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M UTC')} |")
L.append("\n---\n")

names = {}   # tool_use_id -> tool name
turn = 0

for r in rows:
    t = r.get("type")
    if t not in ("user", "assistant"):
        continue
    content = (r.get("message") or {}).get("content")

    if t == "user":
        if isinstance(content, str):
            body = strip_reminders(content)
            if not body: continue
            turn += 1
            L.append(f"## 👤 User — turn {turn}\n")
            L.append(f"_{ts(r.get('timestamp',''))}_\n")
            L.append(body + "\n")
        elif isinstance(content, list):
            for b in content:
                if not isinstance(b, dict) or b.get("type") != "tool_result":
                    continue
                nm = names.get(b.get("tool_use_id"), "tool")
                body = strip_reminders(flatten(b.get("content")))
                err = " — ERROR" if b.get("is_error") else ""
                L.append(f"<details><summary><b>↩ Result: {nm}</b>{err}</summary>\n")
                L.append(fence(clip(body, RESULT_CAP) or "(empty)"))
                L.append("\n</details>\n")

    else:  # assistant
        if not isinstance(content, list): continue
        for b in content:
            if not isinstance(b, dict): continue
            k = b.get("type")
            if k == "thinking":
                th = (b.get("thinking") or "").strip()
                if th:
                    L.append("<details><summary><i>Thinking</i></summary>\n")
                    L.append("\n".join("> " + ln for ln in th.splitlines()))
                    L.append("\n</details>\n")
            elif k == "text":
                tx = (b.get("text") or "").strip()
                if tx:
                    L.append("### 🤖 Claude\n")
                    L.append(tx + "\n")
            elif k == "tool_use":
                nm = b.get("name", "?")
                names[b.get("id")] = nm
                inp = b.get("input") or {}
                L.append(f"**🔧 {nm}**\n")
                if nm == "Bash":
                    if inp.get("description"): L.append(f"_{inp['description']}_\n")
                    L.append(fence(clip(str(inp.get("command", "")), INPUT_CAP), "bash"))
                elif nm in ("Write", "Edit"):
                    L.append(f"`{inp.get('file_path','?')}`\n")
                    payload = inp.get("content") or inp.get("new_string") or ""
                    L.append(fence(clip(str(payload), INPUT_CAP)))
                else:
                    L.append(fence(clip(json.dumps(inp, indent=2, ensure_ascii=False), INPUT_CAP), "json"))
                L.append("")

L.append("\n---\n")
L.append(f"_End of transcript — {turn} user turns, "
         f"{sum(1 for r in rows if r.get('type')=='assistant')} assistant messages, "
         f"{len(names)} tool calls._")

open(OUT, "w", encoding="utf-8").write("\n".join(L) + "\n")
print("wrote", OUT)
