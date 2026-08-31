#!/usr/bin/env python3
"""
Export Claude Code chat transcripts to Markdown.

Claude Code keeps every local session as a JSONL log under
    ~/.claude/projects/<working-dir-with-slashes-as-dashes>/<session-id>.jsonl
This reads those and writes readable Markdown.

Stdlib only. Python 3.8+. Works on macOS, Linux and Windows.

    python3 export-claude-chats.py --list
    python3 export-claude-chats.py --all --out ./claude-chats
    python3 export-claude-chats.py --session 1c1f6884 --out ./claude-chats
    python3 export-claude-chats.py --all --out ./chats --project JKNO
    python3 export-claude-chats.py --all --out ./chats --no-thinking
"""

import argparse, datetime, json, os, pathlib, re, sys

RESULT_CAP_DEFAULT = 2500
INPUT_CAP = 3000


# ── reading ───────────────────────────────────────────────────────────────

def load(path):
    rows = []
    with open(path, encoding="utf-8", errors="replace") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError:
                continue          # a half-written final line is normal on a live session
    return rows


def find_sessions(root):
    if not root.is_dir():
        return []
    out = []
    for jf in sorted(root.glob("*/*.jsonl")):
        try:
            if jf.stat().st_size == 0:
                continue
        except OSError:
            continue
        out.append(jf)
    return out


# ── formatting helpers ────────────────────────────────────────────────────

def ts(s):
    if not s:
        return "?"
    try:
        return datetime.datetime.fromisoformat(
            str(s).replace("Z", "+00:00")).strftime("%Y-%m-%d %H:%M UTC")
    except Exception:
        return str(s)


def day(s):
    if not s:
        return "0000-00-00"
    try:
        return datetime.datetime.fromisoformat(
            str(s).replace("Z", "+00:00")).strftime("%Y-%m-%d")
    except Exception:
        return "0000-00-00"


def clip(s, n):
    s = (s or "").rstrip()
    if len(s) <= n:
        return s
    return s[:n] + "\n… [{:,} more characters truncated]".format(len(s) - n)


def strip_reminders(s):
    s = re.sub(r"<system-reminder>.*?</system-reminder>", "", s or "", flags=re.S)
    s = re.sub(r"<local-command-[a-z-]+>.*?</local-command-[a-z-]+>", "", s, flags=re.S)
    return s.strip()


def flatten(c):
    if isinstance(c, str):
        return c
    if isinstance(c, list):
        parts = []
        for b in c:
            if isinstance(b, dict):
                if b.get("type") == "text":
                    parts.append(b.get("text", ""))
                elif b.get("type") == "image":
                    parts.append("_[image]_")
            elif isinstance(b, str):
                parts.append(b)
        return "\n".join(parts)
    if c is None:
        return ""
    return str(c)


def fence(body, lang=""):
    """Fence that survives bodies which themselves contain backtick fences."""
    f = "```"
    while f in (body or ""):
        f += "`"
    return "{}{}\n{}\n{}".format(f, lang, body, f)


def slugify(s, n=48):
    s = re.sub(r"\s+", "-", (s or "").strip().lower())
    s = re.sub(r"[^a-z0-9-]", "", s)
    s = re.sub(r"-{2,}", "-", s).strip("-")
    return (s[:n].rstrip("-") or "session")


# ── session summary ───────────────────────────────────────────────────────

