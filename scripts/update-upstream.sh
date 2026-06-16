#!/usr/bin/env bash
# ==========================================================
# Agentic OS — Pull updates from upstream (private repo)
# Merges upstream/main into local branch.
#
# Usage: bash scripts/update-upstream.sh
# ==========================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$REPO_ROOT"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

info()    { printf "${CYAN}  %s${NC}\n" "$1"; }
success() { printf "${GREEN}  ✓ %s${NC}\n" "$1"; }
warn()    { printf "${YELLOW}  → %s${NC}\n" "$1"; }
fail()    { printf "${RED}  ✗ %s${NC}\n" "$1"; }

echo ""
printf "${CYAN}${BOLD}  Agentic OS — Applying upstream updates...${NC}\n"
echo ""

# Load .env for PAT
if [[ -f .env ]]; then
  set -a; source .env; set +a
fi

# Ensure upstream remote has auth
CURRENT_URL=$(git remote get-url upstream 2>/dev/null || echo "")
if echo "$CURRENT_URL" | grep -q "github.com/simonc602/agentic-os"; then
  if ! echo "$CURRENT_URL" | grep -q "@"; then
    info "Updating upstream remote with PAT auth..."
    git remote set-url upstream "https://${GITHUB_TOKEN_AGENTIC_OS}@github.com/simonc602/agentic-os.git"
  fi
fi

info "Fetching upstream..."
if ! git fetch upstream main --quiet 2>/dev/null; then
  fail "Could not fetch upstream. Check your internet/GH token."
  exit 1
fi

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse upstream/main 2>/dev/null || echo "")

if [[ -z "$REMOTE" ]]; then
  fail "Could not resolve upstream/main. Is the remote configured?"
  exit 1
fi

if [[ "$LOCAL" == "$REMOTE" ]]; then
  success "Already up to date with upstream/main!"
  echo ""
  exit 0
fi

BEHIND=$(git rev-list --count HEAD..upstream/main 2>/dev/null || echo 0)

if [[ "$BEHIND" -eq 0 ]]; then
  success "Already up to date! (local is ahead or diverged)"
  echo ""
  exit 0
fi

warn "You are $BEHIND commit(s) behind upstream/main."
echo ""
info "New commits:"
git log --oneline HEAD..upstream/main | while IFS= read -r line; do
    printf "    ${BOLD}•${NC} %s\n" "$line"
done
echo ""

info "Merging upstream/main..."
if git merge upstream/main --no-edit 2>&1; then
  success "Update applied successfully!"
  echo ""
  info "Local is now: $(git rev-parse --short HEAD)"
  echo ""
else
  fail "Merge conflict detected. Resolve manually:"
  echo "  git mergetool"
  echo "  git commit"
  exit 1
fi
