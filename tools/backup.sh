#!/bin/bash
# Save progress to GitHub in two places:
#   1. the site itself: commit and push the working tree on claude/site-refresh
#   2. the working files that live outside the repository (handbook, build tools, page
#      drafts, workflow scripts, the component kit): snapshot to the separate branch
#      claude/site-refresh-workbench (its own history; it can never be merged into the site)
#
#   bash backup.sh "Commit subject for the site checkpoint"
set -u
R=/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh
REPO=/home/user/Knightwebstudio
MSG="${1:-Site refresh, work in progress}"
TRAILER=$'Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01Qcbh2TRmKJDnT555ZJ846o'

push() {  # branch
  local n
  for n in 1 2 3 4 5; do
    if git -C "$REPO" push -q -u origin "$1" 2>/tmp/kws-push.err; then echo "pushed $1"; return 0; fi
    sleep $((2 ** n))
  done
  echo "PUSH FAILED for $1:"; cat /tmp/kws-push.err; return 1
}

# 1. the site
cd "$REPO" || exit 1
git add -A
if git diff --cached --quiet; then echo "site: nothing new to commit"; else
  git commit -q -m "$MSG" -m "Checkpoint, not ready to merge." -m "$TRAILER" && echo "site: committed $(git rev-parse --short HEAD)"
fi
BR=$(git rev-parse --abbrev-ref HEAD)
if [ "$BR" = "main" ]; then echo "site: on main, not pushing"; elif [ -n "$(git log origin/$BR..HEAD --oneline 2>/dev/null)" ] || ! git rev-parse -q --verify origin/$BR >/dev/null; then push "$BR"; else echo "site: already pushed"; fi

# 2. the working files
STAGE="$R/.backup-stage"
rm -rf "$STAGE"; mkdir -p "$STAGE"
python3 - "$R" "$STAGE" <<'PY'
import os, shutil, sys, pathlib
R, S = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
TEXT = {'.md', '.py', '.js', '.mjs', '.html', '.css', '.json', '.txt', '.sh', '.inc', '.svg', '.glsl', '.tsx', '.ts'}
SKIP_PARTS = {'node_modules', '__pycache__', 'shots', 'critique', 'baseline', 'prefold', 'site-copy', 'pw', '.backup-stage', 'preview', 'judge', 'review-system', 'tool-results'}
def want(p):
    rel = p.relative_to(R); parts = set(rel.parts)
    if parts & SKIP_PARTS: return False
    if any(x.startswith('.browsers') or x.startswith('firefox-') or x.startswith('chromium') or x.startswith('webkit-') or x.startswith('ffmpeg-') for x in rel.parts): return False
    if rel.name == 'other-chat-tail.txt': return False
    top = rel.parts[0]
    if top == 'design':    # the four prototype sites are large; keep only their notes
        return rel.name == 'DESIGN.md'
    if p.suffix.lower() not in TEXT: return False
    if p.stat().st_size > 600_000: return False
    if top in ('review', 'integrate'):   # reviewers' evidence folders are huge: keep findings, worklists and their top-level scripts only
        if len(rel.parts) > 4 or p.stat().st_size > 120_000: return False
        if p.suffix.lower() not in {'.md', '.json', '.py', '.js', '.txt'}: return False
    if any('copy' in part.lower() or part in ('site', 'repo', 'dist') for part in rel.parts[:-1]): return False
    return True
n = size = 0
for dirpath, dirnames, filenames in os.walk(R):
    dirnames[:] = [d for d in dirnames if d not in SKIP_PARTS and not d.startswith('.browsers') and not d.startswith('firefox-') and 'copy' not in d.lower()]
    for f in filenames:
        p = pathlib.Path(dirpath) / f
        try:
            if p.is_symlink() or not p.is_file() or not want(p): continue
            dest = S / p.relative_to(R); dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(p, dest); n += 1; size += p.stat().st_size
        except OSError:
            pass
(S / 'README.md').write_text('''# Working files for the KnightWebstudio site refresh

This branch is a backup of the files used to build the redesign that live outside the site
repository: the brief, the design handbook (DESIGN.md), the page build tools (tools/), each
page's content file (pages/), the workflow scripts (wf/), the component gallery source and the
motion kit (motion/). It has its own history and is not part of the website. Do not merge it.

To restore on a new machine, copy this tree to the scratch folder the tools expect
(the path in tools/kws_page.py) and restart the local servers listed in BRIEF.md.
''')
print(f'workbench: staged {n} files, {size/1e6:.1f} MB')
PY
export GIT_DIR="$REPO/.git" GIT_WORK_TREE="$STAGE" GIT_INDEX_FILE="$R/.backup.index"
rm -f "$GIT_INDEX_FILE"
git add -A . >/dev/null 2>&1
TREE=$(git write-tree)
PARENT=$(git rev-parse -q --verify refs/heads/claude/site-refresh-workbench || true)
if [ -n "$PARENT" ] && [ "$(git rev-parse "$PARENT^{tree}")" = "$TREE" ]; then
  echo "workbench: no change since last backup"
else
  COMMIT=$(printf '%s\n\n%s\n' "Working files backup: $MSG" "$TRAILER" | git commit-tree "$TREE" ${PARENT:+-p "$PARENT"})
  git update-ref refs/heads/claude/site-refresh-workbench "$COMMIT"
  echo "workbench: committed $(git rev-parse --short "$COMMIT")"
fi
unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE
rm -rf "$STAGE"
if [ "$(git -C "$REPO" rev-parse -q --verify refs/remotes/origin/claude/site-refresh-workbench || true)" != "$(git -C "$REPO" rev-parse refs/heads/claude/site-refresh-workbench)" ]; then push claude/site-refresh-workbench; else echo "workbench: already pushed"; fi
