---
name: review
description: Surface relevant instincts for the current task's domain before starting work
evolved_from:
  - instinct-apply (skill — made user-invokable and domain-filtered)
trigger: "user-invoked via /homunculus:review [domain?]"
created: "2026-02-22T12:00:00Z"
---

# Instinct Review

Surface learned behaviors relevant to what you're about to do. Lighter than reading all instincts — filtered by domain.

## Usage

```
/homunculus:review              — auto-detect domain from current context
/homunculus:review tooling      — show tooling instincts
/homunculus:review debugging    — show debugging instincts
/homunculus:review communication — show communication instincts
```

## Process

### 1. Determine Domain

If a domain argument is provided, use it. Otherwise, infer from context:

| Current activity | Domain |
|-----------------|--------|
| About to write/edit code | code-style |
| Running tests or debugging | debugging, testing |
| Making commits or branching | git |
| Setting up tools or environment | tooling |
| Planning or designing | communication |
| Organizing files | file-organization |

### 2. Read Matching Instincts

```bash
# Filter instincts by domain
DOMAIN="[detected or provided domain]"
echo "=== Instincts for: $DOMAIN ==="
for f in .claude/homunculus/instincts/personal/*.md .claude/homunculus/instincts/inherited/*.md; do
  [ -f "$f" ] && grep -q "domain: \"$DOMAIN\"" "$f" && echo "--- $(basename "$f") ---" && cat "$f" && echo
done 2>/dev/null
```

### 3. Also Check Evolved Skills

```bash
# Check if there's an evolved skill for this domain
for f in .claude/homunculus/evolved/skills/*/SKILL.md; do
  [ -f "$f" ] && grep -q "domain: $DOMAIN" "$f" && echo "=== Evolved Skill ===" && cat "$f" && echo
done 2>/dev/null
```

### 4. Present Summary

Format as a quick checklist:

```
Instinct Review: [DOMAIN]

Applicable:
- [instinct name] (confidence: X.X) — [one-line action summary]
- [instinct name] (confidence: X.X) — [one-line action summary]

Anti-instincts (STOP):
- [instinct name] — [what to avoid]

Evolved skill: [name] (if applicable)
```

If no instincts match the domain: "No instincts for [domain] yet. Work in this area will generate them."

## Behavioral Notes

- Keep it brief. This is a pre-flight checklist, not a report.
- Anti-instincts (STOP actions) should be highlighted prominently — they prevent mistakes.
- If multiple domains seem relevant, show all of them.
- Update `last_validated` on any instinct that's actively relevant to the current session.
