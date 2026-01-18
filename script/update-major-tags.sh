#!/usr/bin/env bash
# Updates major (vX) and minor (vX.Y) tags to point to the current release.
# This allows users to reference the action as @v2 or @v2.1 instead of @v2.1.4

set -euo pipefail

VERSION="$1"

# Strip leading 'v' if present
VERSION="${VERSION#v}"

# Parse version components
IFS='.' read -r MAJOR MINOR _ <<<"$VERSION"

# Configure git
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"

# Update major tag (e.g., v2)
echo "Updating tag v${MAJOR} to point to v${VERSION}"
git tag -fa "v${MAJOR}" -m "Update v${MAJOR} to v${VERSION}"
git push origin "v${MAJOR}" --force

# Update minor tag (e.g., v2.1)
echo "Updating tag v${MAJOR}.${MINOR} to point to v${VERSION}"
git tag -fa "v${MAJOR}.${MINOR}" -m "Update v${MAJOR}.${MINOR} to v${VERSION}"
git push origin "v${MAJOR}.${MINOR}" --force

echo "Successfully updated major and minor tags"
