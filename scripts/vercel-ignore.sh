#!/usr/bin/env bash
set -euo pipefail

PREVIOUS_SHA="${VERCEL_GIT_PREVIOUS_SHA:-}"
CURRENT_SHA="${VERCEL_GIT_COMMIT_SHA:-}"

if [[ -z "$PREVIOUS_SHA" || -z "$CURRENT_SHA" ]]; then
  echo "Missing git SHAs; proceeding with deployment."
  exit 1
fi

CHANGED_FILES=$(git diff --name-only "$PREVIOUS_SHA" "$CURRENT_SHA")

if [[ -z "$CHANGED_FILES" ]]; then
  echo "No file changes detected; skipping deployment."
  exit 0
fi

if echo "$CHANGED_FILES" | grep -qv '^content/'; then
  echo "Changes outside content/ detected; deployment required."
  exit 1
fi

echo "Only content/ changes detected; skipping deployment."
exit 0