def describe(path, rows):
    meta = next((r for r in rows if r.get("sessionId") and r.get("cwd")), {})
    stamps = [r.get("timestamp") for r in rows if r.get("timestamp")]

    prompts = []
    for r in rows:
        if r.get("type") != "user" or r.get("isSidechain"):
            continue
        c = (r.get("message") or {}).get("content")
        if isinstance(c, str):
            t = strip_reminders(c)
            if t:
                prompts.append(t)

    title = ""
    for r in rows:                       # Claude Code writes a summary row for named sessions
        if r.get("type") == "summary" and r.get("summary"):
            title = str(r["summary"]).strip()
            break
    if not title and prompts:
        title = " ".join(prompts[0].split())[:80]
    if not title:
        title = "(no user prompts)"

    cwd = meta.get("cwd") or path.parent.name.replace("-", "/")
    return {
        "path": path,
        "id": path.stem,
        "short": path.stem[:8],
        "cwd": cwd,
        "project": pathlib.PurePath(cwd).name or path.parent.name,
        "branch": meta.get("gitBranch") or "",
        "version": meta.get("version") or "",
        "start": min(stamps) if stamps else "",
        "end": max(stamps) if stamps else "",
        "turns": len(prompts),
        "messages": sum(1 for r in rows if r.get("type") == "assistant"),
        "title": title,
        "size": path.stat().st_size,
    }


# ── rendering ─────────────────────────────────────────────────────────────

