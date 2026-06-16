#!/usr/bin/env bash
# ==========================================================
# Agentic OS — Check upstream (private repo) for updates
# Uses GITHUB_TOKEN from .env for API access.
# Also checks Skool page as fallback.
#
# Usage: bash scripts/check-upstream.sh
# Returns: report or "[SILENT]" if nothing new
# ==========================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$REPO_ROOT"

# Load .env
if [[ -f .env ]]; then
  set -a; source .env; set +a
fi

GITHUB_TOKEN="${GITHUB_TOKEN_AGENTIC_OS:-}"
LOCAL_HASH=$(git rev-parse HEAD)
CACHE_FILE="$REPO_ROOT/.upstream-hash"

# ---------- Check via GitHub API (private repo) ----------
UPSTREAM_SHA=""
if [[ -n "$GITHUB_TOKEN" ]]; then
  UPSTREAM_RESP=$(curl -sf \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/simonc602/agentic-os/commits/main" 2>/dev/null) || true

  if [[ -n "$UPSTREAM_RESP" ]]; then
    UPSTREAM_SHA=$(echo "$UPSTREAM_RESP" | grep -o '"sha": "[^"]*"' | head -1 | cut -d'"' -f4)
    UPSTREAM_DATE=$(echo "$UPSTREAM_RESP" | grep -o '"date": "[^"]*"' | head -1 | cut -d'"' -f4)
    UPSTREAM_MSG=$(echo "$UPSTREAM_RESP" | grep -o '"message": "[^"]*"' | head -1 | cut -d'"' -f4)
  fi
fi

# ---------- Fallback: Skool page ----------
SKOOL_UPDATE=""
if [[ -z "$UPSTREAM_SHA" ]]; then
  SKOOL_RESP=$(curl -sfL "https://www.skool.com/scrapes/classroom/d1cfafed?md=552b0ba753df4c738843913fb3eb8312" 2>/dev/null) || true
  if echo "$SKOOL_RESP" | grep -qiE "(update|release|new version|v[0-9])"; then
    SKOOL_UPDATE="⚠️ Nouvelle activité détectée sur la page Skool — vérifie manuellement : https://www.skool.com/scrapes/classroom/d1cfafed"
  fi
fi

# ---------- Compare with cached hash ----------
PREV_SHA=""
[[ -f "$CACHE_FILE" ]] && PREV_SHA=$(cat "$CACHE_FILE")

if [[ -z "$UPSTREAM_SHA" ]]; then
  # No API access — just report Skool status if different from last
  PREV_SKOOL=""
  [[ -f "$CACHE_FILE.skool" ]] && PREV_SKOOL=$(cat "$CACHE_FILE.skool")
  if [[ "$SKOOL_UPDATE" != "$PREV_SKOOL" ]]; then
    echo "$SKOOL_UPDATE" > "$CACHE_FILE.skool"
    cat <<REPORT
⚠️ **Agentic OS — Impossible de vérifier GitHub**
Le repo upstream est privé. Le PAT GitHub est présent mais n'a pas permis l'accès API.

$SKOOL_UPDATE

**Local HEAD** : ${LOCAL_HASH:0:7}
**Upstream** : GitHub API inaccessible
REPORT
    exit 0
  fi
  echo "[SILENT]"
  exit 0
fi

# ---------- Save hash to cache ----------
echo "$UPSTREAM_SHA" > "$CACHE_FILE"

# ---------- Compare ----------
if [[ "$UPSTREAM_SHA" == "$LOCAL_HASH" ]] || [[ "$UPSTREAM_SHA" == "$PREV_SHA" ]]; then
  echo "[SILENT]"
  exit 0
fi

# ---------- Count new commits ----------
# Fetch upstream
git fetch upstream main --quiet 2>/dev/null || true
BEHIND=$(git rev-list --count HEAD..upstream/main 2>/dev/null || echo 0)

if [[ "$BEHIND" -eq 0 ]]; then
  echo "[SILENT]"
  exit 0
fi

cat <<REPORT
🚀 **Agentic OS — Nouveaux commits dispo !**

**Local** : \`${LOCAL_HASH:0:7}\`
**Upstream** : \`${UPSTREAM_SHA:0:7}\` (${UPSTREAM_DATE:-date inconnue})
**Commits derrière** : $BEHIND

**Dernier message upstream** : ${UPSTREAM_MSG:-N/A}

Pour appliquer les mises à jour : \`bash scripts/update-upstream.sh\`
REPORT
