---
name: environment-setup
trigger: "auto — every session start and before any Bash/search/research operation"
evolved_from:
  - fnm-env-every-bash
  - no-sudo-use-python
  - cgc-before-grep
  - context7-for-library-docs
  - subagent-driven-development
  - detailed-ls-preference
  - npm-use-minimal
domain: tooling
created: "2026-02-22T08:10:00Z"
---

# Environment Setup

How to operate in this workspace. Apply automatically — don't rediscover these patterns.

## Shell Environment

Every Bash call needing Node/npm MUST start with:
```bash
export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"
```
State does not persist between Bash invocations. No exceptions.

`sudo` requires a password. Use Python workarounds for elevated operations.

When listing directories, prefer `ls -la` for full metadata.

## Tool Hierarchy for Code Lookup

1. **CodeGraphContext** first — `find_code`, `analyze_code_relationships` for callers, callees, hierarchy, imports
2. **Glob/Grep** second — for text-based search when CGC doesn't have it indexed
3. **Read** third — for reading specific files once located

Never skip straight to grep when CGC can answer the question semantically.

## Tool Hierarchy for Library Research

1. **Context7** first — `resolve-library-id` → `query-docs` for R3F, drei, Three.js, React, Zustand, Tailwind, and all public library APIs
2. **WebSearch** second — only for topics Context7 doesn't cover (project-specific issues, community discussions, bleeding-edge unreleased features)

Context7 returns structured, versioned API docs with code examples. Always prefer it.

## NPM Usage

NPM commands are deliberately infrequent (~5% of bash operations). The dev server runs continuously in background, `tsc --noEmit` runs via PostToolUse hook after edits, builds happen only at session end. Use npm for specific targets, not as a continuous loop.

## Subagent Execution

When implementing multi-task plans:
- Use **Explore** agent type for domain-expert subagents (avoids MCP tool name conflicts)
- Keep scopes small — each subagent should complete within usage limits
- Never check out branches from within subagents
- Have subagents write results to **files**, not conversation payloads
- Batch status updates — don't narrate each subagent individually