def render(info, rows, keep_thinking=True, result_cap=RESULT_CAP_DEFAULT):
    L = []
    L.append("# {}\n".format(info["title"]))
    L.append("Claude Code session transcript, converted from the session's own JSONL log.")
    L.append("Long tool outputs are truncated at {:,} characters.\n".format(result_cap))
    L.append("| | |")
    L.append("|---|---|")
    L.append("| Session | `{}` |".format(info["id"]))
    L.append("| Project | `{}` |".format(info["cwd"]))
    if info["branch"]:
        L.append("| Branch | `{}` |".format(info["branch"]))
    L.append("| Started | {} |".format(ts(info["start"])))
    L.append("| Last entry | {} |".format(ts(info["end"])))
    if info["version"]:
        L.append("| CLI version | {} |".format(info["version"]))
    L.append("| Exported | {} |".format(
        datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")))
    L.append("\n---\n")

    names, turn = {}, 0

    for r in rows:
        if r.get("isSidechain"):        # subagent side conversations
            continue
        kind = r.get("type")
        if kind not in ("user", "assistant"):
            continue
        content = (r.get("message") or {}).get("content")

        if kind == "user":
            if isinstance(content, str):
                body = strip_reminders(content)
                if not body:
                    continue
                turn += 1
                L.append("## 👤 User — turn {}\n".format(turn))
                L.append("_{}_\n".format(ts(r.get("timestamp"))))
                L.append(body + "\n")
            elif isinstance(content, list):
                for b in content:
                    if not isinstance(b, dict) or b.get("type") != "tool_result":
                        continue
                    nm = names.get(b.get("tool_use_id"), "tool")
                    body = strip_reminders(flatten(b.get("content")))
                    err = " — ERROR" if b.get("is_error") else ""
                    L.append("<details><summary><b>↩ Result: {}</b>{}</summary>\n".format(nm, err))
                    L.append(fence(clip(body, result_cap) or "(empty)"))
                    L.append("\n</details>\n")

        else:
            if not isinstance(content, list):
                continue
            for b in content:
                if not isinstance(b, dict):
                    continue
                t = b.get("type")
                if t == "thinking":
                    th = (b.get("thinking") or "").strip()
                    if th and keep_thinking:
                        L.append("<details><summary><i>Thinking</i></summary>\n")
                        L.append("\n".join("> " + ln for ln in th.splitlines()))
                        L.append("\n</details>\n")
                elif t == "text":
                    tx = (b.get("text") or "").strip()
                    if tx:
                        L.append("### 🤖 Claude\n")
                        L.append(tx + "\n")
                elif t == "tool_use":
                    nm = b.get("name", "?")
                    names[b.get("id")] = nm
                    inp = b.get("input") or {}
                    L.append("**🔧 {}**\n".format(nm))
                    if nm == "Bash":
                        if inp.get("description"):
                            L.append("_{}_\n".format(inp["description"]))
                        L.append(fence(clip(str(inp.get("command", "")), INPUT_CAP), "bash"))
                    elif nm in ("Write", "Edit", "NotebookEdit"):
                        L.append("`{}`\n".format(inp.get("file_path", "?")))
                        payload = inp.get("content") or inp.get("new_string") or ""
                        L.append(fence(clip(str(payload), INPUT_CAP)))
                    else:
                        L.append(fence(clip(json.dumps(inp, indent=2, ensure_ascii=False),
                                            INPUT_CAP), "json"))
                    L.append("")

    L.append("\n---\n")
    L.append("_End of transcript — {} user turns, {} assistant messages, {} tool calls._".format(
        turn, info["messages"], len(names)))
    return "\n".join(L) + "\n"


# ── main ──────────────────────────────────────────────────────────────────

def main():
    p = argparse.ArgumentParser(description="Export Claude Code chats to Markdown.")
    p.add_argument("--root", default=str(pathlib.Path.home() / ".claude" / "projects"),
                   help="where Claude Code keeps sessions (default: ~/.claude/projects)")
    p.add_argument("--list", action="store_true", help="list sessions, export nothing")
    p.add_argument("--all", action="store_true", help="export every session found")
    p.add_argument("--session", help="export one session (full id or a unique prefix)")
    p.add_argument("--project", help="only sessions whose path contains this text")
    p.add_argument("--out", default="./claude-chats", help="output directory")
    p.add_argument("--no-thinking", action="store_true", help="omit assistant reasoning")
    p.add_argument("--result-cap", type=int, default=RESULT_CAP_DEFAULT,
                   help="truncate each tool output at N characters")
    a = p.parse_args()

    root = pathlib.Path(os.path.expanduser(a.root))
    files = find_sessions(root)
    if not files:
        print("No sessions found under {}".format(root), file=sys.stderr)
        print("If Claude Code stores yours elsewhere, pass --root.", file=sys.stderr)
        return 1

    infos = []
    for f in files:
        try:
            infos.append(describe(f, load(f)))
        except Exception as e:
            print("  ! skipped {}: {}".format(f.name, e), file=sys.stderr)
    infos.sort(key=lambda i: i["start"] or "")

    if a.project:
        needle = a.project.lower()
        infos = [i for i in infos if needle in str(i["path"]).lower() or needle in i["cwd"].lower()]
    if a.session:
        infos = [i for i in infos if i["id"].startswith(a.session) or a.session in i["id"]]
        if not infos:
            print("No session matching {!r}".format(a.session), file=sys.stderr)
            return 1

    if a.list or not (a.all or a.session):
        print("\n{} session(s) under {}\n".format(len(infos), root))
        for i in infos:
            print("  {}  {:<10}  {:>3} turns  {:>7}  {}".format(
                day(i["start"]), i["short"], i["turns"],
                "{}KB".format(max(1, i["size"] // 1024)), i["project"]))
            print("     {}".format(i["title"][:90]))
        if not a.list:
            print("\nNothing exported. Add --all, or --session <id>.")
        return 0

    outdir = pathlib.Path(os.path.expanduser(a.out))
    outdir.mkdir(parents=True, exist_ok=True)

    written = []
    for i in infos:
        md = render(i, load(i["path"]),
                    keep_thinking=not a.no_thinking, result_cap=a.result_cap)
        name = "{}--{}--{}.md".format(day(i["start"]), slugify(i["title"]), i["short"])
        (outdir / name).write_text(md, encoding="utf-8")
        written.append((i, name))
        print("  {}  ({:,} chars)".format(name, len(md)))

    idx = ["# Claude Code chats\n",
           "Exported {}. {} session(s).\n".format(
               datetime.datetime.now().strftime("%Y-%m-%d"), len(written)),
           "| Date | Project | Turns | Session |",
           "|---|---|---|---|"]
    for i, name in written:
        idx.append("| {} | `{}` | {} | [{}]({}) |".format(
            day(i["start"]), i["project"], i["turns"],
            i["title"][:70].replace("|", "\\|"), name))
    (outdir / "INDEX.md").write_text("\n".join(idx) + "\n", encoding="utf-8")

    print("\n{} transcript(s) + INDEX.md → {}".format(len(written), outdir))
    return 0


if __name__ == "__main__":
    sys.exit(main())
