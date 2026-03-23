---
name: verify-docs
autoContext: false
description: "Verify the 3-tier documentation infrastructure is working. Use for 'verify docs', 'check docs infrastructure', 'ドキュメント基盤の動作確認', etc."
allowed-tools: Bash, Read, Glob, Grep
---

# Verify Documentation Infrastructure

ClipSync の3階層ドキュメント基盤（ADR-004）が正しく動作しているか検証する。

## When to Activate

- ドキュメント基盤を導入・変更した後
- フックが動作しているか確認したいとき
- CI/CD でドキュメント整合性をチェックしたいとき
- `/verify-docs` で明示的に呼び出されたとき

## Verification Checklist

以下を順番に検証し、結果をテーブルで報告する。

### 1. ディレクトリ構成チェック

必要なファイルが全て存在するか確認:

```
docs/specs/clipboard-flow.md
docs/specs/supabase-data.md
docs/specs/auth-flow.md
docs/specs/ui-components.md
docs/specs/bug-memory.md
docs/adr/000-template.md
docs/adr/001-tauri-v2-desktop-framework.md
docs/adr/002-supabase-backend.md
docs/adr/003-dual-mode-oauth.md
docs/adr/004-three-tier-context-infrastructure.md
.claude/hooks/spec-read-reminder.sh
.claude/hooks/spec-freshness-check.sh
.claude/hooks/pr-spec-reminder.sh
.claude/settings.json
CLAUDE.md
```

### 2. Spec メタデータチェック

各 spec ファイルが正しいメタデータを持っているか:
- `> Trigger:` 行が存在するか
- `> Last updated:` 行が存在するか
- 日付フォーマットが `YYYY-MM-DD` か

```bash
for spec in docs/specs/*.md; do
  name=$(basename "$spec")
  trigger=$(head -5 "$spec" | grep '^> Trigger:')
  updated=$(head -5 "$spec" | grep '^> Last updated:')
  echo "$name | trigger: ${trigger:-(MISSING)} | updated: ${updated:-(MISSING)}"
done
```

### 3. Spec 鮮度チェック

最後の更新日が7日以内か確認:

```bash
TODAY=$(date +%s)
for spec in docs/specs/*.md; do
  name=$(basename "$spec")
  date_str=$(head -5 "$spec" | grep '^> Last updated:' | sed 's/> Last updated: //')
  if [ -n "$date_str" ]; then
    spec_ts=$(date -j -f "%Y-%m-%d" "$date_str" +%s 2>/dev/null)
    if [ -n "$spec_ts" ]; then
      age=$(( (TODAY - spec_ts) / 86400 ))
      if [ "$age" -gt 7 ]; then
        echo "STALE: $name ($age days old)"
      else
        echo "OK: $name ($age days old)"
      fi
    fi
  fi
done
```

### 4. Trigger カバレッジチェック

主要ソースファイルが少なくとも1つの spec の Trigger に含まれているか:

```bash
# Key source files that should be covered by specs
FILES="commands.rs lib.rs App.tsx useClips.ts useAuth.ts auth_server.rs useRealtimeClips.ts supabase.ts types.ts"
for f in $FILES; do
  matched=$(grep -rl "$f" docs/specs/*.md 2>/dev/null | head -1)
  if [ -n "$matched" ]; then
    echo "OK: $f → $(basename "$matched")"
  else
    echo "MISSING: $f has no spec trigger"
  fi
done
```

### 5. Hook スクリプトチェック

フックスクリプトが実行可能か、settings.json に登録されているか:

```bash
# Executable check
for hook in .claude/hooks/*.sh; do
  if [ -x "$hook" ]; then
    echo "OK: $(basename "$hook") is executable"
  else
    echo "FAIL: $(basename "$hook") is NOT executable"
  fi
done

# Settings registration check
if [ -f .claude/settings.json ]; then
  for hook in spec-read-reminder spec-freshness-check pr-spec-reminder; do
    if grep -q "$hook" .claude/settings.json; then
      echo "OK: $hook registered in settings.json"
    else
      echo "FAIL: $hook NOT registered in settings.json"
    fi
  done
fi
```

### 6. Hook 動作テスト

`spec-read-reminder.sh` が正しく応答するかテスト:

```bash
echo '{"tool_input":{"file_path":"src-tauri/src/commands.rs"}}' | .claude/hooks/spec-read-reminder.sh
```

期待出力: `[Spec Reminder] commands.rs を編集する前に docs/specs/clipboard-flow.md を確認してください`

### 7. ADR 整合性チェック

全 ADR の Status が有効な値か:

```bash
for adr in docs/adr/[0-9]*.md; do
  name=$(basename "$adr")
  status=$(grep '^Accepted\|^Draft\|^Rejected\|^Deprecated\|^Superseded' "$adr" | head -1)
  echo "$name: ${status:-(NO STATUS)}"
done
```

### 8. CLAUDE.md Tier 2 セクションチェック

CLAUDE.md に必須セクションが含まれているか:

```bash
checks=(
  "Context Infrastructure"
  "Tier 1"
  "Tier 2"
  "Tier 3"
  "spec-read-reminder"
  "spec-freshness-check"
  "pr-spec-reminder"
  "bug-memory.md"
)
for check in "${checks[@]}"; do
  if grep -q "$check" CLAUDE.md; then
    echo "OK: CLAUDE.md contains '$check'"
  else
    echo "FAIL: CLAUDE.md missing '$check'"
  fi
done
```

### 9. .gitignore チェック

hooks と settings.json が git 追跡可能か:

```bash
git check-ignore .claude/hooks/spec-read-reminder.sh && echo "FAIL: hooks are gitignored" || echo "OK: hooks are trackable"
git check-ignore .claude/settings.json && echo "FAIL: settings.json is gitignored" || echo "OK: settings.json is trackable"
git check-ignore .claude/settings.local.json && echo "OK: settings.local.json is gitignored (secrets safe)" || echo "WARN: settings.local.json is NOT gitignored"
```

## Output Format

検証結果を以下の形式で報告:

```
## Documentation Infrastructure Verification

| # | Check | Result | Details |
|---|-------|--------|---------|
| 1 | Directory structure | ✅/❌ | N/N files present |
| 2 | Spec metadata | ✅/❌ | N specs with valid metadata |
| 3 | Spec freshness | ✅/⚠️ | N stale specs |
| 4 | Trigger coverage | ✅/❌ | N/N files covered |
| 5 | Hook scripts | ✅/❌ | N/N executable + registered |
| 6 | Hook response test | ✅/❌ | reminder output correct |
| 7 | ADR integrity | ✅/❌ | N ADRs with valid status |
| 8 | CLAUDE.md sections | ✅/❌ | N/N sections present |
| 9 | .gitignore | ✅/❌ | hooks trackable, secrets safe |
```
