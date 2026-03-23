#!/bin/bash
# PreToolUse hook: Remind to read relevant spec before editing source files
# Fires on: Edit (all files, filters .rs/.ts/.tsx/.sql internally)

INPUT=$(cat)

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$REPO_ROOT" ]; then
  echo "$INPUT"
  exit 0
fi

SPECS_DIR="$REPO_ROOT/docs/specs"
if [ ! -d "$SPECS_DIR" ]; then
  echo "$INPUT"
  exit 0
fi

# Extract file_path from JSON input
FILE_PATH=$(echo "$INPUT" | python3 -c "import json,sys; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null)

if [ -z "$FILE_PATH" ]; then
  echo "$INPUT"
  exit 0
fi

BASENAME=$(basename "$FILE_PATH")

# Only trigger for .rs, .ts, .tsx, .sql files
case "$BASENAME" in
  *.rs|*.ts|*.tsx|*.sql|*.dart) ;;
  *) echo "$INPUT"; exit 0 ;;
esac

# Map files to specs via Trigger lines
MATCHED=""
for spec in "$SPECS_DIR"/*.md; do
  [ -f "$spec" ] || continue
  triggers=$(head -5 "$spec" | grep '^> Trigger:' | sed 's/> Trigger: //')
  if [ -z "$triggers" ]; then
    continue
  fi
  if echo "$triggers" | grep -q "$BASENAME"; then
    spec_name=$(basename "$spec")
    if [ -z "$MATCHED" ]; then
      MATCHED="docs/specs/$spec_name"
    else
      MATCHED="$MATCHED, docs/specs/$spec_name"
    fi
  fi
done

if [ -n "$MATCHED" ]; then
  cat <<ENDJSON
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "additionalContext": "[Spec Reminder] ${BASENAME} を編集する前に ${MATCHED} を確認してください。CLAUDE.md Tier 2ルールに従い、関連specをReadしてから編集すること。"
  }
}
ENDJSON
else
  echo "$INPUT"
fi

exit 0
