# Exporting Claude Code chats

`export-claude-chats.py` turns Claude Code session logs into readable Markdown.

## Why this exists

Claude Code stores every session as a JSONL log on **the machine that ran it**:

```
~/.claude/projects/<working-dir, slashes as dashes>/<session-id>.jsonl
```

So where a chat lives depends on where it ran:

| Where the chat ran | Log location | Recoverable? |
|---|---|---|
| Claude Code CLI on your own machine | your `~/.claude/projects/` | **Yes** — run this script |
| Claude Code on the web (cloud) | inside that session's container | **No** — containers are reclaimed when the session ends; the API keeps only metadata (title, dates, branch) |

Cloud sessions can only be exported **while they are still alive**. If a cloud
session is still open, ask it to run this script and commit the result before
it closes. Once it's gone, the transcript is gone — which is why
`docs/CURSOR-HANDOFF.md` had to be reconstructed from commits and PRs instead.

## Use

Requires Python 3.8+. No dependencies.

```bash
# what's on this machine
python3 export-claude-chats.py --list

# export everything
python3 export-claude-chats.py --all --out ~/Desktop/claude-chats

# just one, by id prefix (from --list)
python3 export-claude-chats.py --session 1c1f6884 --out ~/Desktop/claude-chats

# just one project's sessions
python3 export-claude-chats.py --all --project quefence --out ~/Desktop/claude-chats
```

Options:

| Flag | Effect |
|---|---|
| `--root PATH` | where the logs are (default `~/.claude/projects`) |
| `--list` | list sessions, export nothing |
| `--all` | export every session found |
| `--session ID` | export one (full id or unique prefix) |
| `--project TEXT` | only sessions whose path contains TEXT |
| `--out DIR` | output directory (default `./claude-chats`) |
| `--no-thinking` | leave out assistant reasoning |
| `--result-cap N` | truncate each tool output at N chars (default 2500) |

## Output

One `YYYY-MM-DD--title--shortid.md` per session, plus an `INDEX.md` table.
Each file has a metadata header (session id, project, branch, times, CLI
version) then the conversation: user turns, Claude's replies, reasoning in
collapsible `Thinking` blocks, and every tool call with its output in
collapsible `Result` blocks.

Excluded: subagent side-conversations, system reminders, injected command
output. Malformed and zero-byte logs are skipped rather than crashing the run,
so a live session mid-write still exports.

## Before sharing an export

Transcripts contain whatever the session saw. These are code sessions, so that
can include credentials printed by a command or pasted into chat. Grep before
committing or sending one anywhere:

```bash
grep -nE 'eyJ[A-Za-z0-9_-]{20,}|sk_(live|test)_|AIza[A-Za-z0-9_-]{30,}|ghp_[A-Za-z0-9]{20,}' *.md
```

`../SESSION-TRANSCRIPT.md` in this repo was scanned this way: it carries
environment variable *names* only, no values.
